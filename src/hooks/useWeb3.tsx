import {createContext, FC, ReactNode, useCallback, useContext, useEffect, useReducer} from 'react';
import {providers} from 'ethers';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Web3Modal from 'web3modal';

const {INFURA_PROJECT_ID} = process.env;

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: INFURA_PROJECT_ID,
    },
  },
};

let web3Modal: Web3Modal;

if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    // network: 'mainnet',
    cacheProvider: true,
    providerOptions,
    theme: {
      background: '#13110D',
      main: 'white',
      secondary: 'rgb(136, 136, 136)',
      border: '#817456',
      hover: '#70613F',
    },
  });
}

export type StateType = {
  provider: any | null;
  web3Provider: providers.Web3Provider | null;
  address: string | null;
  chainId: number;
  connected: boolean;
};

export const enum Actions {
  SET_WEB3_PROVIDER = 'SET_WEB3_PROVIDER',
  SET_ADDRESS = 'SET_ADDRESS',
  SET_CHAIN_ID = 'SET_CHAIN_ID',
  RESET_WEB3_PROVIDER = 'RESET_WEB3_PROVIDER',
}

export type ActionType =
  | {
      type: Actions.SET_WEB3_PROVIDER;
      provider: StateType['provider'] | null;
      web3Provider: StateType['web3Provider'] | null;
      address: StateType['address'] | null;
      chainId: StateType['chainId'];
    }
  | {
      type: Actions.SET_ADDRESS;
      address: StateType['address'] | null;
    }
  | {
      type: Actions.SET_CHAIN_ID;
      chainId: StateType['chainId'];
    }
  | {
      type: Actions.RESET_WEB3_PROVIDER;
    };

interface IWallet extends StateType {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}
const WalletContext = createContext<IWallet | undefined>(undefined);

const initialState: StateType = {
  provider: null,
  web3Provider: null,
  address: null,
  chainId: 1,
  connected: false,
};

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case Actions.SET_WEB3_PROVIDER:
      return {
        ...state,
        provider: action.provider,
        web3Provider: action.web3Provider,
        address: action.address,
        chainId: action.chainId,
        connected: Boolean(action.address),
      };
    case Actions.SET_ADDRESS:
      return {
        ...state,
        address: action.address,
      };
    case Actions.SET_CHAIN_ID:
      return {
        ...state,
        chainId: action.chainId,
      };
    case Actions.RESET_WEB3_PROVIDER:
      return initialState;
    default:
      throw new Error();
  }
}

const useWalletStore = (): IWallet => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {provider} = state;

  const connect = useCallback(async () => {
    // This is the initial `provider` that is returned when
    // using web3Modal to connect. Can be MetaMask or WalletConnect.
    const provider = await web3Modal.connect();

    // We plug the initial `provider` into ethers.js and get back
    // a Web3Provider. This will add on methods from ethers.js and
    // event listeners such as `.on()` will be different.
    const web3Provider = new providers.Web3Provider(provider);

    const signer = web3Provider.getSigner();
    const address = await signer.getAddress();

    const network = await web3Provider.getNetwork();

    dispatch({
      type: Actions.SET_WEB3_PROVIDER,
      provider,
      web3Provider,
      address,
      chainId: network.chainId,
    });
  }, []);

  const disconnect = useCallback(async () => {
    web3Modal.clearCachedProvider();
    if (provider?.disconnect && typeof provider.disconnect === 'function') {
      await provider.disconnect();
    }
    dispatch({
      type: Actions.RESET_WEB3_PROVIDER,
    });
  }, [provider]);
  // Auto connect to the cached provider
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect();
    }
  }, [connect]);

  // A `provider` should come with EIP-1193 events. We'll listen for those events
  // here so that when a user switches accounts or networks, we can update the
  // local React state with that new information.
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        // eslint-disable-next-line no-console
        console.log('accountsChanged', accounts);
        dispatch({
          type: Actions.SET_ADDRESS,
          address: accounts[0],
        });
      };

      // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
      const handleChainChanged = (_hexChainId: string) => {
        window.location.reload();
      };

      const handleDisconnect = (error: {code: number; message: string}) => {
        // eslint-disable-next-line no-console
        console.log('disconnect', error);
        disconnect();
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      provider.on('disconnect', handleDisconnect);

      // Subscription Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
          provider.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [provider, disconnect]);
  return {...state, connect, disconnect};
};

export const WalletProvider: FC<{
  children: ReactNode;
}> = ({children}) => {
  const value = useWalletStore();
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWalletProvider = (): IWallet => {
  const globalStore = useContext(WalletContext);
  if (!globalStore) {
    throw new Error('useWalletProvider init error, you may have tried to use context outside of a provider');
  }
  return globalStore;
};
