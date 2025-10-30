import { Component, For, Show, createSignal } from 'solid-js';
import { useBreezContext } from '../../contexts/BreezContext';
import './BreezDashboard.css';

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
}

const BreezDashboard: Component = () => {
  const breezContext = useBreezContext();
  const [showSendModal, setShowSendModal] = createSignal(false);
  const [showReceiveModal, setShowReceiveModal] = createSignal(false);
  const [transactions, setTransactions] = createSignal<Transaction[]>([
    {
      id: '1',
      type: 'receive',
      amount: 50000,
      timestamp: Date.now() - 3600000,
      status: 'completed',
      description: 'Payment received'
    },
    {
      id: '2',
      type: 'send',
      amount: 25000,
      timestamp: Date.now() - 7200000,
      status: 'completed',
      description: 'Lightning payment'
    },
    {
      id: '3',
      type: 'receive',
      amount: 100000,
      timestamp: Date.now() - 10800000,
      status: 'completed',
      description: 'Invoice payment'
    }
  ]);

  const formatSats = (sats: number): string => {
    return new Intl.NumberFormat().format(sats);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSend = () => {
    setShowSendModal(true);
  };

  const handleReceive = () => {
    setShowReceiveModal(true);
  };

  const handleRefresh = async () => {
    try {
      // Refresh balance and transactions from Breez SDK
      await breezContext?.refreshNodeInfo();
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  return (
    <div class="breez-dashboard">
      <div class="dashboard-header">
        <h1>Lightning Wallet</h1>
        <button class="refresh-btn" onClick={handleRefresh}>
          ↻ Refresh
        </button>
      </div>

      {/* Balance Card */}
      <div class="balance-card">
        <div class="balance-label">Total Balance</div>
        <div class="balance-amount">
          <Show when={breezContext?.nodeInfo()?.balance} fallback="0">
            {formatSats(breezContext?.nodeInfo()?.balance || 0)}
          </Show>
          <span class="balance-unit">sats</span>
        </div>
        <div class="balance-fiat">
          ≈ ${((breezContext?.nodeInfo()?.balance || 0) * 0.0003).toFixed(2)} USD
        </div>
      </div>

      {/* Quick Actions */}
      <div class="quick-actions">
        <button class="action-btn send-btn" onClick={handleSend}>
          <span class="action-icon">↑</span>
          <span class="action-label">Send</span>
        </button>
        <button class="action-btn receive-btn" onClick={handleReceive}>
          <span class="action-icon">↓</span>
          <span class="action-label">Receive</span>
        </button>
      </div>

      {/* Transaction History */}
      <div class="transaction-section">
        <div class="section-header">
          <h2>Recent Transactions</h2>
          <button class="view-all-btn">View All</button>
        </div>
        
        <div class="transaction-list">
          <Show
            when={transactions().length > 0}
            fallback={
              <div class="empty-state">
                <p>No transactions yet</p>
                <p class="empty-subtitle">Your transaction history will appear here</p>
              </div>
            }
          >
            <For each={transactions()}>
              {(tx) => (
                <div class="transaction-item" data-status={tx.status}>
                  <div class="tx-icon-wrapper">
                    <span class={`tx-icon tx-${tx.type}`}>
                      {tx.type === 'send' ? '↑' : '↓'}
                    </span>
                  </div>
                  <div class="tx-details">
                    <div class="tx-description">
                      {tx.description || (tx.type === 'send' ? 'Payment sent' : 'Payment received')}
                    </div>
                    <div class="tx-timestamp">{formatTimestamp(tx.timestamp)}</div>
                  </div>
                  <div class="tx-amount-wrapper">
                    <div class={`tx-amount tx-${tx.type}`}>
                      {tx.type === 'send' ? '-' : '+'}{formatSats(tx.amount)} sats
                    </div>
                    <div class="tx-status">{tx.status}</div>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>

      {/* Send Modal */}
      <Show when={showSendModal()}>
        <div class="modal-overlay" onClick={() => setShowSendModal(false)}>
          <div class="modal-content" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3>Send Payment</h3>
              <button class="modal-close" onClick={() => setShowSendModal(false)}>×</button>
            </div>
            <div class="modal-body">
              <p>Send payment functionality will be implemented here</p>
              <input type="text" placeholder="Lightning invoice or address" class="modal-input" />
              <input type="number" placeholder="Amount (sats)" class="modal-input" />
            </div>
            <div class="modal-footer">
              <button class="modal-btn cancel-btn" onClick={() => setShowSendModal(false)}>
                Cancel
              </button>
              <button class="modal-btn confirm-btn">Send Payment</button>
            </div>
          </div>
        </div>
      </Show>

      {/* Receive Modal */}
      <Show when={showReceiveModal()}>
        <div class="modal-overlay" onClick={() => setShowReceiveModal(false)}>
          <div class="modal-content" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3>Receive Payment</h3>
              <button class="modal-close" onClick={() => setShowReceiveModal(false)}>×</button>
            </div>
            <div class="modal-body">
              <p>Receive payment functionality will be implemented here</p>
              <div class="qr-code-placeholder">QR Code will appear here</div>
              <input type="text" placeholder="Invoice will appear here" class="modal-input" readonly />
            </div>
            <div class="modal-footer">
              <button class="modal-btn cancel-btn" onClick={() => setShowReceiveModal(false)}>
                Close
              </button>
              <button class="modal-btn confirm-btn">Copy Invoice</button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default BreezDashboard;
