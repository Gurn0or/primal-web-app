import { Component, createSignal, Show, For } from 'solid-js';
import { createStore } from 'solid-js/store';
import styles from './BreezSetup.module.scss';

interface WalletState {
  seedPhrase: string[];
  confirmedBackup: boolean;
  step: 'generate' | 'backup' | 'confirm' | 'complete';
  userConfirmation: string[];
}

const BreezSetup: Component = () => {
  const [state, setState] = createStore<WalletState>({
    seedPhrase: [],
    confirmedBackup: false,
    step: 'generate',
    userConfirmation: Array(12).fill(''),
  });

  const [showSeed, setShowSeed] = createSignal(false);
  const [isGenerating, setIsGenerating] = createSignal(false);

  // Generate a random seed phrase (12 words)
  const generateSeedPhrase = () => {
    setIsGenerating(true);
    setTimeout(async () => {
      try {
        const { generateSecretKey } = await import("nostr-tools/pure");
        const { bytesToHex } = await import("@noble/hashes/utils");
        const secretKey = generateSecretKey();
        const entropy = secretKey.slice(0, 16);
        const { entropyToMnemonic } = await import("@scure/bip39");
        const { wordlist } = await import("@scure/bip39/wordlists/english");
        const mnemonic = entropyToMnemonic(entropy, wordlist);
        const seed = mnemonic.split(" ");
        setState("seedPhrase", seed);
        setState("step", "backup");
        setIsGenerating(false);
      } catch (error) {
        console.error("Failed to generate mnemonic:", error);
        alert("Failed to generate recovery phrase. Please try again.");
        setIsGenerating(false);
      }
    }, 1000);
  };

  const toggleSeedVisibility = () => {
    setShowSeed(!showSeed());
  };

  const confirmBackup = () => {
    setState('confirmedBackup', true);
    setState('step', 'confirm');
  };

  const verifyConfirmation = async () => {
    const isValid = state.userConfirmation.every((word, index) =>
      word.toLowerCase().trim() === state.seedPhrase[index].toLowerCase()
    );

    if (isValid) {
      try {
        const { initBreezSDK } = await import("../../lib/breez/breezInit");
        const apiKey = import.meta.env.VITE_BREEZ_API_KEY || "demo-api-key";
        const mnemonic = state.seedPhrase.join(" ");
        await initBreezSDK(apiKey, mnemonic, "production");
        setState("step", "complete");
        console.log("Wallet initialized successfully");
      } catch (error) {
        console.error("Failed to initialize wallet:", error);
        alert(`Wallet creation failed: ${error.message}. Please try again.`);
      }
    } else {
      alert("The words do not match. Please try again.");
    }
  };

  const updateConfirmationWord = (index: number, value: string) => {
    setState('userConfirmation', index, value);
  };

  return (
    <div class={styles.breezSetupContainer}>
      <div class={styles.setupCard}>
        <div class={styles.header}>
          <h1 class={styles.title}>Breez Lightning Wallet Setup</h1>
          <p class={styles.subtitle}>Create a secure wallet to send and receive Bitcoin instantly</p>
        </div>

        <div class={styles.content}>
          <Show when={state.step === 'generate'}>
            <div class={styles.stepContent}>
              <div class={styles.stepIcon}>🔐</div>
              <h2 class={styles.stepTitle}>Generate Recovery Phrase</h2>
              <p class={styles.stepDescription}>
                Your recovery phrase is a 12-word backup that can restore your wallet if you lose access.
                Keep it safe and never share it with anyone.
              </p>
              <div class={styles.warningBox}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  Important:
                  <ul>
                    Write down your recovery phrase and store it securely
                    Never share it with anyone
                    Losing it means losing access to your funds
                  </ul>
                </div>
              </div>
              <button
                class={styles.primaryButton}
                onClick={generateSeedPhrase}
                disabled={isGenerating()}
              >
                {isGenerating() ? 'Generating...' : 'Generate Recovery Phrase'}
              </button>
            </div>
          </Show>

          <Show when={state.step === 'backup'}>
            <div class={styles.stepContent}>
              <div class={styles.stepIcon}>📝</div>
              <h2 class={styles.stepTitle}>Backup Your Recovery Phrase</h2>
              <p class={styles.stepDescription}>
                Write down these 12 words in order and store them securely.
                You'll need to verify them in the next step.
              </p>
              
              <div class={styles.seedPhraseContainer}>
                <div class={styles.seedPhraseHeader}>
                  <button
                    class={styles.toggleButton}
                    onClick={toggleSeedVisibility}
                  >
                    {showSeed() ? '👁️ Hide' : '👁️‍🗨️ Show'}
                  </button>
                </div>
                <div class={`${styles.seedPhrase} ${!showSeed() ? styles.blurred : ''}`}>
                  <For each={state.seedPhrase}>
                    {(word, index) => (
                      <div class={styles.seedWord}>
                        <span class={styles.wordNumber}>{index() + 1}</span>
                        <span class={styles.word}>{word}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div class={styles.buttonGroup}>
                <button
                  class={styles.secondaryButton}
                  onClick={() => setState('step', 'generate')}
                >
                  Generate New Phrase
                </button>
                <button
                  class={styles.primaryButton}
                  onClick={confirmBackup}
                >
                  I've Written It Down
                </button>
              </div>
            </div>
          </Show>

          <Show when={state.step === 'confirm'}>
            <div class={styles.stepContent}>
              <div class={styles.stepIcon}>✅</div>
              <h2 class={styles.stepTitle}>Verify Recovery Phrase</h2>
              <p class={styles.stepDescription}>
                Enter your 12-word recovery phrase to confirm you've saved it correctly.
              </p>
              
              <div class={styles.confirmationGrid}>
                <For each={state.userConfirmation}>
                  {(word, index) => (
                    <div class={styles.confirmationWord}>
                      <label class={styles.wordLabel}>
                        {index() + 1}
                      </label>
                      <input
                        type="text"
                        class={styles.wordInput}
                        value={word}
                        onInput={(e) => updateConfirmationWord(index(), e.currentTarget.value)}
                        placeholder={`Word ${index() + 1}`}
                        autocomplete="off"
                      />
                    </div>
                  )}
                </For>
              </div>

              <div class={styles.buttonGroup}>
                <button
                  class={styles.secondaryButton}
                  onClick={() => {
                    setState('step', 'backup');
                    setState('userConfirmation', Array(12).fill(''));
                  }}
                >
                  Back
                </button>
                <button
                  class={styles.primaryButton}
                  onClick={verifyConfirmation}
                >
                  Verify & Complete
                </button>
              </div>
            </div>
          </Show>

          <Show when={state.step === 'complete'}>
            <div class={styles.stepContent}>
              <div class={styles.successIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 class={styles.stepTitle}>Wallet Setup Complete!</h2>
              <p class={styles.stepDescription}>
                Your Breez Lightning wallet has been successfully initialized.
                You can now send and receive Bitcoin payments.
              </p>
              <button
                class={styles.primaryButton}
                onClick={() => window.location.href = '/wallet'}
              >
                Go to Wallet
              </button>
            </div>
          </Show>
        </div>

        <div class={styles.footer}>
          <div class={styles.progressIndicator}>
            <div class={`${styles.step} ${state.step !== 'generate' ? styles.completed : ''}`} />
            <div class={`${styles.step} ${state.step === 'confirm' || state.step === 'complete' ? styles.completed : ''}`} />
            <div class={`${styles.step} ${state.step === 'complete' ? styles.completed : ''}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreezSetup;
