# Breez SDK Liquid Setup Guide

This guide provides step-by-step instructions for implementing the Breez SDK Liquid package in your application.

## Overview

The Breez SDK Liquid is a comprehensive solution for integrating Bitcoin Lightning and Liquid Network functionality into your application. It provides a simple API for managing wallets, payments, and liquid assets.

## Installation

### For JavaScript/TypeScript Projects

```bash
npm install @breeztech/react-native-breez-sdk-liquid
```

Or using yarn:

```bash
yarn add @breeztech/react-native-breez-sdk-liquid
```

### For Native Mobile Projects

#### iOS

Add to your `Podfile`:

```ruby
pod 'BreezSDKLiquid'
```

Then run:

```bash
pod install
```

#### Android

Add to your `build.gradle`:

```gradle
dependencies {
    implementation 'com.breez.sdk:breez-sdk-liquid:0.3.0'
}
```

## Configuration

### 1. Initialize the SDK

First, import and initialize the Breez SDK Liquid:

```javascript
import { connect, defaultConfig, BreezEvent } from '@breeztech/react-native-breez-sdk-liquid';

// Set up event listener
const eventListener = (event) => {
  console.log('Breez SDK Event:', event);
};

// Initialize configuration
const initSDK = async () => {
  try {
    const config = await defaultConfig(
      LiquidNetwork.MAINNET, // or LiquidNetwork.TESTNET for testing
      'YOUR_API_KEY' // Optional: Get from Breez
    );
    
    // Connect to the SDK
    const sdk = await connect(config, eventListener);
    console.log('SDK connected successfully');
    return sdk;
  } catch (error) {
    console.error('Failed to initialize SDK:', error);
    throw error;
  }
};
```

### 2. Configure Network Settings

```javascript
import { LiquidNetwork } from '@breeztech/react-native-breez-sdk-liquid';

// For Mainnet (Production)
const config = await defaultConfig(LiquidNetwork.MAINNET);

// For Testnet (Development/Testing)
const config = await defaultConfig(LiquidNetwork.TESTNET);
```

## Basic Usage Examples

### Getting Wallet Information

```javascript
const getWalletInfo = async (sdk) => {
  try {
    const info = await sdk.getInfo();
    console.log('Balance (satoshis):', info.balanceSat);
    console.log('Pending Balance:', info.pendingSendSat);
    console.log('Pending Receive:', info.pendingReceiveSat);
    return info;
  } catch (error) {
    console.error('Error getting wallet info:', error);
  }
};
```

### Receiving Payments

#### Generate a Lightning Invoice

```javascript
const receivePayment = async (sdk, amountSats) => {
  try {
    const prepareResponse = await sdk.prepareReceivePayment({
      paymentMethod: PaymentMethod.LIGHTNING,
    });
    
    const receiveResponse = await sdk.receivePayment({
      prepareResponse,
      description: 'Payment for services',
      amountSat: amountSats,
    });
    
    console.log('Invoice:', receiveResponse.destination);
    return receiveResponse;
  } catch (error) {
    console.error('Error receiving payment:', error);
  }
};
```

#### Generate a Liquid BTC Address

```javascript
const receiveLiquidPayment = async (sdk) => {
  try {
    const prepareResponse = await sdk.prepareReceivePayment({
      paymentMethod: PaymentMethod.LIQUID,
    });
    
    const receiveResponse = await sdk.receivePayment({
      prepareResponse,
    });
    
    console.log('Liquid Address:', receiveResponse.destination);
    return receiveResponse;
  } catch (error) {
    console.error('Error receiving liquid payment:', error);
  }
};
```

### Sending Payments

#### Pay a Lightning Invoice

```javascript
const sendPayment = async (sdk, invoice) => {
  try {
    // Prepare the payment
    const prepareResponse = await sdk.prepareSendPayment({
      destination: invoice,
    });
    
    console.log('Fees:', prepareResponse.feesSat);
    
    // Send the payment
    const sendResponse = await sdk.sendPayment({
      prepareResponse,
    });
    
    console.log('Payment sent:', sendResponse.payment.id);
    return sendResponse;
  } catch (error) {
    console.error('Error sending payment:', error);
  }
};
```

#### Send to Liquid Address

```javascript
const sendLiquidPayment = async (sdk, address, amountSats) => {
  try {
    const prepareResponse = await sdk.prepareSendPayment({
      destination: address,
      amountSat: amountSats,
    });
    
    const sendResponse = await sdk.sendPayment({
      prepareResponse,
    });
    
    console.log('Liquid payment sent:', sendResponse.payment.id);
    return sendResponse;
  } catch (error) {
    console.error('Error sending liquid payment:', error);
  }
};
```

### Listing Payments (Transaction History)

```javascript
const listPayments = async (sdk) => {
  try {
    const payments = await sdk.listPayments({});
    
    payments.forEach(payment => {
      console.log('Payment ID:', payment.id);
      console.log('Amount:', payment.amountSat);
      console.log('Timestamp:', payment.timestamp);
      console.log('Status:', payment.status);
      console.log('Type:', payment.paymentType);
    });
    
    return payments;
  } catch (error) {
    console.error('Error listing payments:', error);
  }
};
```

### Swapping Between Lightning and Liquid

#### Lightning to Liquid Swap

```javascript
const swapLightningToLiquid = async (sdk, amountSats) => {
  try {
    const prepareResponse = await sdk.preparePayOnchain({
      amountSat: amountSats,
    });
    
    const payResponse = await sdk.payOnchain({
      prepareResponse,
    });
    
    console.log('Swap initiated:', payResponse);
    return payResponse;
  } catch (error) {
    console.error('Error swapping to liquid:', error);
  }
};
```

#### Liquid to Lightning Swap

```javascript
const swapLiquidToLightning = async (sdk, amountSats) => {
  try {
    const prepareResponse = await sdk.prepareReceiveOnchain({
      payerAmountSat: amountSats,
    });
    
    const receiveResponse = await sdk.receiveOnchain({
      prepareResponse,
    });
    
    console.log('Swap address:', receiveResponse.address);
    return receiveResponse;
  } catch (error) {
    console.error('Error swapping to lightning:', error);
  }
};
```

### Backup and Restore

```javascript
const backupWallet = async (sdk) => {
  try {
    const backupStatus = await sdk.backup();
    console.log('Backup completed:', backupStatus);
  } catch (error) {
    console.error('Error backing up wallet:', error);
  }
};
```

## Error Handling

Always implement proper error handling:

```javascript
import { SdkError } from '@breeztech/react-native-breez-sdk-liquid';

try {
  // SDK operation
} catch (error) {
  if (error instanceof SdkError) {
    console.error('SDK Error:', error.message);
    // Handle specific SDK errors
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Event Handling

Listen to SDK events for real-time updates:

```javascript
const eventListener = (event) => {
  switch (event.type) {
    case BreezEvent.INVOICE_PAID:
      console.log('Invoice paid:', event.details);
      break;
    case BreezEvent.PAYMENT_SUCCEEDED:
      console.log('Payment succeeded:', event.details);
      break;
    case BreezEvent.PAYMENT_FAILED:
      console.log('Payment failed:', event.details);
      break;
    case BreezEvent.SYNCED:
      console.log('SDK synced');
      break;
    default:
      console.log('Event:', event);
  }
};
```

## Best Practices

1. **Always initialize the SDK before use** - Ensure proper initialization before making any SDK calls
2. **Handle errors gracefully** - Implement comprehensive error handling for all SDK operations
3. **Listen to events** - Use event listeners to keep your UI in sync with wallet state
4. **Test on testnet first** - Always test your integration on testnet before going to production
5. **Secure your API keys** - Store API keys securely using environment variables or secure storage
6. **Regular backups** - Implement automatic backup mechanisms for user wallets
7. **Monitor balances** - Keep track of both Lightning and Liquid balances
8. **Validate inputs** - Always validate user inputs before passing to SDK methods

## Cleanup

Always disconnect the SDK when done:

```javascript
const disconnectSDK = async (sdk) => {
  try {
    await sdk.disconnect();
    console.log('SDK disconnected');
  } catch (error) {
    console.error('Error disconnecting SDK:', error);
  }
};
```

## Official Documentation and Resources

- **Official Breez SDK Liquid Documentation**: https://sdk-doc-liquid.breez.technology/
- **GitHub Repository**: https://github.com/breez/breez-sdk-liquid
- **API Reference**: https://sdk-doc-liquid.breez.technology/guide/getting_started.html
- **React Native Package**: https://www.npmjs.com/package/@breeztech/react-native-breez-sdk-liquid
- **Breez Developer Portal**: https://breez.technology/sdk/
- **Liquid Network Documentation**: https://docs.liquid.net/
- **Support and Community**: https://github.com/breez/breez-sdk-liquid/issues

## Additional Resources

- **Example Projects**: https://github.com/breez/breez-sdk-liquid/tree/main/examples
- **Migration Guide**: https://sdk-doc-liquid.breez.technology/guide/migration.html
- **FAQ**: https://sdk-doc-liquid.breez.technology/guide/faq.html

## Troubleshooting

### Common Issues

1. **SDK initialization fails**
   - Check network connectivity
   - Verify API key (if using)
   - Ensure proper permissions (Android/iOS)

2. **Payment failures**
   - Verify sufficient balance
   - Check payment destination validity
   - Ensure network is reachable

3. **Sync issues**
   - Wait for initial sync to complete
   - Check event listener for sync status

## Support

For issues or questions:
- Open an issue on GitHub: https://github.com/breez/breez-sdk-liquid/issues
- Join the Breez community discussions
- Check the official documentation for updates

## License

The Breez SDK Liquid is open source. Check the official repository for license details.
