// breezZaps.ts
// Complete Nostr zap integration using Breez SDK
// This module provides functions to zap notes, profiles, articles, and live streams.
// It relies on existing Breez initialization and wallet helpers in this project.

import { lnurlPay, parseInvoice, SendPaymentResponse } from '@breeztech/react-native-breez-sdk';
import { getBreezLNClient, ensureBreezInitialized } from './breezInit';
import { getNodeId, payInvoice } from './breezPayments';
import type { ZapTarget, ZapRequest, ZapReceipt, ZapKind } from './breezTypes';

// Types local to this file if not already covered by breezTypes
export type NostrEntityKind = 'note' | 'profile' | 'article' | 'live';

export interface NostrZapParams {
  amountSats: number;
  comment?: string;
  target: ZapTarget; // contains pubkey, relays, and lnurl or lud16
  entityKind: NostrEntityKind;
  entityId: string; // noteId, profile pubkey, article id, or live event id
  extraTags?: string[][]; // additional nostr tags
}

export interface NostrZapResult extends ZapReceipt {
  preimage?: string;
  paymentHash?: string;
  invoice?: string;
}

// Utilities
const SATS_TO_MSAT = (s: number) => BigInt(Math.floor(s * 1000));

function toZapKind(kind: NostrEntityKind): ZapKind {
  switch (kind) {
    case 'note':
      return 'zap_note';
    case 'profile':
      return 'zap_profile';
    case 'article':
      return 'zap_article';
    case 'live':
      return 'zap_live';
    default:
      return 'zap_note';
  }
}

// Construct a nostr zap request payload compliant with NIP-57
function buildZapRequest(params: NostrZapParams): ZapRequest {
  const { amountSats, comment, target, entityKind, entityId, extraTags } = params;

  const amountMsat = SATS_TO_MSAT(amountSats).toString();
  const tags: string[][] = [
    ['amount', amountMsat],
    ['relays', ...(target.relays ?? [])],
    ['p', target.pubkey],
  ];

  // NIP-57 entity tags
  switch (entityKind) {
    case 'note':
      tags.push(['e', entityId]);
      break;
    case 'profile':
      // no extra tag required beyond 'p'
      break;
    case 'article':
      tags.push(['a', entityId]);
      break;
    case 'live':
      tags.push(['a', entityId]);
      tags.push(['t', 'live']);
      break;
  }

  if (comment && comment.trim()) {
    tags.push(['comment', comment.trim()]);
  }

  if (extraTags && extraTags.length) {
    for (const t of extraTags) {
      if (Array.isArray(t) && t.length >= 2) tags.push(t);
    }
  }

  const zapKind = toZapKind(entityKind);
  return {
    kind: zapKind,
    content: comment ?? '',
    tags,
  };
}

// Resolve LNURL or LUD16 to a payRequest and construct zap invoice with nostr payload
async function fetchZapInvoice(target: ZapTarget, zapReq: ZapRequest, amountSats: number): Promise<string> {
  // Prefer lnurl if provided, otherwise try lud16
  const lnurlOrLud16 = target.lnurl ?? target.lud16;
  if (!lnurlOrLud16) throw new Error('No lnurl or lud16 provided on target for zapping');

  // Encode zap request as NIP-57 nostr parameter
  const nostrPayload = JSON.stringify(zapReq);

  const payRes = await lnurlPay({
    request: lnurlOrLud16,
    amountMsat: Number(SATS_TO_MSAT(amountSats)),
    comment: zapReq.content ?? undefined,
    // Breez SDK custom field for NIP-57
    // Many providers accept `nostr` field containing the zap request event JSON
    extra: { nostr: nostrPayload },
  });

  if (!payRes?.invoice) throw new Error('Failed to fetch zap invoice');
  return payRes.invoice;
}

async function performPayment(invoice: string): Promise<NostrZapResult> {
  // ensure breez is initialized and client is available
  await ensureBreezInitialized();
  const ln = await getBreezLNClient();

  // Pay invoice using shared payment helper for consistent UX/logging
  const payRes: SendPaymentResponse = await payInvoice(invoice);

  const parsed = parseInvoice({ invoice });

  return {
    ok: true,
    amountMsat: parsed.amountMsat ?? undefined,
    invoice,
    preimage: payRes.payment?.paymentPreimage,
    paymentHash: payRes.payment?.paymentHash,
    feesMsat: payRes.payment?.feeMsat,
    nodeId: await getNodeId(ln),
    timestamp: Date.now(),
  };
}

export async function zapNote(params: Omit<NostrZapParams, 'entityKind'>): Promise<NostrZapResult> {
  const zapReq = buildZapRequest({ ...params, entityKind: 'note' });
  const invoice = await fetchZapInvoice(params.target, zapReq, params.amountSats);
  return performPayment(invoice);
}

export async function zapProfile(params: Omit<NostrZapParams, 'entityKind'>): Promise<NostrZapResult> {
  const zapReq = buildZapRequest({ ...params, entityKind: 'profile' });
  const invoice = await fetchZapInvoice(params.target, zapReq, params.amountSats);
  return performPayment(invoice);
}

export async function zapArticle(params: Omit<NostrZapParams, 'entityKind'>): Promise<NostrZapResult> {
  const zapReq = buildZapRequest({ ...params, entityKind: 'article' });
  const invoice = await fetchZapInvoice(params.target, zapReq, params.amountSats);
  return performPayment(invoice);
}

export async function zapLive(params: Omit<NostrZapParams, 'entityKind'>): Promise<NostrZapResult> {
  const zapReq = buildZapRequest({ ...params, entityKind: 'live' });
  const invoice = await fetchZapInvoice(params.target, zapReq, params.amountSats);
  return performPayment(invoice);
}

// Convenience unified entry
export async function zap(params: NostrZapParams): Promise<NostrZapResult> {
  switch (params.entityKind) {
    case 'note':
      return zapNote(params);
    case 'profile':
      return zapProfile(params);
    case 'article':
      return zapArticle(params);
    case 'live':
      return zapLive(params);
    default:
      throw new Error('Unsupported zap entity kind');
  }
}

// Example target structure reminder:
// const target: ZapTarget = {
//   pubkey: 'npub1...',
//   relays: ['wss://relay.damus.io', 'wss://nos.lol'],
//   lnurl: 'LNURL1...', // or
//   lud16: 'name@domain.tld',
// };
