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
    }, 500);
  };

  const handleBackupConfirmed = () => {
    setState('confirmedBackup', true);
    setState('step', 'confirm');
    setShowSeed(false);
  };

  const handleWordInput = (index: number, value: string) => {
    setState('userConfirmation', index, value.trim().toLowerCase());
  };

  const verifyConfirmation = () => {
    const isValid = state.userConfirmation.every(
      (word, index) => word === state.seedPhrase[index]
    );

    if (isValid) {
      setState('step', 'complete');
      // Initialize wallet here in production
      console.log('Wallet initialized successfully');
    } else {
      alert('The words do not match. Please try again.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(state.seedPhrase.join(' '));
    alert('Seed phrase copied to clipboard!');
  };

  return (
    <div class={styles.setupContainer}>
      <div class={styles.setupCard}>
        <div class={styles.header}>
          <h1 class={styles.title}>Breez Wallet Setup</h1>
          <p class={styles.subtitle}>
            Set up your Lightning wallet to send and receive Bitcoin
          </p>
        </div>

        <div class={styles.content}>
          <Show when={state.step === 'generate'}>
            <div class={styles.stepContent}>
              <div class={styles.iconWrapper}>
                <svg class={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 class={styles.stepTitle}>Generate Recovery Phrase</h2>
              <p class={styles.stepDescription}>
                Your recovery phrase is a 12-word sequence that allows you to restore your wallet.
                Keep it safe and never share it with anyone.
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
              <div class={styles.warningBox}>
                <svg class={styles.warningIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z" />
                </svg>
                <p class={styles.warningText}>
                  <strong>Important:</strong> Write down these words in order and store them in a safe place.
                  This is the only way to recover your wallet if you lose access.
                </p>
              </div>

              <div class={styles.seedPhraseContainer}>
                <div class={styles.seedHeader}>
                  <h3>Your Recovery Phrase</h3>
                  <button class={styles.toggleButton} onClick={() => setShowSeed(!showSeed())}>
                    {showSeed() ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                <div class={styles.seedGrid}>
                  <For each={state.seedPhrase}>
                    {(word, index) => (
                      <div class={styles.seedWord}>
                        <span class={styles.wordNumber}>{index() + 1}</span>
                        <span class={styles.word}>
                          {showSeed() ? word : '••••••'}
                        </span>
                      </div>
                    )}
                  </For>
                </div>

                <Show when={showSeed()}>
                  <button class={styles.copyButton} onClick={copyToClipboard}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy to Clipboard
                  </button>
                </Show>
              </div>

              <div class={styles.checkboxWrapper}>
                <label class={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={state.confirmedBackup}
                    onChange={(e) => setState('confirmedBackup', e.currentTarget.checked)}
                  />
                  <span>I have securely backed up my recovery phrase</span>
                </label>
              </div>

              <button 
                class={styles.primaryButton}
                onClick={handleBackupConfirmed}
                disabled={!state.confirmedBackup}
              >
                Continue
              </button>
            </div>
          </Show>

          <Show when={state.step === 'confirm'}>
            <div class={styles.stepContent}>
              <h2 class={styles.stepTitle}>Confirm Recovery Phrase</h2>
              <p class={styles.stepDescription}>
                Please enter your 12-word recovery phrase to confirm you've backed it up correctly.
              </p>

              <div class={styles.confirmGrid}>
                <For each={Array(12).fill(null)}>
                  {(_, index) => (
                    <div class={styles.confirmWord}>
                      <label class={styles.confirmLabel}>{index() + 1}</label>
                      <input
                        type="text"
                        class={styles.confirmInput}
                        placeholder="word"
                        value={state.userConfirmation[index()]}
                        onInput={(e) => handleWordInput(index(), e.currentTarget.value)}
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
