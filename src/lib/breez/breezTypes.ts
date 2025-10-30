// TypeScript type definitions for Breez SDK

export interface BreezConfig {
  apiKey: string;
  workingDir: string;
  network: 'bitcoin' | 'testnet' | 'signet' | 'regtest';
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

export interface WalletState {
  balance: number;
  channelBalance: number;
  onchainBalance: number;
  pendingReceive: number;
  pendingSend: number;
  maxPayable: number;
  maxReceivable: number;
  connectedPeers: number;
  inboundLiquidity: number;
  outboundLiquidity: number;
}

export enum PaymentStatus {
  Pending = 'Pending',
  Complete = 'Complete',
  Failed = 'Failed',
}

export interface NodeInfo {
  id: string;
  alias?: string;
  color?: string;
  network: string;
  blockHeight: number;
  syncedToChain: boolean;
}

export interface Payment {
  id: string;
  paymentType: 'sent' | 'received';
  paymentTime: number;
  amount: number;
  fee: number;
  status: PaymentStatus;
  description?: string;
  invoice?: string;
  preimage?: string;
  destination?: string;
}

export interface Invoice {
  bolt11: string;
  paymentHash: string;
  description?: string;
  amount?: number;
  expiry?: number;
  timestamp?: number;
}

export interface PaymentRequest {
  bolt11: string;
  amount?: number;
}

export interface ReceivePaymentRequest {
  amount: number;
  description?: string;
  expiry?: number;
}

export interface ReceivePaymentResponse {
  invoice: Invoice;
  openingFeeParams?: OpeningFeeParams;
}

export interface OpeningFeeParams {
  minMsat: number;
  proportional: number;
  validUntil: string;
  maxIdleTime: number;
  maxClientToSelfDelay: number;
  promise: string;
}

export interface LnUrlPayRequest {
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
  commentAllowed?: number;
  tag: string;
}

export interface LnUrlWithdrawRequest {
  callback: string;
  k1: string;
  defaultDescription: string;
  minWithdrawable: number;
  maxWithdrawable: number;
}

export interface LnUrlAuthRequest {
  k1: string;
  action?: string;
  domain: string;
  url: string;
}

export interface ListPaymentsRequest {
  filters?: PaymentTypeFilter[];
  fromTimestamp?: number;
  toTimestamp?: number;
  includeFailures?: boolean;
  offset?: number;
  limit?: number;
}

export enum PaymentTypeFilter {
  Sent = 'Sent',
  Received = 'Received',
  ClosedChannel = 'ClosedChannel',
}

export interface RecommendedFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export interface SwapInfo {
  bitcoinAddress: string;
  createdAt: number;
  lockHeight: number;
  paymentHash: Uint8Array;
  preimage: Uint8Array;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  swapperPublicKey: Uint8Array;
  script: Uint8Array;
  bolt11?: string;
  paidSats: number;
  unconfirmedSats: number;
  confirmedSats: number;
  status: SwapStatus;
  refundTxIds: string[];
  unconfirmedTxIds: string[];
  confirmedTxIds: string[];
  minAllowedDeposit: number;
  maxAllowedDeposit: number;
  lastRedeemError?: string;
  channelOpeningFees?: OpeningFeeParams;
}

export enum SwapStatus {
  Initial = 'Initial',
  Expired = 'Expired',
  Refundable = 'Refundable',
}

export interface LspInformation {
  id: string;
  name: string;
  widgetUrl: string;
  pubkey: string;
  host: string;
  baseFeeMsat: number;
  feeRate: number;
  timeLockDelta: number;
  minHtlcMsat: number;
  lspPubkey: Uint8Array;
  openingFeeParamsList: OpeningFeeParams[];
}

export interface BreezEvent {
  type: 'invoicePaid' | 'synced' | 'paymentFailed' | 'paymentSucceeded' | 'backupStarted' | 'backupSucceeded' | 'backupFailed';
  details?: any;
}

export interface BackupStatus {
  backedUp: boolean;
  lastBackupTime?: number;
}
