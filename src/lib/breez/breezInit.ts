import { connect, defaultConfig, setLogger, Network } from '@breeztech/breez-sdk-spark';
import type { Config, ConnectRequest, EnvironmentType } from '@breeztech/breez-sdk-spark';

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
    const config = defaultConfig(environment === 'production' ? Network.Mainnet : Network.Testnet);
    config.apiKey = apiKey;

    breezSDK = await connect({ config });
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
