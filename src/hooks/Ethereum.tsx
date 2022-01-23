import {createContext, ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {BaseProvider, Web3Provider} from '@ethersproject/providers';
import {Signer} from '@ethersproject/abstract-signer';
import {getInfuraProvider} from '../getInfuraProvider';
import detectEthereumProvider from '@metamask/detect-provider';
import ga from '../ga';

type Ethereum = {
  ethereum: EthereumGlobalObject | null;
  chainId: number;
  provider: BaseProvider;
  address: string | null;
  signer: Signer | null;
};

type EthereumGlobalObject = {
  chainId: string | null;
  selectedAddress: string | null;
  autoRefreshOnNetworkChange: boolean;
  request?: (request: {method: string; params?: Array<any>}) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => any;
  removeListener: (event: string, callback: (...args: any[]) => void) => any;
};

const EthereumContext = createContext<Ethereum>({
  ethereum: (global as any).ethereum || null,
  chainId: 1,
  provider: getInfuraProvider(1),
  address: null,
  signer: null,
});

export function EthereumProvider({children}: {children: ReactNode}) {
  const [ethereum, setEthereum] = useState<EthereumGlobalObject | null>((global as any).ethereum || null);
  useEffect(() => {
    detectEthereumProvider().then((e) => setEthereum(e as EthereumGlobalObject));
  }, []);

  useEffect(() => {
    if (ethereum) {
      ethereum.autoRefreshOnNetworkChange = false;
    }
  }, [ethereum]);

  if (!ethereum) {
    return <>{children}</>;
  }

  return <LocalEthereumProvider ethereum={ethereum}>{children}</LocalEthereumProvider>;
}

function LocalEthereumProvider({children, ethereum}: {children: ReactNode; ethereum: EthereumGlobalObject}) {
  const [address, setAddress] = useState(() => ethereum.selectedAddress);
  const [chainId, setChainId] = useState(() => ethereum.chainId);

  useEffect(() => {
    const selectFirstAddress = (addresses: string[]) => setAddress(addresses[0]);
    ethereum.on('accountsChanged', selectFirstAddress);

    return () => ethereum.removeListener('accountsChanged', selectFirstAddress);
  }, [ethereum, ethereum.selectedAddress]);

  // Hack because sometimes we don't get selectedAddress right away!
  useEffect(() => {
    if (ethereum.selectedAddress && ethereum.chainId) {
      return;
    }

    let timeout: NodeJS.Timeout;
    let attempts = 0;
    function poll() {
      if (ethereum.selectedAddress && ethereum.chainId) {
        setAddress(ethereum.selectedAddress);
        setChainId(ethereum.chainId);
      } else {
        attempts++;
        timeout = setTimeout(poll, Math.min(1000, 2 ** attempts));
      }
    }

    poll();

    return () => clearTimeout(timeout);
  }, [ethereum, ethereum.selectedAddress, ethereum.chainId]);

  useEffect(() => {
    const selectChain = (chainId: string) => setChainId(chainId);
    ethereum.on('chainChanged', selectChain);

    return () => ethereum.removeListener('chainChanged', selectChain);
  }, [ethereum, ethereum.chainId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const provider = useMemo(() => new Web3Provider(ethereum), [ethereum, chainId]);

  const value = useMemo(
    () => ({
      ethereum,
      chainId: Number(chainId) || 1,
      address,
      provider,
      signer: provider instanceof Web3Provider ? provider.getSigner() : null,
    }),
    [ethereum, chainId, provider, address],
  );

  return <EthereumContext.Provider value={value}>{children}</EthereumContext.Provider>;
}

export function useEthereum() {
  return useContext(EthereumContext);
}

export function useConnect() {
  const {ethereum} = useEthereum();
  const connect = useCallback(() => {
    if (!ethereum || !ethereum.request) {
      alert('Please install Metamask');
      window.open('https://metamask.io/');
      return;
    }

    ga.sendEvent({eventCategory: 'Wallet', eventAction: 'Connect'});
    ethereum.request({method: 'eth_requestAccounts'});
  }, [ethereum]);

  return connect;
}

export function useSwitchNetworks(chainId: number) {
  const {ethereum} = useEthereum();
  const connect = useCallback(() => {
    ethereum?.request?.({method: 'wallet_switchEthereumChain', params: [{chainId: '0x' + chainId.toString(16)}]});
  }, [chainId, ethereum]);

  return connect;
}
