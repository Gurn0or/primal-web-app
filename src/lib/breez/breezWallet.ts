import { BreezSDK, type Invoice, type Payment, type NodeState } from '@breeztech/breez-sdk';

export class BreezWallet {
  private sdk: BreezSDK | null = null;
  private nodeState: NodeState | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the Breez SDK wallet
   * @param apiKey - Breez API key
   * @param workingDir - Working directory for SDK data
   */
  async initialize(apiKey: string, workingDir: string): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('Wallet already initialized');
        return;
      }

      // Initialize the Breez SDK
      this.sdk = await BreezSDK.init({
        apiKey,
        workingDir,
        network: 'bitcoin', // or 'testnet'
      });

      // Get initial node state
      this.nodeState = await this.sdk.nodeInfo();
      this.isInitialized = true;
      
      console.log('Breez wallet initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Breez wallet:', error);
      throw new Error(`Wallet initialization failed: ${error}`);
    }
  }

  /**
   * Get the current wallet balance
   * @returns Balance in satoshis
   */
  async getBalance(): Promise<number> {
    this.ensureInitialized();
    
    try {
      const nodeInfo = await this.sdk!.nodeInfo();
      this.nodeState = nodeInfo;
      
      return nodeInfo.channelsBalanceMsat / 1000; // Convert millisats to sats
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error(`Failed to retrieve balance: ${error}`);
    }
  }

  /**
   * Pay a Lightning invoice
   * @param invoice - Lightning invoice (bolt11)
   * @param amountSats - Optional amount in satoshis for zero-amount invoices
   * @returns Payment details
   */
  async payInvoice(invoice: string, amountSats?: number): Promise<Payment> {
    this.ensureInitialized();
    
    try {
      const payment = await this.sdk!.sendPayment({
        bolt11: invoice,
        amountMsat: amountSats ? amountSats * 1000 : undefined,
      });
      
      console.log('Payment sent successfully:', payment.id);
      return payment;
    } catch (error) {
      console.error('Failed to pay invoice:', error);
      throw new Error(`Payment failed: ${error}`);
    }
  }

  /**
   * Create a Lightning invoice
   * @param amountSats - Amount in satoshis
   * @param description - Invoice description
   * @returns Invoice details including bolt11 string
   */
  async createInvoice(amountSats: number, description: string): Promise<Invoice> {
    this.ensureInitialized();
    
    try {
      const invoice = await this.sdk!.receivePayment({
        amountMsat: amountSats * 1000,
        description,
      });
      
      console.log('Invoice created:', invoice.bolt11);
      return invoice;
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw new Error(`Invoice creation failed: ${error}`);
    }
  }

  /**
   * Get payment history
   * @param limit - Maximum number of payments to retrieve
   * @returns Array of payments
   */
  async getPaymentHistory(limit: number = 50): Promise<Payment[]> {
    this.ensureInitialized();
    
    try {
      const payments = await this.sdk!.listPayments({
        limit,
      });
      
      return payments;
    } catch (error) {
      console.error('Failed to get payment history:', error);
      throw new Error(`Failed to retrieve payment history: ${error}`);
    }
  }

  /**
   * Decode a Lightning invoice
   * @param invoice - Lightning invoice (bolt11)
   * @returns Decoded invoice details
   */
  async decodeInvoice(invoice: string): Promise<any> {
    this.ensureInitialized();
    
    try {
      const decodedInvoice = await this.sdk!.parseInvoice(invoice);
      return decodedInvoice;
    } catch (error) {
      console.error('Failed to decode invoice:', error);
      throw new Error(`Invoice decoding failed: ${error}`);
    }
  }

  /**
   * Get the current node state
   * @returns Node state information
   */
  async getNodeState(): Promise<NodeState> {
    this.ensureInitialized();
    
    try {
      this.nodeState = await this.sdk!.nodeInfo();
      return this.nodeState;
    } catch (error) {
      console.error('Failed to get node state:', error);
      throw new Error(`Failed to retrieve node state: ${error}`);
    }
  }

  /**
   * Sync the wallet with the Lightning network
   */
  async sync(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.sdk!.sync();
      console.log('Wallet synced successfully');
    } catch (error) {
      console.error('Failed to sync wallet:', error);
      throw new Error(`Wallet sync failed: ${error}`);
    }
  }

  /**
   * Disconnect and cleanup the wallet
   */
  async disconnect(): Promise<void> {
    if (!this.isInitialized || !this.sdk) {
      return;
    }
    
    try {
      await this.sdk.disconnect();
      this.sdk = null;
      this.nodeState = null;
      this.isInitialized = false;
      
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw new Error(`Wallet disconnect failed: ${error}`);
    }
  }

  /**
   * Check if wallet is initialized
   * @returns true if initialized, false otherwise
   */
  isWalletInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Ensure wallet is initialized before operations
   * @throws Error if wallet is not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.sdk) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }
  }
}

// Export a singleton instance
export const breezWallet = new BreezWallet();
