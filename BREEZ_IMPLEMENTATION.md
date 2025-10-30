# Breez SDK Integration Documentation

This document provides setup instructions, architecture overview, and a step-by-step guide to complete the Breez SDK integration in this repository.

## Prerequisites
- Node.js 18+
- pnpm or npm
- Rust toolchain (for some native deps on certain platforms)
- Android Studio and Xcode for mobile targets (if applicable)
- Valid Lightning node credentials if using a remote LSP

## Branch Context
All work occurs on the `breez-sdk-integration` branch. File paths referenced below are relative to repo root.

## Packages and Key Paths
- src/lib/breez/: local wrapper, types, and storage utilities
- src/lib/breez/breezTypes.ts: domain types mapped from Breez SDK
- src/lib/breez/breezStorage.ts: persistence helpers for node state and invoices
- src/lib/breez/index.ts: primary integration point (init, connect, pay, receive)
- app/components/payments/: UI flows triggering SDK actions

## Install Dependencies
1. Install the Breez SDK bindings
   - Web (wasm) target: `pnpm add @breeztech/react-web @breeztech/wasm-nodejs` (or latest)
   - React Native target: `pnpm add @breeztech/react-native-breez-sdk`
2. If targeting browser:
   - Ensure Vite/Rollup config handles wasm assets
   - Set `optimizeDeps.exclude` for Breez packages if required

## Environment Variables
Create .env files with the following keys:
- VITE_BREEZ_API_KEY=<your_breez_api_key>
- VITE_BREEZ_LSP_NODE=<lsp_or_node_endpoint>
- VITE_BREEZ_NETWORK=mainnet|testnet|signet
- VITE_BREEZ_PERSIST_DIR=IndexedDB|LocalStorage|FS (platform dependent)

Never commit real secrets. Use .env.example.

## Initialization Flow
1. Import and call `initBreez` from src/lib/breez/index.ts during app bootstrap
2. Provide config:
   - network, apiKey, lsp, workingDir/persist provider
   - seed or mnemonic if restoring
3. Subscribe to events (payments, invoices, sync) via the exposed observable/emitters
4. Persist node state using breezStorage helpers on each important event

Example pseudo-code:
```
import { initBreez, getClient } from "@/lib/breez";

await initBreez({
  apiKey: import.meta.env.VITE_BREEZ_API_KEY,
  network: import.meta.env.VITE_BREEZ_NETWORK,
  lsp: import.meta.env.VITE_BREEZ_LSP_NODE,
});

const breez = getClient();
```

## Architecture Overview
- Wrapper Layer (src/lib/breez):
  - Encapsulates SDK init, state, and actions behind a small API surface
  - Maps raw SDK models to internal types (breezTypes)
  - Centralizes storage concerns (breezStorage)
- UI Layer:
  - Calls wrapper methods, subscribes to status and events
  - Displays balances, invoices, and payment states
- Persistence:
  - Uses IndexedDB/LocalStorage (web) or native storage (mobile) via breezStorage
  - Stores: node state, invoices, LNURL auth tokens, cache
- Error Handling:
  - All wrapper calls return Result-like objects with rich errors

## Core Use Cases
- Open Channel/Sync: init connects to LSP and syncs graph/state
- Receive Payment: create invoice, display QR, monitor settlement event
- Send Payment:
  - Bolt11: parse and pay
  - LNURL-pay: resolve and confirm before pay
- On/Off-ramp (optional): via plugin APIs if configured

## Step-by-Step Integration Guide
1. Bootstrap
   - Call `initBreez` at app start; block primary LN actions until ready
   - Show a loading/sync indicator based on wrapper status
2. Account/Keys
   - For custodial demo: allow ephemeral seed
   - For non-custodial: derive seed from user wallet; store encrypted
3. Persistence Set Up
   - Plug breezStorage save/load into wrapper events: onSync, onInvoice, onPayment
4. UI Wiring
   - Send: bind input to `payInvoice`/`payLnurl`
   - Receive: call `createInvoice({ amountMsat, memo })` and render QR
   - History: read from storage and refresh via `listPayments`
5. Network Config
   - Use `VITE_BREEZ_NETWORK` to switch endpoints and fee policies
6. Error States
   - Surface actionable messages (insufficient balance, timeout, route not found)
   - Provide retry and diagnostic logs toggle
7. Testing
   - Use signet/testnet with test LSP; mock balances where needed
   - Add unit tests for breezTypes mapping and breezStorage persistence
8. Security
   - Never log secrets or seed phrases
   - Encrypt any at-rest secrets if device allows

## Commands
- Install: pnpm i
- Dev: pnpm dev
- Build: pnpm build
- Test: pnpm test

## Validation Checklist
- [ ] SDK initializes and syncs without error
- [ ] Can create and settle an invoice on testnet/signet
- [ ] Can send a payment (bolt11 and LNURL)
- [ ] Node state persists across reloads
- [ ] Errors are surfaced with user-friendly messages

## Troubleshooting
- Wasm load errors: verify vite wasm plugin and asset copy settings
- CORS with LSP: confirm allowed origins or proxy locally
- Stuck syncing: ensure correct network and LSP, check time skew
- RN build failures: clean pods/gradle; ensure min SDK versions per Breez docs

## References
- Breez SDK docs: https://sdk-doc.breez.technology
- Examples: https://github.com/breez/breez-sdk-examples
- LNURL spec: https://github.com/lnurl/luds
