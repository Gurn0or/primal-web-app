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
  nwcEnc?: string
): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForNote(note, amount, message);
    
    if (!invoice) {
      lastZapError = 'Failed to create invoice';
      return false;
    }

    if (nwcEnc) {
      const success = await zapOverNWC(pubkey, nwcEnc, invoice);
      if (success) return true;
    }

    return await payInvoice(invoice, 'webln');
  } catch (e: any) {
    lastZapError = e.message || 'Zap failed';
    logError(e);
    return false;
  }
};

export const zapArticle = async (
  article: PrimalArticle,
  pubkey: string,
  amount: number,
  message: string,
  relays: string[],
  nwcEnc?: string
): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForArticle(article, amount, message);
    
    if (!invoice) {
      lastZapError = 'Failed to create invoice';
      return false;
    }

    if (nwcEnc) {
      const success = await zapOverNWC(pubkey, nwcEnc, invoice);
      if (success) return true;
    }

    return await payInvoice(invoice, 'webln');
  } catch (e: any) {
    lastZapError = e.message || 'Zap failed';
    logError(e);
    return false;
  }
};

export const zapProfile = async (
  profile: PrimalUser,
  pubkey: string,
  amount: number,
  message: string,
  relays: string[],
  nwcEnc?: string
): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForProfile(profile, amount, message);
    
    if (!invoice) {
      lastZapError = 'Failed to create invoice';
      return false;
    }

    if (nwcEnc) {
      const success = await zapOverNWC(pubkey, nwcEnc, invoice);
      if (success) return true;
    }

    return await payInvoice(invoice, 'webln');
  } catch (e: any) {
    lastZapError = e.message || 'Zap failed';
    logError(e);
    return false;
  }
};

export const zapDVM = async (
  dvm: PrimalDVM,
  dvmUser: PrimalUser,
  pubkey: string,
  amount: number,
  message: string,
  relays: string[]
): Promise<boolean> => {
  try {
    // For DVM, we might need a different invoice creation approach
    // Using profile invoice as fallback
    const invoice = await createZapInvoiceForProfile(dvmUser, amount, message);
    
    if (!invoice) {
      lastZapError = 'Failed to create invoice';
      return false;
    }

    return await payInvoice(invoice, 'webln');
  } catch (e: any) {
    lastZapError = e.message || 'Zap failed';
    logError(e);
    return false;
  }
};

export const zapStream = async (
  stream: StreamingData,
  streamAuthor: PrimalUser,
  pubkey: string,
  amount: number,
  message: string,
  relays: string[],
  nwcEnc?: string
): Promise<{success: boolean, event?: any}> => {
  try {
    const invoice = await createZapInvoiceForStream(stream, amount, message);
    
    if (!invoice) {
      lastZapError = 'Failed to create invoice';
      return {success: false};
    }

    let paymentSuccess = false;
    if (nwcEnc) {
      paymentSuccess = await zapOverNWC(pubkey, nwcEnc, invoice);
    }

    if (!paymentSuccess) {
      paymentSuccess = await payInvoice(invoice, 'webln');
    }

    return {success: paymentSuccess, event: null};
  } catch (e: any) {
    lastZapError = e.message || 'Zap failed';
    logError(e);
    return {success: false};
  }
};

export const zapOverNWC = async (pubkey: string, nwcEnc: string, invoice: string) => {
  let promises: Promise<boolean>[] = [];
  let relays: Relay[] = [];
  let result: boolean = false;

  try {
    const nwc = await decrypt(pubkey, nwcEnc);
    const nwcConfig = decodeNWCUri(nwc);
    const request = await nip47.makeNwcRequestEvent(nwcConfig.pubkey, hexToBytes(nwcConfig.secret), invoice);

    if (nwcConfig.relays.length === 0) return false;

    for (let i = 0; i < nwcConfig.relays.length; i++) {
      const relay = relayInit(nwcConfig.relays[i]);
      promises.push(new Promise(async (resolve) => {
        try {
          await relay.connect();
          relays.push(relay);
          const published = relay.publish(request);
          published.on('ok', () => {
            result = true;
            resolve(true);
          });
          published.on('failed', () => {
            resolve(false);
          });
        } catch (error) {
          logError(error);
          resolve(false);
        }
      }));
    }

    await Promise.any(promises);
    return result;
  } catch (e) {
    logError(e);
    return false;
  } finally {
    for (let i = 0; i < relays.length; i++) {
      relays[i].close();
    }
  }
}

export const payInvoice = async (invoice: string, paymentMethod?: 'webln' | 'nwc' | 'breez') => {
  lastZapError = '';

  if (!paymentMethod) {
    lastZapError = 'No payment method specified';
    return false;
  }

  try {
    if (paymentMethod === 'webln') {
      const webln = await enableWebLn();
      if (!webln) {
        lastZapError = 'WebLN not available';
        return false;
      }
      const result = await sendPayment(invoice);
      return !!result;
    } else if (paymentMethod === 'breez') {
      const result = await breezPayInvoice(invoice);
      return result;
    }
  } catch (e: any) {
    lastZapError = e.message || 'Payment failed';
    logError(e);
    return false;
  }

  return false;
};

export const parseZapPayload = (zapEvent: NostrRelaySignedEvent, subId?: string) => {
  const zap: PrimalZap = {
    id: zapEvent.id,
    message: '',
    amount: 0,
    pubkey: zapEvent.pubkey,
    eventId: '',
    sender: undefined,
    reciver: undefined,
  };

  const bolt11Tag = zapEvent.tags.find(t => t[0] === 'bolt11');

  if (bolt11Tag) {
    const decoded = parseBolt11(bolt11Tag[1]);
    zap.amount = decoded?.amount || 0;
  }

  const description = zapEvent.tags.find(t => t[0] === 'description');
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
