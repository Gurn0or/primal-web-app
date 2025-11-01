import init, { BindingLiquidSdk } from '@breeztech/breez-sdk-liquid/web';
import * as breezSdk from '@breeztech/breez-sdk-liquid/web';

let liquidSDK: BindingLiquidSdk | null = null;
let wasmInitialized = false;

// Initialize WASM module
export async function initWasm() {
  if (wasmInitialized) {
    return;
  }

  try {
    await init();
    wasmInitialized = true;
    console.log('Breez SDK Liquid WASM initialized successfully');
  } catch (error) {
    console.error('Failed to initialize WASM:', error);
    throw new Error(`WASM initialization failed: ${error}`);
  }
}

export async function initBreezSDK(
  apiKey: string,
  mnemonic: string,
  environment: 'production' | 'development' = 'production'
): Promise<BindingLiquidSdk> {
  if (liquidSDK) {
    console.log('Breez SDK Liquid already initialized');
    return liquidSDK;
  }

  try {
    // Ensure WASM is initialized first
    await initWasm();

    // Create config using defaultConfig
    const config = breezSdk.defaultConfig(environment === 'production' ? 'mainnet' : 'testnet');
    config.breezApiKey = apiKey;

    // Connect to Breez SDK Liquid
    console.log('Connecting to Breez SDK Liquid...');
    liquidSDK = await breezSdk.connect({ config, mnemonic });
    console.log('Successfully connected to Breez SDK Liquid');

    return liquidSDK;
  } catch (error) {
    console.error('Failed to initialize Breez SDK Liquid:', error);
    throw new Error(`Breez SDK Liquid initialization failed: ${error}`);
  }
}

export function getBreezSDK(): BindingLiquidSdk | null {
  return liquidSDK;
}

export async function disconnectBreezSDK() {
  if (liquidSDK) {
    try {
      await liquidSDK.disconnect();
      liquidSDK = null;
      console.log('Disconnected from Breez SDK Liquid');
    } catch (error) {
      console.error('Error disconnecting from Breez SDK Liquid:', error);
    }
  }
}

export function isBreezSDKInitialized(): boolean {
  return liquidSDK !== null;
}
// Environment variable updated
