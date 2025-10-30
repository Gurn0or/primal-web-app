import { Component, Show, createSignal } from 'solid-js';
import { useAccountContext } from '../../contexts/AccountContext';
import PageTitle from '../PageTitle/PageTitle';
import styles from './Settings.module.scss';

const BreezWallet: Component = () => {
  const account = useAccountContext();
  
  // State management
  const [walletEnabled, setWalletEnabled] = createSignal(false);
  const [zapsEnabled, setZapsEnabled] = createSignal(false);
  const [walletStatus, setWalletStatus] = createSignal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [balance, setBalance] = createSignal(0);
  const [channelBalance, setChannelBalance] = createSignal(0);
  const [onchainBalance, setOnchainBalance] = createSignal(0);
  const [showBackupPhrase, setShowBackupPhrase] = createSignal(false);
  const [backupPhrase, setBackupPhrase] = createSignal<string[]>([]);
  const [isBackedUp, setIsBackedUp] = createSignal(false);

  // Wallet operations
  const initializeWallet = async () => {
    try {
      setWalletStatus('connecting');
      // TODO: Implement Breez SDK initialization
      // await breezSDK.initialize();
      setWalletStatus('connected');
      setWalletEnabled(true);
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
      setWalletStatus('disconnected');
    }
  };

  const disconnectWallet = async () => {
    try {
      // TODO: Implement Breez SDK disconnect
      // await breezSDK.disconnect();
      setWalletStatus('disconnected');
      setWalletEnabled(false);
      setZapsEnabled(false);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const refreshBalance = async () => {
    try {
      // TODO: Implement balance fetch from Breez SDK
      // const walletInfo = await breezSDK.getWalletInfo();
      // setBalance(walletInfo.totalBalance);
      // setChannelBalance(walletInfo.channelBalance);
      // setOnchainBalance(walletInfo.onchainBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const generateBackup = async () => {
    try {
      // TODO: Implement backup phrase generation from Breez SDK
      // const phrase = await breezSDK.getBackupPhrase();
      // setBackupPhrase(phrase.split(' '));
      setShowBackupPhrase(true);
    } catch (error) {
      console.error('Failed to generate backup:', error);
    }
  };

  const confirmBackup = () => {
    setIsBackedUp(true);
    setShowBackupPhrase(false);
  };

  const toggleZaps = () => {
    if (walletStatus() === 'connected') {
      setZapsEnabled(!zapsEnabled());
    }
  };

  const formatSats = (amount: number): string => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  return (
    <div class={styles.settingsContent}>
      <PageTitle title="Breez Wallet Settings" />
      
      {/* Wallet Status Section */}
      <div class={styles.settingsSection}>
        <div class={styles.settingsHeader}>
          <h3>Wallet Status</h3>
        </div>
        <div class={styles.settingsItem}>
          <div class={styles.settingsLabel}>
            <span>Status</span>
          </div>
          <div class={styles.settingsValue}>
            <span class={styles.statusBadge} data-status={walletStatus()}>
              {walletStatus()}
            </span>
          </div>
        </div>
        <div class={styles.settingsItem}>
          <div class={styles.settingsLabel}>
            <span>Wallet Enabled</span>
          </div>
          <div class={styles.settingsValue}>
            <Show
              when={walletEnabled()}
              fallback={
                <button 
                  class={styles.primaryButton} 
                  onClick={initializeWallet}
                  disabled={walletStatus() === 'connecting'}
                >
                  {walletStatus() === 'connecting' ? 'Connecting...' : 'Enable Wallet'}
                </button>
              }
            >
              <button 
                class={styles.dangerButton} 
                onClick={disconnectWallet}
              >
                Disconnect Wallet
              </button>
            </Show>
          </div>
        </div>
      </div>

      {/* Balance Display Section */}
      <Show when={walletEnabled() && walletStatus() === 'connected'}>
        <div class={styles.settingsSection}>
          <div class={styles.settingsHeader}>
            <h3>Balance</h3>
            <button 
              class={styles.secondaryButton} 
              onClick={refreshBalance}
            >
              Refresh
            </button>
          </div>
          <div class={styles.balanceCard}>
            <div class={styles.balanceItem}>
              <div class={styles.balanceLabel}>Total Balance</div>
              <div class={styles.balanceAmount}>
                {formatSats(balance())} <span class={styles.unit}>sats</span>
              </div>
            </div>
            <div class={styles.balanceItem}>
              <div class={styles.balanceLabel}>Lightning Balance</div>
              <div class={styles.balanceAmount}>
                {formatSats(channelBalance())} <span class={styles.unit}>sats</span>
              </div>
            </div>
            <div class={styles.balanceItem}>
              <div class={styles.balanceLabel}>On-chain Balance</div>
              <div class={styles.balanceAmount}>
                {formatSats(onchainBalance())} <span class={styles.unit}>sats</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zaps Toggle Section */}
        <div class={styles.settingsSection}>
          <div class={styles.settingsHeader}>
            <h3>Zaps Settings</h3>
          </div>
          <div class={styles.settingsItem}>
            <div class={styles.settingsLabel}>
              <span>Enable Zaps</span>
              <p class={styles.settingsDescription}>
                Allow sending and receiving zaps (Lightning payments) on Nostr
              </p>
            </div>
            <div class={styles.settingsValue}>
              <label class={styles.toggle}>
                <input
                  type="checkbox"
                  checked={zapsEnabled()}
                  onChange={toggleZaps}
                />
                <span class={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        </div>

        {/* Backup Options Section */}
        <div class={styles.settingsSection}>
          <div class={styles.settingsHeader}>
            <h3>Backup & Recovery</h3>
          </div>
          <div class={styles.settingsItem}>
            <div class={styles.settingsLabel}>
              <span>Backup Status</span>
              <p class={styles.settingsDescription}>
                {isBackedUp() 
                  ? 'Your wallet has been backed up' 
                  : 'Please backup your wallet to prevent loss of funds'
                }
              </p>
            </div>
            <div class={styles.settingsValue}>
              <Show
                when={isBackedUp()}
                fallback={
                  <span class={styles.warningBadge}>Not Backed Up</span>
                }
              >
                <span class={styles.successBadge}>Backed Up</span>
              </Show>
            </div>
          </div>
          <div class={styles.settingsItem}>
            <div class={styles.settingsLabel}>
              <span>Backup Phrase</span>
            </div>
            <div class={styles.settingsValue}>
              <button 
                class={styles.secondaryButton} 
                onClick={generateBackup}
                disabled={showBackupPhrase()}
              >
                {showBackupPhrase() ? 'Showing Backup Phrase' : 'Show Backup Phrase'}
              </button>
            </div>
          </div>
          
          <Show when={showBackupPhrase()}>
            <div class={styles.backupPhraseContainer}>
              <div class={styles.warningBox}>
                <strong>⚠️ Warning:</strong> Keep this phrase safe and private. 
                Anyone with access to it can access your funds.
              </div>
              <div class={styles.backupPhrase}>
                {backupPhrase().map((word, index) => (
                  <div class={styles.backupWord}>
                    <span class={styles.wordNumber}>{index + 1}</span>
                    <span class={styles.word}>{word}</span>
                  </div>
                ))}
              </div>
              <button 
                class={styles.primaryButton} 
                onClick={confirmBackup}
              >
                I've Saved My Backup Phrase
              </button>
            </div>
          </Show>
        </div>

        {/* Wallet Management Section */}
        <div class={styles.settingsSection}>
          <div class={styles.settingsHeader}>
            <h3>Wallet Management</h3>
          </div>
          <div class={styles.settingsItem}>
            <div class={styles.settingsLabel}>
              <span>Receive Payment</span>
              <p class={styles.settingsDescription}>
                Generate a Lightning invoice to receive payments
              </p>
            </div>
            <div class={styles.settingsValue}>
              <button class={styles.secondaryButton}>
                Generate Invoice
              </button>
            </div>
          </div>
          <div class={styles.settingsItem}>
            <div class={styles.settingsLabel}>
              <span>Send Payment</span>
              <p class={styles.settingsDescription}>
                Send Lightning payments or pay invoices
              </p>
            </div>
            <div class={styles.settingsValue}>
              <button class={styles.secondaryButton}>
                Send Payment
              </button>
            </div>
          </div>
          <div class={styles.settingsItem}>
            <div class={styles.settingsLabel}>
              <span>Channel Management</span>
              <p class={styles.settingsDescription}>
                View and manage Lightning channels
              </p>
            </div>
            <div class={styles.settingsValue}>
              <button class={styles.secondaryButton}>
                Manage Channels
              </button>
            </div>
          </div>
          <div class={styles.settingsItem}>
            <div class={styles.settingsLabel}>
              <span>Transaction History</span>
              <p class={styles.settingsDescription}>
                View your payment history
              </p>
            </div>
            <div class={styles.settingsValue}>
              <button class={styles.secondaryButton}>
                View History
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Settings Section */}
        <div class={styles.settingsSection}>
          <div class={styles.settingsHeader}>
            <h3>Advanced</h3>
          </div>
          <div class={styles.settingsItem}>
            <div class={styles.settingsLabel}>
              <span>Node Information</span>
              <p class={styles.settingsDescription}>
                View your Lightning node details
              </p>
            </div>
            <div class={styles.settingsValue}>
              <button class={styles.secondaryButton}>
                View Node Info
              </button>
            </div>
          </div>
          <div class={styles.settingsItem}>
            <div class={styles.settingsLabel}>
              <span>Export Logs</span>
              <p class={styles.settingsDescription}>
                Export wallet logs for debugging
              </p>
            </div>
            <div class={styles.settingsValue}>
              <button class={styles.secondaryButton}>
                Export Logs
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default BreezWallet;
