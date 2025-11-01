import { initWasm, BindingLiquidSdk } from '@breeztech/breez-sdk-liquid/web';
import * as breezSdk from '@breeztech/breez-sdk-liquid/web';

let liquidSDK: BindingLiquidSdk | null = null;
let wasmInitialized = false;

// Initialize WASM module
export async function initWasm() {
  if (wasmInitialized) {
    return;
  }
  try {
    await breezSdk.initWasm();
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

    // Create seed from mnemonic
    const seed = {
      type: 'Mnemonic' as const,
      mnemonic: mnemonic,
      passphrase: undefined
    };

    // Connect with config and seed
    liquidSDK = await breezSdk.connect({ config, seed });
    console.log('Breez SDK Liquid initialized successfully');
    return liquidSDK;
  } catch (error) {
    console.error('Failed to initialize Breez SDK Liquid:', error);
    throw new Error(`Breez SDK Liquid initialization failed: ${error}`);
  }
}
