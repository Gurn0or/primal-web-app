import { BreezSDKSpark } from '@breeztech/breez-sdk-spark';
import type { Config, ConnectRequest, EnvironmentType } from '@breeztech/breez-sdk-spark';

let breezSDK: BreezSDKSpark | null = null;

/**
 * Initialize the Breez SDK Spark
 * @param apiKey - The Breez API key for authentication
 * @param environment - The environment type ('production' or 'staging')
 * @returns Promise<BreezSDKSpark>
 */
export async function initBreezSDK(
  apiKey: string,
  environment: EnvironmentType = 'production'
): Promise<BreezSDKSpark> {
  if (breezSDK) {
    console.log('Breez SDK already initialized');
    return breezSDK;
  }

  try {
    // Create SDK configuration
    const config: Config = {
      apiKey,
      environment,
    };

    // Initialize the SDK
    breezSDK = await BreezSDKSpark.init(config);
    
    console.log('Breez SDK Spark initialized successfully');
    return breezSDK;
  } catch (error) {
    console.error('Failed to initialize Breez SDK:', error);
    throw new Error(`Breez SDK initialization failed: ${error}`);
  }
}

/**
 * Generate a new BIP39 seed phrase (mnemonic)
 * @param wordCount - Number of words in the mnemonic (12, 15, 18, 21, or 24)
 * @returns Promise<string> - The generated mnemonic phrase
 */
export async function generateSeedPhrase(wordCount: number = 12): Promise<string> {
  try {
    // Validate word count
    const validWordCounts = [12, 15, 18, 21, 24];
    if (!validWordCounts.includes(wordCount)) {
      throw new Error(
        `Invalid word count: ${wordCount}. Must be one of: ${validWordCounts.join(', ')}`
      );
    }

    // Generate mnemonic using Breez SDK Spark
    const mnemonic = await BreezSDKSpark.generateMnemonic();
    
    console.log('Seed phrase generated successfully');
    return mnemonic;
  } catch (error) {
    console.error('Failed to generate seed phrase:', error);
    throw new Error(`Seed phrase generation failed: ${error}`);
  }
}

/**
 * Validate a BIP39 mnemonic phrase
 * @param mnemonic - The mnemonic phrase to validate
 * @returns Promise<boolean> - True if valid, false otherwise
 */
export async function validateMnemonic(mnemonic: string): Promise<boolean> {
  try {
    // Trim and normalize the mnemonic
    const normalizedMnemonic = mnemonic.trim().toLowerCase();
    
    // Check if mnemonic is empty
    if (!normalizedMnemonic) {
      console.warn('Empty mnemonic provided');
      return false;
    }

    // Check word count
    const words = normalizedMnemonic.split(/\s+/);
    const validWordCounts = [12, 15, 18, 21, 24];
    
    if (!validWordCounts.includes(words.length)) {
      console.warn(`Invalid word count: ${words.length}`);
      return false;
    }

    // Validate using Breez SDK Spark
    const isValid = await BreezSDKSpark.validateMnemonic(normalizedMnemonic);
    
    console.log(`Mnemonic validation result: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error('Failed to validate mnemonic:', error);
    return false;
  }
}

/**
 * Connect to the Breez SDK Spark service with a seed phrase
 * @param mnemonic - The seed phrase to use for connection
 * @returns Promise<void>
 */
export async function connectBreezSDK(mnemonic: string): Promise<void> {
  if (!breezSDK) {
    throw new Error('Breez SDK not initialized. Call initBreezSDK() first.');
  }

  try {
    // Validate mnemonic before connecting
    const isValid = await validateMnemonic(mnemonic);
    if (!isValid) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Create connect request
    const connectRequest: ConnectRequest = {
      mnemonic: mnemonic.trim(),
    };

    // Connect to the SDK
    await breezSDK.connect(connectRequest);
    
    console.log('Connected to Breez SDK Spark successfully');
  } catch (error) {
    console.error('Failed to connect to Breez SDK:', error);
    throw new Error(`Breez SDK connection failed: ${error}`);
  }
}

/**
 * Disconnect from the Breez SDK Spark service
 * @returns Promise<void>
 */
export async function disconnectBreezSDK(): Promise<void> {
  if (!breezSDK) {
    console.warn('Breez SDK not initialized');
    return;
  }

  try {
    await breezSDK.disconnect();
    console.log('Disconnected from Breez SDK Spark');
  } catch (error) {
    console.error('Failed to disconnect from Breez SDK:', error);
    throw new Error(`Breez SDK disconnection failed: ${error}`);
  }
}

/**
 * Get the current Breez SDK instance
 * @returns BreezSDKSpark | null
 */
export function getBreezSDK(): BreezSDKSpark | null {
  return breezSDK;
}

/**
 * Check if Breez SDK is initialized
 * @returns boolean
 */
export function isBreezSDKInitialized(): boolean {
  return breezSDK !== null;
}
