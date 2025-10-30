// src/lib/breez/breezWallet.ts
// Comet Assistant: BreezWallet implementation using Breez SDK Spark patterns
// NOTE: This module wraps common wallet flows: init, balance, pay, invoice, history, teardown.
// It relies on existing breezInit.ts and breezTypes.ts in this folder.

import {
  BreezServices,
  NodeConfig,
  defaultConfig,
  EnvironmentType,
  loadStoredLspId,
  saveLspId,
  loadStoredMnemonic,
  saveMnemonic,
  BreezEvent,
  PaymentDetails,
  LNInvoice,
  RouteHint,
  parseInvoice,
  listPayments,
  Payment,
  sendPayment,
  receivePayment,
  getBalance,
  connectLsp,
  connect,
  disconnect,
  createMnemonic,
} from './breezInit'
import type { InitOptions, PayResult, InvoiceResult, WalletBalance, HistoryFilter } from './breezTypes'

/**
 * BreezWallet provides a high-level API around Breez SDK Spark flows.
 * All methods are safe to call repeatedly; initialization is idempotent.
 */
export class BreezWallet {
  private static instance: BreezWallet | null = null
  private services: BreezServices | null = null
  private initialized = false
  private eventsUnsubscribe: (() => void) | null = null

  static getInstance(): BreezWallet {
    if (!BreezWallet.instance) BreezWallet.instance = new BreezWallet()
    return BreezWallet.instance
  }

  /** Initialize the Breez SDK services and connect to an LSP if needed. */
  async init(options: InitOptions): Promise<void> {
    if (this.initialized && this.services) return

    // Validate options
    if (!options || !options.apiKey) {
      throw new Error('BreezWallet.init: apiKey is required')
    }

    const env: EnvironmentType = options.environment ?? 'production'

    // Build config following Spark examples
    const config: NodeConfig = defaultConfig(env)

    // Create or load mnemonic
    let mnemonic = await loadStoredMnemonic()
    if (!mnemonic) {
      mnemonic = await createMnemonic()
      await saveMnemonic(mnemonic)
    }

    // Start services
    this.services = new BreezServices({
      apiKey: options.apiKey,
      config,
      mnemonic,
      workingDir: options.workingDir,
      network: options.network ?? 'bitcoin',
    })

    // Attach event listener (log and bubble up via callback)
    if (options.onEvent) {
      this.eventsUnsubscribe = this.services.on((e: BreezEvent) => {
        try { options.onEvent?.(e) } catch (_) { /* noop */ }
      })
    }

    // Connect node
    await connect(this.services)

    // Connect to LSP if not connected
    try {
      const existingLsp = await loadStoredLspId()
      if (!existingLsp) {
        const lspId = await connectLsp(this.services)
        await saveLspId(lspId)
      }
    } catch (e) {
      // Non-fatal; payments may still work via existing channels
      console.warn('BreezWallet.init: LSP connect warning', e)
    }

    this.initialized = true
  }

  /** Get wallet balance (on-chain and lightning if available). */
  async balance(): Promise<WalletBalance> {
    const svc = this.assertReady()
    const b = await getBalance(svc)
    return {
      sats: b.sats,
      msats: b.msats,
      onchainSats: b.onchainSats ?? 0,
      lightningSats: b.lightningSats ?? b.sats,
    }
  }

  /** Send a payment to a BOLT11 invoice string. */
  async pay(invoice: string, amountSats?: number): Promise<PayResult> {
    const svc = this.assertReady()
    if (!invoice) throw new Error('pay: invoice required')

    // Parse to validate and allow amount override when invoice is amountless
    const parsed: LNInvoice = await parseInvoice(invoice)

    if (!parsed.amountMsat && !amountSats) {
      throw new Error('pay: amount required for amountless invoice')
    }

    const amountMsat = amountSats ? BigInt(amountSats) * 1000n : parsed.amountMsat

    const res = await sendPayment(svc, {
      bolt11: invoice,
      amountMsat,
      // Route hints if any (leave undefined to let SDK determine)
      routeHints: parsed.routeHints as RouteHint[] | undefined,
      timeoutSecs: 60,
    })

    return {
      paymentId: res.paymentId,
      feesMsat: res.feesMsat,
      preimage: res.preimage,
      status: res.status,
    }
  }

  /** Create a BOLT11 invoice to receive sats. */
  async invoice(amountSats: number, description?: string): Promise<InvoiceResult> {
    const svc = this.assertReady()
    if (!amountSats || amountSats <= 0) throw new Error('invoice: amountSats must be > 0')

    const res = await receivePayment(svc, {
      amountMsat: BigInt(amountSats) * 1000n,
      description: description ?? 'Payment',
      expirySecs: 3600, // 1 hour default
    })

    return {
      bolt11: res.bolt11,
      amountSats,
      description: description ?? 'Payment',
      expiresAt: res.expiresAt,
    }
  }

  /** List payments with optional filtering and pagination. */
  async history(filter?: HistoryFilter): Promise<Payment[]> {
    const svc = this.assertReady()
    const res = await listPayments(svc, {
      fromTimestampSec: filter?.fromSec,
      toTimestampSec: filter?.toSec,
      offset: filter?.offset ?? 0,
      limit: filter?.limit ?? 50,
      includeFailed: filter?.includeFailed ?? false,
    })
    return res.items
  }

  /** Gracefully stop services. */
  async shutdown(): Promise<void> {
    if (!this.services) return
    try {
      await disconnect(this.services)
    } finally {
      try { this.eventsUnsubscribe?.() } catch (_) { /* noop */ }
      this.eventsUnsubscribe = null
      this.services = null
      this.initialized = false
    }
  }

  private assertReady(): BreezServices {
    if (!this.initialized || !this.services) {
      throw new Error('BreezWallet is not initialized')
    }
    return this.services
  }
}

// Convenience singleton exports
export const breezWallet = BreezWallet.getInstance()

// Helper: one-shot ensure init
export async function ensureBreez(options: InitOptions) {
  await breezWallet.init(options)
  return breezWallet
}
