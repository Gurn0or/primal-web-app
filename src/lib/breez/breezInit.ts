import { connect, defaultConfig, Network } from '@breeztech/breez-sdk-spark';

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
    const network = environment === 'production' ? Network.Mainnet : Network.Regtest;
    const config = defaultConfig(network);
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
  if (!breezSDK) {
    console.warn('Breez SDK not initialized');
    return;
  }
  
  await breezSDK.disconnect();
  breezSDK = null;
  console.log('Disconnected from Breez SDK Spark');
}

export function getBreezSDK(): any | null {
  return breezSDK;
}

export function isBreezSDKInitialized(): boolean {
  return breezSDK !== null;
}
