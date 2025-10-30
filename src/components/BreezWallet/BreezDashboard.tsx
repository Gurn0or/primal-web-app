import { Component, createSignal, createEffect, For } from 'solid-js';
import { useAccountContext } from '../../contexts/AccountContext';

import styles from './BreezWallet.module.scss';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  timestamp: number;
  description?: string;
  status: 'completed' | 'pending' | 'failed';
}

const BreezDashboard: Component = () => {
  const account = useAccountContext();

  // Wallet state
  const [balance, setBalance] = createSignal(0);
  const [lightningAddress, setLightningAddress] = createSignal('');
  const [transactions, setTransactions] = createSignal<Transaction[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [showSendModal, setShowSendModal] = createSignal(false);
  const [showReceiveModal, setShowReceiveModal] = createSignal(false);

  // Fetch wallet data on mount
  createEffect(() => {
    const fetchWalletData = async () => {
      try {
        setIsLoading(true);
        
        // TODO: Replace with actual Breez SDK calls
        // This is mock data for now
        const mockBalance = 125000; // satoshis
        const mockAddress = account?.activeUser?.npub 
          ? `${account.activeUser.npub.slice(0, 8)}@breez.technology`
          : 'wallet@breez.technology';
        
        const mockTransactions: Transaction[] = [
          {
            id: '1',
            type: 'received',
            amount: 50000,
            timestamp: Date.now() - 3600000,
            description: 'Payment received',
            status: 'completed'
          },
          {
            id: '2',
            type: 'sent',
            amount: 25000,
            timestamp: Date.now() - 7200000,
            description: 'Lightning payment',
            status: 'completed'
          },
          {
            id: '3',
            type: 'received',
            amount: 100000,
            timestamp: Date.now() - 86400000,
            description: 'Invoice payment',
            status: 'completed'
          }
        ];

        setBalance(mockBalance);
        setLightningAddress(mockAddress);
        setTransactions(mockTransactions);
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  });

  // Format satoshis to BTC
  const formatBTC = (sats: number): string => {
    return (sats / 100000000).toFixed(8);
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Copy Lightning address to clipboard
  const copyAddress = () => {
    navigator.clipboard.writeText(lightningAddress());
    // TODO: Show toast notification
  };

  return (
    <div class={styles.dashboard}>
      {/* Wallet Balance Card */}
      <div class={styles.balanceCard}>
        <div class={styles.balanceHeader}>
          <h2 class={styles.balanceTitle}>Wallet Balance</h2>
          <div class={styles.balanceStatus}>
            <span class={styles.statusDot}></span>
            <span>Connected</span>
          </div>
        </div>
        
        {isLoading() ? (
          <div class={styles.loadingBalance}>
            <div class={styles.spinner}></div>
          </div>
        ) : (
          <>
            <div class={styles.balanceAmount}>
              <span class={styles.btcAmount}>{formatBTC(balance())}</span>
              <span class={styles.btcLabel}>BTC</span>
            </div>
            <div class={styles.satsAmount}>
              {balance().toLocaleString()} sats
            </div>
          </>
        )}
      </div>

      {/* Lightning Address Card */}
      <div class={styles.addressCard}>
        <div class={styles.addressHeader}>
          <h3 class={styles.addressTitle}>⚡ Lightning Address</h3>
        </div>
        <div class={styles.addressContent}>
          <code class={styles.addressText}>{lightningAddress()}</code>
          <button 
            class={styles.copyButton}
            onClick={copyAddress}
            aria-label="Copy Lightning address"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div class={styles.actionButtons}>
        <button 
          class={`${styles.actionButton} ${styles.sendButton}`}
          onClick={() => setShowSendModal(true)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3l7 7-7 7v-5H3v-4h7V3z"/>
          </svg>
          <span>Send</span>
        </button>
        <button 
          class={`${styles.actionButton} ${styles.receiveButton}`}
          onClick={() => setShowReceiveModal(true)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 17l-7-7 7-7v5h7v4h-7v5z"/>
          </svg>
          <span>Receive</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <div class={styles.transactionsSection}>
        <div class={styles.transactionsHeader}>
          <h3 class={styles.transactionsTitle}>Recent Transactions</h3>
          <button class={styles.viewAllButton}>View All</button>
        </div>

        {isLoading() ? (
          <div class={styles.loadingTransactions}>
            <div class={styles.spinner}></div>
          </div>
        ) : transactions().length === 0 ? (
          <div class={styles.emptyState}>
            <p>No transactions yet</p>
          </div>
        ) : (
          <div class={styles.transactionsList}>
            <For each={transactions()}>
              {(tx) => (
                <div class={styles.transactionItem}>
                  <div class={styles.transactionIcon}>
                    {tx.type === 'received' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#4caf50">
                        <path d="M12 20l-8-8 2.83-2.83L11 13.34V4h2v9.34l4.17-4.17L20 12l-8 8z"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#f44336">
                        <path d="M12 4l8 8-2.83 2.83L13 10.66V20h-2v-9.34l-4.17 4.17L4 12l8-8z"/>
                      </svg>
                    )}
                  </div>
                  <div class={styles.transactionDetails}>
                    <div class={styles.transactionDescription}>
                      {tx.description || (tx.type === 'received' ? 'Received' : 'Sent')}
                    </div>
                    <div class={styles.transactionDate}>
                      {formatDate(tx.timestamp)}
                    </div>
                  </div>
                  <div class={styles.transactionAmount}>
                    <span class={tx.type === 'received' ? styles.amountReceived : styles.amountSent}>
                      {tx.type === 'received' ? '+' : '-'}{tx.amount.toLocaleString()}
                    </span>
                    <span class={styles.amountUnit}>sats</span>
                  </div>
                  <div class={`${styles.transactionStatus} ${styles[tx.status]}`}>
                    {tx.status}
                  </div>
                </div>
              )}
            </For>
          </div>
        )}
      </div>

      {/* Send Modal - Placeholder */}
      {showSendModal() && (
        <div class={styles.modal} onClick={() => setShowSendModal(false)}>
          <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Send Payment</h3>
            <p>Send modal implementation coming soon...</p>
            <button onClick={() => setShowSendModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Receive Modal - Placeholder */}
      {showReceiveModal() && (
        <div class={styles.modal} onClick={() => setShowReceiveModal(false)}>
          <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Receive Payment</h3>
            <p>Receive modal implementation coming soon...</p>
            <button onClick={() => setShowReceiveModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreezDashboard;
