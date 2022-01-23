import {BigNumber} from '@ethersproject/bignumber';
import {useQuery} from 'react-query';
import {useWalletProvider} from '../hooks/useWeb3';

export default function AccountInfo({address}: {address: string}) {
  const {web3Provider, disconnect} = useWalletProvider();
  const {data} = useQuery(['account', address], () => web3Provider?.lookupAddress(address));

  if (!data) {
    return <div onClick={disconnect}>{shortenAddress(address)}</div>;
  }

  return <div onClick={disconnect}>{shortenAddress(data || address)}</div>;
}

export function shortenAddress(address: string) {
  if (address.startsWith('0x') && address.length > 16) {
    address = address.substring(0, 6) + '…' + address.substr(address.length - 4);
  }
  return address;
}

type AccountInfo = {
  name: string | null;
  balance: BigNumber;
};
