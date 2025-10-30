import { Component, Show, createSignal, onMount } from 'solid-js';
import { useAccountContext } from '../../contexts/AccountContext';
import styles from './Settings.module.scss';
import BreezSetup from '../../components/BreezWallet/BreezSetup';
import BreezDashboard from '../../components/BreezWallet/BreezDashboard';
import { initBreezWallet, isWalletInitialized } from '../../lib/breez/breezWallet';

const BreezWallet: Component = () => {
  const account = useAccountContext();
  const [isInitialized, setIsInitialized] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(async () => {
    try {
      // Check if wallet is already initialized
      const initialized = await isWalletInitialized();
      setIsInitialized(initialized);
      
      if (initialized) {
        // If already initialized, ensure wallet is connected
        await initBreezWallet();
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
    } finally {
      setIsLoading(false);
    }
  });

  const handleSetupComplete = () => {
    setIsInitialized(true);
  };

  return (
    <div class={styles.settingsContent}>
      <div class={styles.settingsHeader}>
        <h2>Breez Wallet</h2>
        <p>Manage your Lightning Network wallet powered by Breez SDK</p>
      </div>

      <Show when={!isLoading()} fallback={
        <div class={styles.loadingContainer}>
          <p>Loading wallet...</p>
        </div>
      }>
        <Show
          when={isInitialized()}
          fallback={<BreezSetup onComplete={handleSetupComplete} />}
        >
          <BreezDashboard />
        </Show>
      </Show>
    </div>
  );
};

export default BreezWallet;
