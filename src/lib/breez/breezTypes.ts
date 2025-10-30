// Breez SDK Spark Type Definitions
// Complete TypeScript types for Breez SDK Spark implementation

/**
 * Configuration for initializing the Breez SDK
 */
export interface BreezConfig {
  apiKey: string;
  network?: 'mainnet' | 'testnet' | 'signet';
  workingDir?: string;
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Wallet state information
 */
export interface BreezWalletState {
  balance: number;
  pendingReceive: number;
  pendingSend: number;
  maxReceivable: number;
  maxPayable: number;
  channelState: ChannelState;
  connectedPeers: string[];
  inboundLiquidityMsats: number;
  outboundLiquidityMsats: number;
}

/**
 * Channel state enumeration
 */
export enum ChannelState {
  PENDING_OPEN = 'PENDING_OPEN',
  OPENED = 'OPENED',
  PENDING_CLOSE = 'PENDING_CLOSE',
  CLOSED = 'CLOSED'
}

/**
 * Payment request details
 */
export interface PaymentRequest {
  bolt11: string;
  paymentHash?: string;
  amount?: number;
  description?: string;
  timestamp?: number;
  expiry?: number;
  payee?: string;
}

/**
 * Response from a payment operation
 */
export interface PaymentResponse {
  paymentHash: string;
  paymentPreimage?: string;
  amount: number;
  fee: number;
  status: PaymentStatus;
  timestamp: number;
  destination?: string;
  description?: string;
}

/**
 * Payment status enumeration
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED'
}

/**
 * Invoice details for receiving payments
 */
export interface InvoiceDetails {
  bolt11: string;
  paymentHash: string;
  amount: number;
  description?: string;
  createdAt: number;
  expiresAt: number;
  settled: boolean;
  settledAt?: number;
}

/**
 * Request to create an invoice
 */
export interface CreateInvoiceRequest {
  amountSats: number;
  description?: string;
  expiry?: number;
}

/**
 * Lightning network node information
 */
export interface NodeInfo {
  nodeId: string;
  alias?: string;
  color?: string;
  connectivityStatus: ConnectivityStatus;
}

/**
 * Connectivity status enumeration
 */
export enum ConnectivityStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING'
}

/**
 * Payment details from the payment history
 */
export interface Payment {
  id: string;
  paymentType: PaymentType;
  paymentTime: number;
  amount: number;
  fee: number;
  status: PaymentStatus;
  description?: string;
  paymentHash: string;
  bolt11?: string;
}

/**
 * Payment type enumeration
 */
export enum PaymentType {
  SENT = 'SENT',
  RECEIVED = 'RECEIVED'
}

/**
 * Fee information for a potential payment
 */
export interface FeeEstimate {
  feeMsat: number;
  feePercent: number;
}

/**
 * LSP (Lightning Service Provider) information
 */
export interface LspInformation {
  id: string;
  name: string;
  pubkey: string;
  host: string;
  baseFeeMsat: number;
  feeRate: number;
  timeLockDelta: number;
  minHtlcMsat: number;
  channelCapacity: number;
  channelFeePermyriad: number;
  channelMinimumFeeMsat: number;
}

/**
 * Receive payment request
 */
export interface ReceivePaymentRequest {
  amountMsat: number;
  description?: string;
  preimage?: string;
  openingFeeParams?: OpeningFeeParams;
}

/**
 * Opening fee parameters for receiving payments
 */
export interface OpeningFeeParams {
  minMsat: number;
  proportional: number;
  validUntil: string;
  maxIdleTime: number;
  maxClientToSelfDelay: number;
  promise: string;
}

/**
 * Send payment request
 */
export interface SendPaymentRequest {
  bolt11: string;
  amountMsat?: number;
}

/**
 * Send spontaneous payment request
 */
export interface SendSpontaneousPaymentRequest {
  nodeId: string;
  amountMsat: number;
}

/**
 * Decoded BOLT11 invoice
 */
export interface DecodedInvoice {
  bolt11: string;
  network: string;
  payeePubkey: string;
  paymentHash: string;
  description?: string;
  descriptionHash?: string;
  amountMsat?: number;
  timestamp: number;
  expiry: number;
  routingHints: RouteHint[];
  paymentSecret: string;
  minFinalCltvExpiryDelta: number;
}

/**
 * Route hint for payment routing
 */
export interface RouteHint {
  hops: RouteHintHop[];
}

/**
 * Individual hop in a route hint
 */
export interface RouteHintHop {
  srcNodeId: string;
  shortChannelId: string;
  feesBaseMsat: number;
  feesProportionalMillionths: number;
  cltvExpiryDelta: number;
  htlcMinimumMsat?: number;
  htlcMaximumMsat?: number;
}

/**
 * Event emitted by the Breez SDK
 */
export type BreezEvent =
  | { type: 'newBlock'; block: number }
  | { type: 'invoicePaid'; details: InvoiceDetails }
  | { type: 'synced' }
  | { type: 'paymentSucceeded'; details: Payment }
  | { type: 'paymentFailed'; error: string }
  | { type: 'channelOpened'; channelId: string }
  | { type: 'channelClosed'; channelId: string };

/**
 * Event listener type
 */
export type BreezEventListener = (event: BreezEvent) => void;

/**
 * Main Breez SDK interface
 */
export interface BreezSDK {
  // Initialization
  connect(config: BreezConfig): Promise<void>;
  disconnect(): Promise<void>;
  
  // Wallet state
  getWalletState(): Promise<BreezWalletState>;
  getNodeInfo(): Promise<NodeInfo>;
  
  // Payments
  sendPayment(request: SendPaymentRequest): Promise<PaymentResponse>;
  sendSpontaneousPayment(request: SendSpontaneousPaymentRequest): Promise<PaymentResponse>;
  receivePayment(request: ReceivePaymentRequest): Promise<InvoiceDetails>;
  
  // Invoices
  createInvoice(request: CreateInvoiceRequest): Promise<InvoiceDetails>;
  decodeInvoice(bolt11: string): Promise<DecodedInvoice>;
  
  // Payment history
  listPayments(): Promise<Payment[]>;
  getPayment(paymentHash: string): Promise<Payment | null>;
  
  // Fees
  estimateFee(bolt11: string): Promise<FeeEstimate>;
  
  // LSP
  getLspInfo(): Promise<LspInformation>;
  connectLsp(lspId: string): Promise<void>;
  
  // Events
  addEventListener(listener: BreezEventListener): void;
  removeEventListener(listener: BreezEventListener): void;
}

/**
 * Error types specific to Breez SDK operations
 */
export class BreezError extends Error {
  constructor(
    message: string,
    public code: BreezErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BreezError';
  }
}

/**
 * Error codes for Breez SDK operations
 */
export enum BreezErrorCode {
  GENERIC = 'GENERIC',
  SERVICE_CONNECTIVITY = 'SERVICE_CONNECTIVITY',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  INVALID_INPUT = 'INVALID_INPUT',
  INVOICE_EXPIRED = 'INVOICE_EXPIRED',
  INVOICE_ALREADY_PAID = 'INVOICE_ALREADY_PAID',
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
  ROUTE_TOO_EXPENSIVE = 'ROUTE_TOO_EXPENSIVE',
  PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS'
}
