// src/lib/breez/breezWallet.ts
// Comet Assistant: BreezWallet implementation using Breez SDK Spark patterns
// NOTE: This module wraps common wallet flows: init, balance, pay, invoice, history, teardown.
// It relies on existing breezInit.ts and breezTypes.ts in this folder.
import {
  connect,
  disconnect,
  defaultConfig,
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
    this.sdk = await initBreezSDK(apiKey, environment);
  }

  async getBalance(): Promise<WalletBalance> {
    if (!this.sdk) {
      throw new Error('BreezWallet not initialized');
    }
    throw new Error('getBalance stub - not implemented');
  }

  async pay(invoice: string): Promise<PayResult> {
    if (!this.sdk) {
      throw new Error('BreezWallet not initialized');
    }
    throw new Error('pay stub - not implemented');
  }

  async createInvoice(amount: number, description: string): Promise<InvoiceResult> {
    if (!this.sdk) {
      throw new Error('BreezWallet not initialized');
    }
    throw new Error('createInvoice stub - not implemented');
  }

  async getHistory(filter?: HistoryFilter): Promise<any[]> {
    if (!this.sdk) {
      throw new Error('BreezWallet not initialized');
    }
    throw new Error('getHistory stub - not implemented');
  }

  async disconnect(): Promise<void> {
    if (!this.sdk) return;
    await disconnectBreezSDK();
    this.sdk = null;
  }

  // Helper to reconfigure environment if needed (reinitialize)
  async reconfigure(apiKey: string, environment: string = 'production'): Promise<void> {
    await this.disconnect();
    this.sdk = await initBreezSDK(apiKey, environment);
  }
}
