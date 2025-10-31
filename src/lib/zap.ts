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

export const zapOverNWC = async (pubkey: string, nwcEnc: string, invoice: string) => {
  let promises: Promise<boolean>[] = [];
  let relays: Relay[] = [];
  let result: boolean = false;

  try {
    const nwc = await decrypt(pubkey, nwcEnc);
    const nwcConfig = decodeNWCUri(nwc);
    const request = await nip47.makeNwcRequestEvent(nwcConfig.pubkey, hexToBytes(nwcConfig.secret), invoice)

    if (nwcConfig.relays.length === 0) return false;

    for (let i = 0; i < nwcConfig.relays.length; i++) {
      const relay = relayInit(nwcConfig.relays[i]);

      promises.push(new Promise(async (resolve) => {
        try {
          await relay.connect();
          relays.push(relay);

          let isResolved = false;

          const sub = relay.sub([{ kinds: [23195], "#e": [request.id] }]);

          sub.on('event', (event: any) => {
            try {
              const decryptedContent = nip04.decrypt(nwcConfig.secret, nwcConfig.pubkey, event.content);
              const content = JSON.parse(decryptedContent);

              if (content.result) {
                result = true;
              }
            }
            catch (e: any) {
              logError('Failed to decrypt payment response from NWC', e);
            }
            finally {
              sub.unsub();
              if (!isResolved) {
                isResolved = true;
                resolve(result);
              }
            }
          });

          const signedEvent = await signEvent(request);

          if (!signedEvent) {
            throw ('Failed to sign event');
          }

          relay.publish(signedEvent);
        }
        catch (e) {
          resolve(false);
        }
      }));
    }

    await Promise.all(promises);

    return result;
  }
  catch (e: any) {
    logError('Failed to send payment over NWC', e);
    return false;
  }
  finally {
    relays.forEach((r) => r.close());
  }
}

// Breez SDK Spark payment function
const tryBreez = async (invoice: string): Promise<boolean> => {
  try {
    const result = await breezPayInvoice(invoice);
    return result.success;
  } catch (error: any) {
    lastZapError = error.message || 'Breez payment failed';
    logError('Breez payment error', error);
    return false;
  }
};

export const payInvoice = async (invoice: string, pubkey?: string, nwcEnc?: string) => {
  // Try Breez SDK Spark first
  const breezSuccess = await tryBreez(invoice);
  if (breezSuccess) return true;

  // Fallback to WebLN if Breez fails
  const wlnSuccess = await sendPayment(invoice);
  if (wlnSuccess) return true;

  // Fallback to NWC if both Breez and WebLN fail
  if (pubkey && nwcEnc) {
    const nwcSuccess = await zapOverNWC(pubkey, nwcEnc, invoice);
    if (nwcSuccess) return true;
  }

  return false;
};

export const parseZapPayload = (zap: PrimalZap) => {
  try {
    return JSON.parse(zap.message || '{}');
  }
  catch (e) {
    return {};
  }
};

export const topZapFeed = (zaps: PrimalZap[]): TopZap[] => {
  const userZaps: Record<string, TopZap> = zaps.reduce((acc, zap) => {
    if (!zap.sender) {
      return { ...acc };
    }

    const key = zap.sender.pubkey || '';

    const zapAmount = acc[key] === undefined ? 0 : acc[key].amount;
    const zapCount = acc[key] === undefined ? 0 : acc[key].amount_count;

    return {
      ...acc,
      [key]: {
        amount: zapAmount + zap.amount,
        amount_count: zapCount + 1,
        sender: { ...zap.sender },
      },
    };
  }, {});

  return Object.keys(userZaps).map((key) => ({
    ...userZaps[key],
  })).sort((a, b) => b.amount - a.amount).slice(0, 10);
};

async function createZapInvoiceForNote(note: PrimalNote, amountMsat: number, message: string): Promise<string> {
  throw new Error('stub');
}

async function createZapInvoiceForArticle(article: PrimalArticle, amountMsat: number, message: string): Promise<string> {
  throw new Error('stub');
}

async function createZapInvoiceForProfile(profile: PrimalUser, amountMsat: number, message: string): Promise<string> {
  throw new Error('stub');
}

async function createZapInvoiceForStream(stream: StreamingData, amountMsat: number, message: string): Promise<string> {
  throw new Error('stub');
}
