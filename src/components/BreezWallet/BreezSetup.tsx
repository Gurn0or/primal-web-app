import { createSignal, createEffect, Show, For } from 'solid-js';
import { BreezService } from '../../lib/breez/BreezService';

type SetupStep = 'generate' | 'backup' | 'confirm' | 'complete';

const BreezSetup = () => {
  const [currentStep, setCurrentStep] = createSignal<SetupStep>('generate');
  const [mnemonic, setMnemonic] = createSignal<string[]>([]);
  const [confirmationWords, setConfirmationWords] = createSignal<number[]>([]);
  const [userConfirmation, setUserConfirmation] = createSignal<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string>('');
  const [hasBackedUp, setHasBackedUp] = createSignal(false);

  // Generate random word positions for confirmation (3 words)
  const generateConfirmationIndexes = () => {
    const indexes: number[] = [];
    const mnemonicLength = mnemonic().length;
    while (indexes.length < 3) {
      const randomIndex = Math.floor(Math.random() * mnemonicLength);
      if (!indexes.includes(randomIndex)) {
        indexes.push(randomIndex);
      }
    }
    return indexes.sort((a, b) => a - b);
  };

  // Generate seed phrase
  const generateSeed = async () => {
    setIsLoading(true);
    setError('');
    try {
      const seed = await BreezService.generateMnemonic();
      setMnemonic(seed.split(' '));
      setCurrentStep('backup');
    } catch (err) {
      setError(`Failed to generate seed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Move to confirmation step
  const proceedToConfirmation = () => {
    if (!hasBackedUp()) {
      setError('Please confirm you have backed up your seed phrase');
      return;
    }
    setConfirmationWords(generateConfirmationIndexes());
    setCurrentStep('confirm');
    setError('');
  };

  // Verify confirmation
  const verifyConfirmation = () => {
    const words = mnemonic();
    const isValid = confirmationWords().every(
      (index) => userConfirmation()[index]?.toLowerCase().trim() === words[index].toLowerCase()
    );

    if (isValid) {
      setCurrentStep('complete');
      setError('');
    } else {
      setError('The words you entered do not match. Please try again.');
    }
  };

  // Handle confirmation input
  const handleConfirmationInput = (index: number, value: string) => {
    setUserConfirmation({ ...userConfirmation(), [index]: value });
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(mnemonic().join(' '));
  };

  // Complete setup and initialize wallet
  const completeSetup = async () => {
    setIsLoading(true);
    try {
      await BreezService.initializeWallet(mnemonic().join(' '));
      // Wallet is now ready to use
    } catch (err) {
      setError(`Failed to initialize wallet: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  createEffect(() => {
    if (currentStep() === 'complete') {
      completeSetup();
    }
  });

  return (
    <div class="breez-setup-container">
      <div class="setup-card">
        <Show when={currentStep() === 'generate'}>
          <div class="setup-step">
            <h2>Welcome to Breez Wallet</h2>
            <p>Let's set up your Lightning wallet. First, we'll generate a secure seed phrase.</p>
            <p class="warning">⚠️ This seed phrase is the key to your wallet. Keep it safe and never share it with anyone.</p>
            <button
              class="btn-primary"
              onClick={generateSeed}
              disabled={isLoading()}
            >
              {isLoading() ? 'Generating...' : 'Generate Seed Phrase'}
            </button>
          </div>
        </Show>

        <Show when={currentStep() === 'backup'}>
          <div class="setup-step">
            <h2>Backup Your Seed Phrase</h2>
            <p>Write down these {mnemonic().length} words in order and keep them safe.</p>
            
            <div class="seed-display">
              <For each={mnemonic()}>
                {(word, index) => (
                  <div class="seed-word">
                    <span class="word-number">{index() + 1}</span>
                    <span class="word-text">{word}</span>
                  </div>
                )}
              </For>
            </div>

            <div class="actions">
              <button
                class="btn-secondary"
                onClick={copyToClipboard}
              >
                📋 Copy to Clipboard
              </button>
            </div>

            <div class="backup-confirmation">
              <label>
                <input
                  type="checkbox"
                  checked={hasBackedUp()}
                  onChange={(e) => setHasBackedUp(e.currentTarget.checked)}
                />
                I have safely backed up my seed phrase
              </label>
            </div>

            <button
              class="btn-primary"
              onClick={proceedToConfirmation}
              disabled={!hasBackedUp()}
            >
              Continue
            </button>
          </div>
        </Show>

        <Show when={currentStep() === 'confirm'}>
          <div class="setup-step">
            <h2>Confirm Your Seed Phrase</h2>
            <p>To ensure you've backed up correctly, please enter the following words:</p>

            <div class="confirmation-inputs">
              <For each={confirmationWords()}>
                {(wordIndex) => (
                  <div class="confirmation-field">
                    <label>Word #{wordIndex + 1}</label>
                    <input
                      type="text"
                      placeholder="Enter word"
                      value={userConfirmation()[wordIndex] || ''}
                      onInput={(e) => handleConfirmationInput(wordIndex, e.currentTarget.value)}
                    />
                  </div>
                )}
              </For>
            </div>

            <div class="actions">
              <button
                class="btn-secondary"
                onClick={() => setCurrentStep('backup')}
              >
                Back
              </button>
              <button
                class="btn-primary"
                onClick={verifyConfirmation}
              >
                Verify
              </button>
            </div>
          </div>
        </Show>

        <Show when={currentStep() === 'complete'}>
          <div class="setup-step">
            <div class="success-icon">✅</div>
            <h2>Wallet Setup Complete!</h2>
            <p>Your Breez Lightning wallet has been successfully initialized.</p>
            <p>{isLoading() ? 'Initializing your wallet...' : 'You can now start using your wallet to send and receive Lightning payments.'}</p>
          </div>
        </Show>

        <Show when={error()}>
          <div class="error-message">
            {error()}
          </div>
        </Show>
      </div>

      <style jsx>{`
        .breez-setup-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .setup-card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .setup-step {
          text-align: center;
        }

        h2 {
          color: #333;
          margin-bottom: 16px;
          font-size: 28px;
        }

        p {
          color: #666;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .warning {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 12px;
          color: #856404;
        }

        .seed-display {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
          margin: 24px 0;
          text-align: left;
        }

        .seed-word {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .word-number {
          color: #6c757d;
          font-size: 12px;
          font-weight: bold;
          min-width: 24px;
        }

        .word-text {
          color: #212529;
          font-family: monospace;
          font-size: 14px;
        }

        .actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin: 24px 0;
        }

        .backup-confirmation {
          margin: 24px 0;
          text-align: left;
        }

        .backup-confirmation label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #333;
        }

        .confirmation-inputs {
          margin: 24px 0;
        }

        .confirmation-field {
          margin-bottom: 16px;
          text-align: left;
        }

        .confirmation-field label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 500;
        }

        .confirmation-field input {
          width: 100%;
          padding: 12px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 16px;
        }

        .confirmation-field input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .btn-primary,
        .btn-secondary {
          padding: 12px 32px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #dee2e6;
        }

        .btn-secondary:hover {
          background: #e9ecef;
        }

        .success-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .error-message {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          padding: 12px;
          color: #721c24;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
};

export default BreezSetup;
