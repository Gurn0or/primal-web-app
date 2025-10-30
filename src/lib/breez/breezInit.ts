import { BreezSDK } from '@breeztech/react-native-breez-sdk';

/**
 * Generate a new BIP39 mnemonic seed phrase
 * @returns {Promise<string>} A 12-word mnemonic seed phrase
 */
export async function generateSeedPhrase(): Promise<string> {
  try {
    const mnemonic = await BreezSDK.mnemonicGenerate();
    return mnemonic;
  } catch (error) {
    console.error('Error generating seed phrase:', error);
    throw new Error('Failed to generate seed phrase');
  }
}

/**
 * Validate a BIP39 mnemonic seed phrase
 * @param {string} mnemonic - The mnemonic phrase to validate
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
export async function validateMnemonic(mnemonic: string): Promise<boolean> {
  try {
    if (!mnemonic || typeof mnemonic !== 'string') {
      return false;
    }
    
    const trimmedMnemonic = mnemonic.trim();
    const words = trimmedMnemonic.split(/\s+/);
    
    // Check if the mnemonic has the correct number of words (12, 15, 18, 21, or 24)
    const validWordCounts = [12, 15, 18, 21, 24];
    if (!validWordCounts.includes(words.length)) {
      return false;
    }
    
    // Use Breez SDK to validate the mnemonic
    await BreezSDK.mnemonicValidate(trimmedMnemonic);
    return true;
  } catch (error) {
    console.error('Invalid mnemonic:', error);
    return false;
  }
}

/**
 * Initialize the Breez SDK
 * @param {string} apiKey - The Breez API key
 * @param {string} mnemonic - The BIP39 mnemonic seed phrase
 * @param {string} workingDir - The working directory for SDK data
 * @returns {Promise<void>}
 */
export async function initializeBreezSDK(
  apiKey: string,
  mnemonic: string,
  workingDir: string
): Promise<void> {
  try {
    // Validate the mnemonic before initialization
    const isValid = await validateMnemonic(mnemonic);
    if (!isValid) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Configure the SDK
    const config = {
      breezserver: 'https://bs1.breez.technology',
      mempoolspaceUrl: 'https://mempool.space/api',
      workingDir: workingDir,
      network: 'bitcoin' as const,
      apiKey: apiKey,
      maxfeePercent: 0.5,
    };

    // Initialize the SDK with the mnemonic and configuration
    await BreezSDK.initialize({
      config,
      seed: mnemonic,
    });

    console.log('Breez SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Breez SDK:', error);
    throw new Error(`Failed to initialize Breez SDK: ${error}`);
  }
}

/**
 * Connect to the Breez node
 * @returns {Promise<void>}
 */
export async function connectBreezNode(): Promise<void> {
  try {
    await BreezSDK.connect();
    console.log('Connected to Breez node successfully');
  } catch (error) {
    console.error('Error connecting to Breez node:', error);
    throw new Error('Failed to connect to Breez node');
  }
}

/**
 * Disconnect from the Breez node
 * @returns {Promise<void>}
 */
export async function disconnectBreezNode(): Promise<void> {
  try {
    await BreezSDK.disconnect();
    console.log('Disconnected from Breez node successfully');
  } catch (error) {
    console.error('Error disconnecting from Breez node:', error);
    throw new Error('Failed to disconnect from Breez node');
  }
}
