import { connect, defaultConfig } from '@breeztech/breez-sdk-spark';

let breezSDK: any | null = null;

export async function initBreezSDK(
  apiKey: string,
  mnemonic: string,
  environment: 'production' | 'development' = 'production'
): Promise<any> {
  if (breezSDK) {
    console.log('Breez SDK already initialized');
    return breezSDK;
  }

  try {
    // Create config
    const config = defaultConfig(environment === 'production' ? 'mainnet' : 'regtest');
    config.apiKey = apiKey;

    // Create seed from mnemonic
    const seed = {
      type: 'Mnemonic',
      mnemonic: mnemonic,
      passphrase: undefined
    };

    // Connect with config and seed
    breezSDK = await connect({ config, seed });
    console.log('Breez SDK Spark initialized successfully');
    return breezSDK;
  } catch (error) {
    console.error('Failed to initialize Breez SDK:', error);
    throw new Error(`Breez SDK initialization failed: ${error}`);
  }
}

export async function disconnectBreezSDK(): Promise<void> {
  if (breezSDK !== null) {
    await breezSDK.disconnect();
    breezSDK = null;
    console.log('Disconnected from Breez SDK Spark');
  }
}
