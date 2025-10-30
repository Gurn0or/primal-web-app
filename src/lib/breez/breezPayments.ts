import { BreezEvent, InputType, Invoice, NodeState, Payment, PaymentDetails, PaymentFailureReason, PaymentStatus, ReceivePaymentRequest, SendPaymentRequest, getPayments, lnurlAuth, lnurlPay, lnurlWithdraw, parseInput, sendPayment, receivePayment, breezSdk } from '@breeztech/react-native-breez-sdk';
import { initBreezIfNeeded } from './breezInit';
import { getWalletNodeId, isBreezReady } from './breezWallet';
import type { BreezInitResult } from './breezTypes';

// Central event listeners registry
const eventListeners: Set<(e: BreezEvent) => void> = new Set();
let unsubscribeEvents: (() => void) | null = null;

export async function ensureBreezReady(): Promise<BreezInitResult> {
  const ready = await isBreezReady();
  if (!ready) {
    return initBreezIfNeeded();
  }
  return { ready: true } as BreezInitResult;
}

// Payment event handling
export function onBreezEvent(listener: (e: BreezEvent) => void): () => void {
  eventListeners.add(listener);
  // Start subscription if first
  if (!unsubscribeEvents) {
    unsubscribeEvents = breezSdk.addEventListener((e) => {
      for (const l of eventListeners) {
        try { l(e); } catch (_) { /* no-op */ }
      }
    });
  }
  return () => {
    eventListeners.delete(listener);
    if (eventListeners.size === 0 && unsubscribeEvents) {
      try { unsubscribeEvents(); } catch (_) { /* ignore */ }
      unsubscribeEvents = null;
    }
  };
}

// Send a payment using a BOLT11 invoice, LNURL-Pay, or Lightning address
export async function pay(input: string): Promise<Payment> {
  await ensureBreezReady();
  const parsed = await parseInput({ input });
  switch (parsed.type) {
    case InputType.BOLT11: {
      const req: SendPaymentRequest = { bolt11: parsed.bolt11, amountMsat: parsed.amountMsat ?? undefined };
      const res = await sendPayment(req);
      if (res.payment?.status !== PaymentStatus.COMPLETE) throw new Error('Payment not completed');
      return res.payment;
    }
    case InputType.LNURL_PAY: {
      const res = await lnurlPay({ data: parsed.data });
      if (res.payment?.status !== PaymentStatus.COMPLETE) throw new Error('LNURL pay not completed');
      return res.payment;
    }
    case InputType.LUD16: // lightning address
    case InputType.LNURL: {
      const res = await lnurlPay({ data: parsed.data });
      if (res.payment?.status !== PaymentStatus.COMPLETE) throw new Error('Payment not completed');
      return res.payment;
    }
    default:
      throw new Error('Unsupported payment input');
  }
}

// Receive a payment: creates invoice and waits for settlement optionally
export type ReceiveOptions = {
  amountMsat: number;
  description?: string;
  expirySecs?: number;
  waitForPayment?: boolean;
};

export async function requestPayment(opts: ReceiveOptions): Promise<{ invoice: Invoice; payment?: Payment }>{
  await ensureBreezReady();
  const req: ReceivePaymentRequest = {
    amountMsat: BigInt(opts.amountMsat),
    description: opts.description ?? 'Payment',
    expiry: opts.expirySecs ? BigInt(opts.expirySecs) : undefined,
  } as unknown as ReceivePaymentRequest;
  const { lnInvoice } = await receivePayment(req);
  let settled: Payment | undefined;
  if (opts.waitForPayment) {
    settled = await waitForInvoicePaid(lnInvoice);
  }
  return { invoice: lnInvoice, payment: settled };
}

// Waits for a payment event matching the invoice
export function waitForInvoicePaid(invoice: Invoice): Promise<Payment> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      off();
      reject(new Error('Timeout waiting for payment'));
    }, 10 * 60 * 1000);

    const off = onBreezEvent((e) => {
      if (e.type === 'invoicePaid' || e.type === 'paymentReceived' || e.type === 'paymentSucceeded') {
        const p = (e as any).details?.payment as Payment | undefined;
        if (p && matchInvoice(p, invoice)) {
          clearTimeout(timeout);
          off();
          resolve(p);
        }
      }
    });
  });
}

function matchInvoice(p: Payment, invoice: Invoice): boolean {
  try {
    if (p.details?.type === 'LN') {
      const d = p.details as PaymentDetails.Ln;
      return d.bolt11 === invoice.bolt11 || d.paymentHash === (invoice.paymentHash as any);
    }
  } catch (_) {}
  return false;
}

// History utilities
export type PaymentHistoryFilters = {
  limit?: number;
  offset?: number;
};

export async function getPaymentHistory(filters: PaymentHistoryFilters = {}): Promise<Payment[]> {
  await ensureBreezReady();
  const res = await getPayments({ offset: filters.offset ?? 0, limit: filters.limit ?? 50 });
  return res?.payments ?? [];
}

// Convenience helpers
export async function getMyNodeId(): Promise<string> {
  await ensureBreezReady();
  const id = await getWalletNodeId();
  return id ?? '';
}

export async function canReceive(): Promise<boolean> {
  await ensureBreezReady();
  try {
    const id = await getMyNodeId();
    return !!id;
  } catch {
    return false;
  }
}
