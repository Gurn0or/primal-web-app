// src/lib/breez/breezPayments.ts
// Breez SDK Spark API wrappers for payments
// NOTE: Ensure BREEZ_API_KEY is set in environment and passed to server-side calls only.

export type PaymentStatus = "pending" | "completed" | "failed";

export interface PayInvoiceParams {
  bolt11: string;
  amountMsat?: number; // optional override for zero-amount invoices
  timeoutSeconds?: number;
}

export interface CreateInvoiceParams {
  amountMsat: number; // millisatoshis
  description?: string;
  expirySeconds?: number;
}

export interface PaymentRecord {
  id: string;
  bolt11?: string;
  amountMsat: number;
  feesMsat?: number;
  status: PaymentStatus;
  createdAt: string; // ISO date
  completedAt?: string; // ISO date
  description?: string;
  direction: "incoming" | "outgoing";
}

export interface BreezSparkError extends Error {
  code?: string | number;
  details?: unknown;
}

// Internal helper to call Breez Spark API
async function callBreez<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.BREEZ_API_KEY;
  if (!apiKey) {
    const err = new Error("BREEZ_API_KEY missing in environment") as BreezSparkError;
    err.code = "CONFIG_MISSING";
    throw err;
  }

  const url = `https://sdk.breez.technology/spark${path}`; // Spark HTTP bridge
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`Breez request failed: ${res.status} ${res.statusText} ${text}`) as BreezSparkError;
      err.code = res.status;
      try {
        err.details = JSON.parse(text);
      } catch {}
      throw err;
    }

    const data = (await res.json()) as T;
    return data;
  } catch (e: any) {
    const err = new Error(e?.message || "Network error calling Breez") as BreezSparkError;
    err.code = e?.code;
    err.details = e;
    throw err;
  }
}

// Pay a Lightning invoice
export async function payInvoice(params: PayInvoiceParams): Promise<PaymentRecord> {
  const { bolt11, amountMsat, timeoutSeconds } = params;
  if (!bolt11) {
    const err = new Error("bolt11 is required") as BreezSparkError;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  type SparkPayResponse = {
    id: string;
    bolt11: string;
    amount_msat: number;
    fee_msat?: number;
    status: PaymentStatus;
    created_at: string;
    completed_at?: string;
    description?: string;
  };

  const resp = await callBreez<SparkPayResponse>("/pay_invoice", {
    bolt11,
    amount_msat: amountMsat,
    timeout_secs: timeoutSeconds,
  });

  return {
    id: resp.id,
    bolt11: resp.bolt11,
    amountMsat: resp.amount_msat,
    feesMsat: resp.fee_msat,
    status: resp.status,
    createdAt: new Date(resp.created_at).toISOString(),
    completedAt: resp.completed_at ? new Date(resp.completed_at).toISOString() : undefined,
    description: resp.description,
    direction: "outgoing",
  };
}

// Create a Lightning invoice
export async function createInvoice(params: CreateInvoiceParams): Promise<{ bolt11: string; id: string; expiry: number } & PaymentRecord> {
  const { amountMsat, description, expirySeconds } = params;
  if (!Number.isFinite(amountMsat) || amountMsat <= 0) {
    const err = new Error("amountMsat must be > 0") as BreezSparkError;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  type SparkInvoiceResponse = {
    id: string;
    bolt11: string;
    amount_msat: number;
    status: PaymentStatus;
    created_at: string;
    expiry_secs: number;
    description?: string;
  };

  const resp = await callBreez<SparkInvoiceResponse>("/create_invoice", {
    amount_msat: amountMsat,
    description,
    expiry_secs: expirySeconds,
  });

  const record: PaymentRecord = {
    id: resp.id,
    bolt11: resp.bolt11,
    amountMsat: resp.amount_msat,
    status: resp.status,
    createdAt: new Date(resp.created_at).toISOString(),
    description: resp.description,
    direction: "incoming",
  };

  return { bolt11: resp.bolt11, id: resp.id, expiry: resp.expiry_secs, ...record };
}

// Check the status of a specific payment by id
export async function checkPaymentStatus(id: string): Promise<PaymentRecord> {
  if (!id) {
    const err = new Error("id is required") as BreezSparkError;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  type SparkStatusResponse = {
    id: string;
    bolt11?: string;
    amount_msat: number;
    fee_msat?: number;
    status: PaymentStatus;
    created_at: string;
    completed_at?: string;
    description?: string;
    direction: "incoming" | "outgoing";
  };

  const resp = await callBreez<SparkStatusResponse>("/payment_status", { id });

  return {
    id: resp.id,
    bolt11: resp.bolt11,
    amountMsat: resp.amount_msat,
    feesMsat: resp.fee_msat,
    status: resp.status,
    createdAt: new Date(resp.created_at).toISOString(),
    completedAt: resp.completed_at ? new Date(resp.completed_at).toISOString() : undefined,
    description: resp.description,
    direction: resp.direction,
  };
}

// List recent payments
export interface ListPaymentsParams {
  limit?: number; // default 50
  direction?: "incoming" | "outgoing" | "all";
}

export async function listPayments(params: ListPaymentsParams = {}): Promise<PaymentRecord[]> {
  const { limit = 50, direction = "all" } = params;

  type SparkListResponse = {
    payments: Array<{
      id: string;
      bolt11?: string;
      amount_msat: number;
      fee_msat?: number;
      status: PaymentStatus;
      created_at: string;
      completed_at?: string;
      description?: string;
      direction: "incoming" | "outgoing";
    }>;
  };

  const resp = await callBreez<SparkListResponse>("/list_payments", { limit, direction });

  return resp.payments.map((p) => ({
    id: p.id,
    bolt11: p.bolt11,
    amountMsat: p.amount_msat,
    feesMsat: p.fee_msat,
    status: p.status,
    createdAt: new Date(p.created_at).toISOString(),
    completedAt: p.completed_at ? new Date(p.completed_at).toISOString() : undefined,
    description: p.description,
    direction: p.direction,
  }));
}

// Utility: narrow unknown errors to BreezSparkError consistently
export function toBreezError(e: unknown): BreezSparkError {
  if (e instanceof Error) return e as BreezSparkError;
  const err = new Error("Unknown error") as BreezSparkError;
  err.details = e;
  return err;
}
