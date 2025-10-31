import { connect, defaultConfig, setLogger } from '@breeztech/breez-sdk-spark';
import type { Config, ConnectRequest, EnvironmentType } from '@breeztech/breez-sdk-spark';

// Re-export SDK functions and types that other modules need
export { connect, defaultConfig, setLogger };
export type { Config, ConnectRequest, EnvironmentType };

let breezSDK: any | null = null;

export async function initBreezSDK(
  apiKey: string,
  environment: EnvironmentType = 'production'
): Promise<any> {
  if (breezSDK) {
    console.log('Breez SDK already initialized');
    return breezSDK;
  }

  try {
    const config = defaultConfig(environment, apiKey);
    breezSDK = await connect({ config, mnemonic: '' });
    console.log('Breez SDK Spark initialized successfully');
    return breezSDK;
  } catch (error) {
    console.error('Failed to initialize Breez SDK:', error);
    throw new Error(`Breez SDK initialization failed: ${error}`);
  }
}

export async function generateSeedPhrase(): Promise<string> {
  throw new Error('generateSeedPhrase stub - not implemented');
}

export async function validateMnemonic(mnemonic: string): Promise<boolean> {
  throw new Error('validateMnemonic stub - not implemented');
}

export async function connectBreezSDK(mnemonic: string): Promise<void> {
  throw new Error('connectBreezSDK stub - not implemented');
}

export async function disconnectBreezSDK(): Promise<void> {
  if (!breezSDK) {
    console.warn('Breez SDK not initialized');
    return;
  }
  breezSDK = null;
  console.log('Disconnected from Breez SDK Spark');
}

export function getBreezSDK(): any | null {
  return breezSDK;
}

export function isBreezSDKInitialized(): boolean {
  return breezSDK !== null;
}
