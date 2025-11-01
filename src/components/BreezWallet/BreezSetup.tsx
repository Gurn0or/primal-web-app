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
    
    // Simulating seed phrase generation
    // In production, this would use proper cryptographic libraries
    const wordList = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'afford', 'afraid', 'again', 'age', 'agent', 'agree',
      'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol',
      'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha',
      'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount',
      'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal',
      'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety',
      'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch',
      'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army',
      'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist',
      'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma',
      'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit',
      'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid',
    ];

    const seed = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * wordList.length);
      seed.push(wordList[randomIndex]);
    }

    setTimeout(() => {
      setState('seedPhrase', seed);
      setState('step', 'backup');
      setIsGenerating(false);
    }, 1000);
  };

  const confirmBackup = () => {
    setState('confirmedBackup', true);
    setState('step', 'confirm');
  };

  const updateConfirmationWord = (index: number, value: string) => {
    setState('userConfirmation', index, value.toLowerCase().trim());
  };

  const verifyConfirmation = async () => {
    const isValid = state.userConfirmation.every(
      (word, index) => word === state.seedPhrase[index]
    );
    
    if (isValid) {
      try { const { initBreezSDK } = await import("../../lib/breez/breezInit"); const apiKey = import.meta.env.VITE_BREEZ_API_KEY || "demo-api-key"; const mnemonic = state.seedPhrase.join(" "); await initBreezSDK(apiKey, mnemonic, "production"); setState("step", "complete"); console.log("Wallet initialized successfully"); } catch (error) {
        console.error('Failed to initialize wallet:', error);
        alert(`Wallet creation failed: ${error.message}. Please try again.`);
      }
    } else {
      alert('The words do not match. Please try again.');
    }
  };

  return (
    <div class={styles.container}>
      <div class={styles.card}>
        <header class={styles.header}>
          <h1 class={styles.title}>Breez Lightning Wallet Setup</h1>
          <p class={styles.subtitle}>Secure your Bitcoin Lightning wallet</p>
        </header>

        <div class={styles.content}>
          <Show when={state.step === 'generate'}>
            <div class={styles.stepContent}>
              <div class={styles.stepIcon}>⚡</div>
              <h2 class={styles.stepTitle}>Create Your Wallet</h2>
              <p class={styles.stepDescription}>
                Generate a new 12-word recovery phrase for your Lightning wallet.
                Keep it safe - it's the only way to recover your funds.
              </p>
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
              <div class={styles.warningIcon}>⚠️</div>
              <h2 class={styles.stepTitle}>Backup Your Recovery Phrase</h2>
              <p class={styles.stepDescription}>
                Write down these 12 words in order and store them securely.
                Never share them with anyone.
              </p>
              
              <div class={styles.seedDisplay}>
                <Show when={showSeed()}>
                  <div class={styles.seedGrid}>
                    <For each={state.seedPhrase}>
                      {(word, index) => (
                        <div class={styles.seedWord}>
                          <span class={styles.wordNumber}>{index() + 1}</span>
                          <span class={styles.word}>{word}</span>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
                <Show when={!showSeed()}>
                  <div class={styles.hiddenSeed}>
                    Your recovery phrase is hidden for security
                  </div>
                </Show>
              </div>

              <button
                class={styles.secondaryButton}
                onClick={() => setShowSeed(!showSeed())}
              >
                {showSeed() ? 'Hide' : 'Show'} Recovery Phrase
              </button>

              <div class={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  id="backup-confirm"
                  checked={state.confirmedBackup}
                  onChange={(e) => setState('confirmedBackup', e.target.checked)}
                />
                <label for="backup-confirm">
                  I have written down my recovery phrase and stored it securely
                </label>
              </div>

              <button
                class={styles.primaryButton}
                onClick={confirmBackup}
                disabled={!state.confirmedBackup}
              >
                Continue to Verification
              </button>
            </div>
          </Show>

          <Show when={state.step === 'confirm'}>
            <div class={styles.stepContent}>
              <div class={styles.stepIcon}>✓</div>
              <h2 class={styles.stepTitle}>Verify Your Recovery Phrase</h2>
              <p class={styles.stepDescription}>
                Enter your 12-word recovery phrase to confirm you've backed it up correctly.
              </p>

              <div class={styles.confirmationGrid}>
                <For each={Array(12).fill(0)}>
                  {(_, index) => (
                    <div class={styles.confirmationWord}>
                      <label for={`word-${index()}`}>{index() + 1}</label>
                      <input
                        type="text"
                        id={`word-${index()}`}
                        value={state.userConfirmation[index()]}
                        onInput={(e) => updateConfirmationWord(index(), e.target.value)}
                        placeholder="word"
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
