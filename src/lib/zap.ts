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

// Breez SDK imports (assumed available in project)
// If the SDK utilities are located elsewhere, adjust import paths accordingly
// COMMENTED OUT TEMPORARILY TO FIX DEPLOYMENT
// import { breezPayInvoice } from "../wallets/breez";

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
        await relay.connect();

        relays.push(relay);

        const subInfo = relay.subscribe({
          kinds: [nip47.KIND_NWC_REQUEST],
          ids: [request.id],
        });

        relay.on('notice', (n: string) => console.log('notice', n));
        relay.on('connect', () => console.log('connected'));
        relay.on('error', (e: any) => console.log('error', e));

        subInfo.on('event', (event: any) => {
          try {
            const res = nip47.parseNwcResponseEvent(event, hexToBytes(nwcConfig.secret));
            if (res.result_type === 'pay_invoice') {
              result = true;
              resolve(true);
            }
          } catch (e) {}
        });

        const ok = await relay.publish(request);

        setTimeout(() => resolve(false), 8000);
      }));
    }

    await Promise.all(promises);

    relays.forEach(r => { r && r.close(); });

    return result;
  } catch (error) {
    logError('zapOverNWC error: ', error);
    lastZapError = 'Failed to zap over NWC';
    return false;
  }
};

// COMMENTED OUT TEMPORARILY TO FIX DEPLOYMENT
// async function tryBreez(invoice: string, useBreez?: boolean): Promise<boolean> {
//   if (!useBreez) return false;
//   try {
//     await breezPayInvoice(invoice);
//     return true;
//   } catch (error) {
//     logError('tryBreez error: ', error);
//     return false;
//   }
// }

const payInvoice = async (invoice: string, options?: { useBreez?: boolean }): Promise<boolean> => {
  const { useBreez } = options || {};
  // COMMENTED OUT TEMPORARILY TO FIX DEPLOYMENT
  // if (await tryBreez(invoice, useBreez)) return true;
  try {
    await enableWebLn();
    await sendPayment(invoice);
    return true;
  } catch (error) {
    logError('payInvoice error: ', error);
    lastZapError = 'Failed to pay invoice';
    return false;
  }
};

export const zapNote = async (
  note: PrimalNote,
  amountMsat: number,
  message: string,
  useBreez?: boolean
): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForNote(note, amountMsat, message);
    return await payInvoice(invoice, { useBreez });
  } catch (e) {
    logError('zapNote error: ', e);
    lastZapError = 'Failed to zap note';
    return false;
  }
}

export const zapArticle = async (
  article: PrimalArticle,
  amountMsat: number,
  message: string,
  useBreez?: boolean
): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForArticle(article, amountMsat, message);
    return await payInvoice(invoice, { useBreez });
  } catch (e) {
    logError('zapArticle error: ', e);
    lastZapError = 'Failed to zap article';
    return false;
  }
}

export const zapProfile = async (
  profile: PrimalUser,
  amountMsat: number,
  message: string,
  useBreez?: boolean
): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForProfile(profile, amountMsat, message);
    return await payInvoice(invoice, { useBreez });
  } catch (e) {
    logError('zapProfile error: ', e);
    lastZapError = 'Failed to zap profile';
    return false;
  }
}

export const zapStream = async (
  stream: StreamingData,
  amountMsat: number,
  message: string,
  useBreez?: boolean
): Promise<boolean> => {
  try {
    const invoice = await createZapInvoiceForStream(stream, amountMsat, message);
    return await payInvoice(invoice, { useBreez });
  } catch (e) {
    logError('zapStream error: ', e);
    lastZapError = 'Failed to zap stream';
    return false;
  }
}

export const convertToZaps = (zapsInfo: NostrUserZaps): PrimalZap[] => {
  const zapsList = Object.keys(zapsInfo.zaps).reduce<any[]>((acc, key) => {
    const z = zapsInfo.zaps[key];
    return [...acc, { ...z }];
  }, []);

  return zapsList.map((zapInfo) => {

    const zapEvent = zapsInfo.zapEvents.find((e) => e.id === zapInfo.zap_receipt_id) || { pubkey: ''};

    return convertToZap(zapInfo, zapsInfo, zapEvent);
  });
};

export const convertToZap = (zapInfo: any, zapsInfo: NostrUserZaps, zapEvent?: NostrRelaySignedEvent) => {
  const sender = zapsInfo.users ? zapsInfo.users.find((u) => {
    return u.pubkey === zapInfo.sender;
  }) : undefined;

  const reciver = zapsInfo.users.find((u) => {
    return u.pubkey === zapInfo.receiver;
  });

  return {
    id: zapInfo.zap_receipt_id,
    message: zapInfo.message,
    amount: zapInfo.amount_sats,
    sender: sender ? convertToUser(sender) : undefined,
    reciver: reciver ? convertToUser(reciver) : undefined,
    created_at: zapInfo.created_at || 0,
    pubkey: zapEvent?.pubkey,
  };
};

export const parseZapNote = (zap?: PrimalZap, page?: MegaFeedPage) => {
  if (!zap) {
    return undefined;
  }

  const zapInfo = JSON.parse(zap.message || '{}');

  return page?.notes.find(n => n.post.noteId === nip19.noteEncode(zapInfo.e));
};

export const parseZapArticle = (zap?: PrimalZap, page?: MegaFeedPage) => {
  if (!zap) {
    return undefined;
  }

  const zapInfo = JSON.parse(zap.message || '{}');

  return page?.articles.find(a => a.naddr === zapInfo.a);
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
