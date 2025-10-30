import { parseInput, lnurlPay, lnurlWithdraw, type InputType } from '@breeztech/react-native-breez-sdk';

/**
 * LNURL Protocol Support for Breez SDK Integration
 * Handles LNURL-pay, LNURL-withdraw, and Lightning Address payments
 */

// Types for LNURL operations
export interface LnUrlParseResult {
  type: 'pay' | 'withdraw' | 'auth' | 'channel' | 'error';
  data: any;
  error?: string;
}

export interface LnUrlPayRequest {
  domain: string;
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
  commentAllowed?: number;
  tag: string;
}

export interface LnUrlPayResult {
  success: boolean;
  paymentHash?: string;
  invoice?: string;
  error?: string;
}

export interface LightningAddressInfo {
  username: string;
  domain: string;
  address: string;
}

/**
 * Parse LNURL or Lightning Address
 * @param input - LNURL string or Lightning Address (user@domain.com)
 * @returns Parsed LNURL information
 */
export async function parseLnUrl(input: string): Promise<LnUrlParseResult> {
  try {
    // Check if input is a Lightning Address (user@domain format)
    if (isLightningAddress(input)) {
      const addressInfo = parseLightningAddress(input);
      if (!addressInfo) {
        return {
          type: 'error',
          data: null,
          error: 'Invalid Lightning Address format'
        };
      }
      
      // Convert Lightning Address to LNURL
      input = await convertLightningAddressToLnUrl(addressInfo);
    }

    // Use Breez SDK's parseInput to handle LNURL
    const parseResult = await parseInput(input);
    
    switch (parseResult.type) {
      case 'ln_url_pay':
        return {
          type: 'pay',
          data: parseResult.data
        };
      
      case 'ln_url_withdraw':
        return {
          type: 'withdraw',
          data: parseResult.data
        };
      
      case 'ln_url_auth':
        return {
          type: 'auth',
          data: parseResult.data
        };
      
      case 'ln_url_error':
        return {
          type: 'error',
          data: parseResult.data,
          error: parseResult.data?.reason || 'LNURL error'
        };
      
      default:
        return {
          type: 'error',
          data: null,
          error: 'Unsupported LNURL type'
        };
    }
  } catch (error) {
    console.error('Error parsing LNURL:', error);
    return {
      type: 'error',
      data: null,
      error: error instanceof Error ? error.message : 'Failed to parse LNURL'
    };
  }
}

/**
 * Pay a LNURL
 * @param lnurlPayUrl - LNURL pay URL or Lightning Address
 * @param amountSats - Amount to pay in satoshis
 * @param comment - Optional comment to include with payment
 * @returns Payment result with invoice and payment hash
 */
export async function payLnUrl(
  lnurlPayUrl: string,
  amountSats: number,
  comment?: string
): Promise<LnUrlPayResult> {
  try {
    // First parse the LNURL to get payment details
    const parseResult = await parseLnUrl(lnurlPayUrl);
    
    if (parseResult.type === 'error') {
      return {
        success: false,
        error: parseResult.error || 'Failed to parse LNURL'
      };
    }
    
    if (parseResult.type !== 'pay') {
      return {
        success: false,
        error: 'Not a LNURL-pay request'
      };
    }

    const payData = parseResult.data;
    
    // Validate amount is within acceptable range
    if (payData.minSendable && amountSats * 1000 < payData.minSendable) {
      return {
        success: false,
        error: `Amount too small. Minimum: ${payData.minSendable / 1000} sats`
      };
    }
    
    if (payData.maxSendable && amountSats * 1000 > payData.maxSendable) {
      return {
        success: false,
        error: `Amount too large. Maximum: ${payData.maxSendable / 1000} sats`
      };
    }

    // Use Breez SDK's lnurlPay function
    const lnurlPayRequest = {
      data: payData,
      amountMsat: amountSats * 1000,
      comment: comment || undefined
    };
    
    const payResult = await lnurlPay(lnurlPayRequest);
    
    return {
      success: true,
      paymentHash: payResult.payment?.id,
      invoice: payResult.payment?.bolt11
    };
  } catch (error) {
    console.error('Error paying LNURL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pay LNURL'
    };
  }
}

/**
 * Check if input is a Lightning Address
 * @param input - String to check
 * @returns True if input matches Lightning Address format
 */
export function isLightningAddress(input: string): boolean {
  const lightningAddressRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return lightningAddressRegex.test(input);
}

/**
 * Parse Lightning Address into components
 * @param address - Lightning Address (user@domain.com)
 * @returns Lightning Address information or null if invalid
 */
export function parseLightningAddress(address: string): LightningAddressInfo | null {
  if (!isLightningAddress(address)) {
    return null;
  }
  
  const [username, domain] = address.split('@');
  
  if (!username || !domain) {
    return null;
  }
  
  return {
    username,
    domain,
    address
  };
}

/**
 * Convert Lightning Address to LNURL
 * @param addressInfo - Parsed Lightning Address information
 * @returns LNURL string
 */
export async function convertLightningAddressToLnUrl(
  addressInfo: LightningAddressInfo
): Promise<string> {
  const { username, domain } = addressInfo;
  
  // Lightning Address uses the .well-known LNURL format
  // https://domain.com/.well-known/lnurlp/username
  const url = `https://${domain}/.well-known/lnurlp/${username}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Lightning Address: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the callback URL which is the LNURL endpoint
    if (data.callback) {
      return data.callback;
    }
    
    throw new Error('Invalid Lightning Address response: missing callback');
  } catch (error) {
    console.error('Error converting Lightning Address:', error);
    throw error;
  }
}

/**
 * Handle LNURL-withdraw
 * @param lnurlWithdrawUrl - LNURL withdraw URL
 * @param amountSats - Amount to withdraw in satoshis (optional)
 * @returns Withdraw result
 */
export async function withdrawLnUrl(
  lnurlWithdrawUrl: string,
  amountSats?: number
): Promise<LnUrlPayResult> {
  try {
    const parseResult = await parseLnUrl(lnurlWithdrawUrl);
    
    if (parseResult.type === 'error') {
      return {
        success: false,
        error: parseResult.error || 'Failed to parse LNURL'
      };
    }
    
    if (parseResult.type !== 'withdraw') {
      return {
        success: false,
        error: 'Not a LNURL-withdraw request'
      };
    }

    const withdrawData = parseResult.data;
    
    // Use provided amount or max withdrawable
    const withdrawAmount = amountSats 
      ? amountSats * 1000 
      : withdrawData.maxWithdrawable;

    // Use Breez SDK's lnurlWithdraw function
    const withdrawRequest = {
      data: withdrawData,
      amountMsat: withdrawAmount
    };
    
    const withdrawResult = await lnurlWithdraw(withdrawRequest);
    
    return {
      success: true,
      invoice: withdrawResult.data?.invoice
    };
  } catch (error) {
    console.error('Error withdrawing LNURL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to withdraw LNURL'
    };
  }
}

/**
 * Validate LNURL format
 * @param input - String to validate
 * @returns True if valid LNURL format
 */
export function isValidLnUrl(input: string): boolean {
  // Check for bech32 encoded LNURL
  if (input.toLowerCase().startsWith('lnurl')) {
    return true;
  }
  
  // Check for Lightning Address
  if (isLightningAddress(input)) {
    return true;
  }
  
  // Check for LNURL over clearnet (lnurlp/lnurlw URLs)
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input.includes('lnurl') || input.includes('.well-known');
  }
  
  return false;
}

/**
 * Get payment request from LNURL
 * @param lnurlOrAddress - LNURL or Lightning Address
 * @returns Payment request details
 */
export async function getLnUrlPaymentRequest(
  lnurlOrAddress: string
): Promise<LnUrlPayRequest | null> {
  try {
    const parseResult = await parseLnUrl(lnurlOrAddress);
    
    if (parseResult.type !== 'pay') {
      return null;
    }
    
    return parseResult.data as LnUrlPayRequest;
  } catch (error) {
    console.error('Error getting LNURL payment request:', error);
    return null;
  }
}

export default {
  parseLnUrl,
  payLnUrl,
  withdrawLnUrl,
  isLightningAddress,
  parseLightningAddress,
  convertLightningAddressToLnUrl,
  isValidLnUrl,
  getLnUrlPaymentRequest
};
