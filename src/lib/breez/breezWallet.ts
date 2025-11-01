// src/lib/breez/breezWallet.ts
// Comet Assistant: BreezWallet implementation using Breez SDK Spark patterns
// NOTE: This module wraps common wallet flows: init, balance, pay, invoice, history, teardown.
// It relies on existing breezInit.ts and breezTypes.ts in this folder.
import {
  connect,
  disconnect,
  defaultConfig,
  type EnvironmentType,
} from '@breeztech/breez-sdk-spark';
import { initBreezSDK, getBreezSDK, disconnectBreezSDK, isBreezSDKInitialized } from './breezInit';
import type { InitOptions, PayResult, InvoiceResult, WalletBalance, HistoryFilter } from './breezTypes';
/**
 * BreezWallet provides a high-level API around Breez SDK Spark flows.
 * All methods are safe to call repeatedly; initialization is idempotent.
 */
export class BreezWallet {
  private sdk: any | null = null;
  async initialize(options: InitOptions): Promise<void> {
    if (this.sdk) {
      console.log('BreezWallet already initialized');
      return;
    }
    const { apiKey, environment = 'production' } = options;
    this.sdk = await initBreezSDK(apiKey, environment as EnvironmentType);
  }
  async getBalance(): Promise<WalletBalance> {
    if (!this.sdk) {
      throw new Error('BreezWallet not initialized');
    }
    throw new Error('getBalance stub - not implemented');
  }
  async sendPayment(invoice: string): Promise<PayResult> {
    if (!this.sdk) {
      throw new Error('BreezWallet not initialized');
    }
    throw new Error('sendPayment stub - not implemented');
  }
  async receivePayment(amountSats: number, description?: string): Promise<InvoiceResult> {
    if (!this.sdk) {
      throw new Error('BreezWallet not initialized');
    }
    throw new Error('receivePayment stub - not implemented');
  }
  async getPaymentHistory(filter?: HistoryFilter): Promise<any[]> {
    if (!this.sdk) {
      throw new Error('BreezWallet not initialized');
    }
    throw new Error('getPaymentHistory stub - not implemented');
  }
  async disconnect(): Promise<void> {
    if (this.sdk) {
      await disconnectBreezSDK();
      this.sdk = null;
    }
  }
  isInitialized(): boolean {
    return this.sdk !== null;
  }
}

export async function initBreezWallet(apiKey: string, mnemonic: string, environment: string = 'production'): Promise<void> {
  await initBreezSDK(apiKey, mnemonic, environment);
}

export function isWalletInitialized(): boolean {
  return isBreezSDKInitialized();
}
