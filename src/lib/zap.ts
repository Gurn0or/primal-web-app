import { bech32 } from "@scure/base";
import { nip04, nip19, nip47, nip57, Relay, relayInit, utils } from "../lib/nTools";
import { Tier } from "../components/SubscribeToAuthorModal/SubscribeToAuthorModal";
import { Kind } from "../constants";
import { MegaFeedPage, NostrRelaySignedEvent, NostrUserZaps, PrimalArticle, PrimalDVM, PrimalNote, PrimalUser, PrimalZap, TopZap } from "../types/primal";
import { logError } from "./logger";
import { decrypt, enableWebLn, encrypt, sendPayment, signEvent } from "./nostrAPI";
import { decodeNWCUri } from "./wallet";
import { hexToBytes, parseBolt11 } from "../utils";
import { convertToUser } from "../stores/profile";
import { StreamingData } from "./streaming";
// Breez SDK Spark import
import { payInvoice as breezPayInvoice } from "./breez/breezPayments";

export let lastZapError: string = "";

export const canUserReceiveZaps = (user: PrimalUser | undefined): boolean => {
  if (!user) return false;
  return !!(user.lud16 || user.lud06);
};

export const zapNote = async (
  note: PrimalNote,
  pubkey: string,
  amount: number,
  message: string,
  relays: string[],
  nwcEnc?: string): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForNote(note, amount, message);
    
    if (!invoice) {
      lastZapError = 'Failed to create invoice';
      return false;
    }

    return await payInvoice(invoice, pubkey, relays, nwcEnc);
  } catch (error: any) {
    logError('zapNote error', error);
    lastZapError = error.message || 'Failed to zap note';
    return false;
  }
};

export const zapArticle = async (
  article: PrimalArticle,
  pubkey: string,
  amount: number,
  message: string,
  relays: string[],
  nwcEnc?: string): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForArticle(article, amount, message);
    
    if (!invoice) {
      lastZapError = 'Failed to create invoice';
      return false;
    }

    return await payInvoice(invoice, pubkey, relays, nwcEnc);
  } catch (error: any) {
    logError('zapArticle error', error);
    lastZapError = error.message || 'Failed to zap article';
    return false;
  }
};

export const zapProfile = async (
  user: PrimalUser,
  pubkey: string,
  amount: number,
  message: string,
  relays: string[],
  nwcEnc?: string): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForProfile(user, amount, message);
    
    if (!invoice) {
      lastZapError = 'Failed to create invoice';
      return false;
    }

    return await payInvoice(invoice, pubkey, relays, nwcEnc);
  } catch (error: any) {
    logError('zapProfile error', error);
    lastZapError = error.message || 'Failed to zap profile';
    return false;
  }
};

export const zapStream = async (
  stream: StreamingData,
  pubkey: string,
  amount: number,
  message: string,
  relays: string[],
  nwcEnc?: string): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForStream(stream, amount, message);
    
    if (!invoice) {
      lastZapError = 'Failed to create invoice';
      return false;
    }

    return await payInvoice(invoice, pubkey, relays, nwcEnc);
  } catch (error: any) {
    logError('zapStream error', error);
    lastZapError = error.message || 'Failed to zap stream';
    return false;
  }
};

export const parseZapEvent = (zapEvent: NostrRelaySignedEvent): PrimalZap | undefined => {
  let zap: PrimalZap = {
    id: zapEvent.id,
    message: '',
    amount: 0,
    pubkey: '',
    eventId: '',
    created_at: zapEvent.created_at,
  };

  const bolt11Tag = zapEvent.tags.find((t: string[]) => t[0] === 'bolt11');

  if (bolt11Tag) {
    const bolt11 = bolt11Tag[1];
    const amountMatch = bolt11.match(/lnbc(\d+)/i);
    if (amountMatch) {
      const btc = parseInt(amountMatch[1]);
      zap.amount = btc / 100_000_000_000; // Convert to BTC
    }
  }

  const description = zapEvent.tags.find((t: string[]) => t[0] === 'description');

  if (description) {
    try {
      const zapRequest = JSON.parse(description[1]);
      zap.message = zapRequest.content;
      zap.pubkey = zapRequest.pubkey;

      const pTag = zapRequest.tags.find((t: string[]) => t[0] === 'p');
      if (pTag) {
        zap.reciver = pTag[1];
      }

      const eTag = zapRequest.tags.find((t: string[]) => t[0] === 'e');
      if (eTag) {
        zap.eventId = eTag[1];
      }
    } catch (e) {
      logError(e);
    }
  }

  return zap;
};

export const topZapFeed = (page: MegaFeedPage) => {
  const sorted = page.topZaps.sort((a, b) => b.amount - a.amount);
  const zapList: TopZap[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const zap = sorted[i];
    zapList.push({
      ...zap,
      sender: page.users[zap.pubkey],
    });
  }
  return zapList;
};

// Stub functions that need implementation
export const createZapInvoiceForNote = async (note: PrimalNote, amount: number, message?: string): Promise<string> => {
  throw new Error('stub');
};

export const createZapInvoiceForArticle = async (article: PrimalArticle, amount: number, message?: string): Promise<string> => {
  throw new Error('stub');
};

export const createZapInvoiceForProfile = async (user: PrimalUser, amount: number, message?: string): Promise<string> => {
  throw new Error('stub');
};

export const createZapInvoiceForStream = async (stream: StreamingData, amount: number, message?: string): Promise<string> => {
  throw new Error('stub');
};

export const zapSubscription = async (
  tier: any,
  amountMsat: number,
  message: string
): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForSubscription(tier, amountMsat, message);
    return await payInvoice(invoice);
  } catch (error: any) {
    logError('zapSubscription error', error);
    lastZapError = error.message || 'Failed to zap subscription';
    return false;
  }
};

async function createZapInvoiceForSubscription(tier: any, amountMsat: number, message: string): Promise<string> {
  throw new Error('stub - createZapInvoiceForSubscription not implemented');
}

export const payInvoice = async (
  invoice: string,
  pubkey?: string,
  relays?: string[],
  nwcEnc?: string
): Promise<boolean> => {
  try {
    // Try Breez SDK first
    try {
      const result = await breezPayInvoice(invoice);
      if (result) {
        return true;
      }
    } catch (breezError) {
      logError('Breez payment failed, trying fallback', breezError);
    }

    // Fallback to WebLN or NWC
    if (nwcEnc) {
      return await payWithNWC(invoice, nwcEnc, pubkey, relays);
    }

    // Try WebLN
    const webln = await enableWebLn();
    if (webln) {
      const result = await sendPayment(invoice);
      return !!result.preimage;
    }

    lastZapError = 'No payment method available';
    return false;
  } catch (error: any) {
    logError('payInvoice error', error);
    lastZapError = error.message || 'Failed to pay invoice';
    return false;
  }
};

const payWithNWC = async (
  invoice: string,
  nwcEnc: string,
  pubkey?: string,
  relays?: string[]
): Promise<boolean> => {
  if (!pubkey || !relays) {
    throw new Error('Missing pubkey or relays for NWC payment');
  }

  try {
    const nwcUri = await decrypt(pubkey, nwcEnc);
    const nwc = decodeNWCUri(nwcUri);
    
    const relay = relayInit(nwc.relay);
    await relay.connect();

    const payRequest = {
      method: 'pay_invoice',
      params: {
        invoice,
      },
    };

    const encryptedContent = await encrypt(nwc.pubkey, JSON.stringify(payRequest));
    
    const event = await signEvent({
      kind: Kind.NWC,
      content: encryptedContent,
      tags: [['p', nwc.pubkey]],
      created_at: Math.floor(Date.now() / 1000),
    });

    await relay.publish(event);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        relay.close();
        reject(new Error('NWC payment timeout'));
      }, 30000);

      const sub = relay.subscribe(
        [{
          kinds: [Kind.NWCResponse],
          authors: [nwc.pubkey],
          '#p': [pubkey],
        }],
        {
          onevent: async (responseEvent: any) => {
            clearTimeout(timeout);
            const decrypted = await decrypt(nwc.pubkey, responseEvent.content);
            const response = JSON.parse(decrypted);
            
            relay.close();
            
            if (response.result?.preimage) {
              resolve(true);
            } else {
              reject(new Error(response.error?.message || 'Payment failed'));
            }
          },
        }
      );
    });
  } catch (error: any) {
    throw new Error(`NWC payment failed: ${error.message}`);
  }
};
