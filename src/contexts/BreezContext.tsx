import { createContext, useContext, createSignal, onMount, JSX } from 'solid-js';
import { BreezSDK, NodeConfig } from '@breeztech/react-native-breez-sdk';

interface BreezContextType {
  isInitialized: () => boolean;
  nodeInfo: () => any | null;
  balance: () => number;
  connectNode: () => Promise<void>;
  sendPayment: (bolt11: string) => Promise<any>;
  receivePayment: (amount: number, description?: string) => Promise<string>;
  getTransactions: () => Promise<any[]>;
}

const BreezContext = createContext<BreezContextType>();

export function BreezProvider(props: { children: JSX.Element }) {
  const [isInitialized, setIsInitialized] = createSignal(false);
  const [nodeInfo, setNodeInfo] = createSignal<any | null>(null);
  const [balance, setBalance] = createSignal(0);

  const initializeBreez = async () => {
    try {
      // Initialize Breez SDK
      const config: NodeConfig = {
        type: 'greenlight',
        config: {
          partnerCredentials: {
            deviceKey: new Uint8Array(),
            deviceCert: new Uint8Array(),
          },
        },
      };

      await BreezSDK.connect(config, (event) => {
        console.log('Breez event:', event);
        if (event.type === 'nodeStateChanged') {
          setNodeInfo(event.data);
          updateBalance();
        }
      });

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Breez SDK:', error);
    }
  };

  const updateBalance = async () => {
    try {
      const info = await BreezSDK.nodeInfo();
      setBalance(info.channelsBalanceMsat / 1000);
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  const connectNode = async () => {
    await initializeBreez();
  };

  const sendPayment = async (bolt11: string) => {
    try {
      const payment = await BreezSDK.sendPayment({ bolt11 });
      await updateBalance();
      return payment;
    } catch (error) {
      console.error('Failed to send payment:', error);
      throw error;
    }
  };

  const receivePayment = async (amount: number, description?: string) => {
    try {
      const invoice = await BreezSDK.receivePayment({
        amountMsat: amount * 1000,
        description: description || '',
      });
      return invoice.lnInvoice.bolt11;
    } catch (error) {
      console.error('Failed to receive payment:', error);
      throw error;
    }
  };

  const getTransactions = async () => {
    try {
      const payments = await BreezSDK.listPayments({});
      return payments;
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  };

  onMount(() => {
    initializeBreez();
  });

  const contextValue: BreezContextType = {
    isInitialized,
    nodeInfo,
    balance,
    connectNode,
    sendPayment,
    receivePayment,
    getTransactions,
  };

  return (
    <BreezContext.Provider value={contextValue}>
      {props.children}
    </BreezContext.Provider>
  );
}

export function useBreez() {
  const context = useContext(BreezContext);
  if (!context) {
    throw new Error('useBreez must be used within a BreezProvider');
  }
  return context;
}
