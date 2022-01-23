import {useMemo} from 'react';
import {
  Genesis__factory,
  ILoot__factory,
  Loot__factory,
  RingsForLoot__factory,
  TemporalLoot__factory,
} from '../../typechain';
import addresses, {getAddress} from '../addresses';
import {useWalletProvider} from './useWeb3';

export function useLootReader() {
  const {web3Provider, chainId} = useWalletProvider();
  if (!web3Provider) {
    throw new Error('Not Connected');
  }

  return useMemo(
    () => ILoot__factory.connect(getAddress(addresses.loot, chainId, true), web3Provider),
    [web3Provider, chainId],
  );
}

export function useLootWriter() {
  const {web3Provider, chainId} = useWalletProvider();
  return useMemo(
    () => (web3Provider ? Loot__factory.connect(getAddress(addresses.loot, chainId), web3Provider?.getSigner()) : null),
    [web3Provider, chainId],
  );
}

export function useMLootReader() {
  const {web3Provider, chainId} = useWalletProvider();
  if (!web3Provider) {
    throw new Error('Not Connected');
  }

  return useMemo(
    () => ILoot__factory.connect(getAddress(addresses.mloot, chainId, true), web3Provider),
    [web3Provider, chainId],
  );
}

export function useMLootWriter() {
  const {web3Provider, chainId} = useWalletProvider();
  const signer = web3Provider?.getSigner();

  return useMemo(
    () => (signer ? TemporalLoot__factory.connect(getAddress(addresses.mloot, chainId), signer) : null),
    [signer, chainId],
  );
}

export function useGenesisReader() {
  const {web3Provider, chainId} = useWalletProvider();
  if (!web3Provider) {
    throw new Error('Not Connected');
  }

  return useMemo(
    () => ILoot__factory.connect(getAddress(addresses.genesis, chainId, true), web3Provider),
    [web3Provider, chainId],
  );
}

export function useGenesisWriter() {
  const {web3Provider, chainId} = useWalletProvider();
  const signer = web3Provider?.getSigner();

  return useMemo(
    () => (signer ? Genesis__factory.connect(getAddress(addresses.genesis, chainId), signer) : null),
    [signer, chainId],
  );
}

export function useRingsReader() {
  const {web3Provider, chainId} = useWalletProvider();
  if (!web3Provider) {
    throw new Error('Not Connected');
  }

  return useMemo(
    () => RingsForLoot__factory.connect(getAddress(addresses.rings, chainId, true), web3Provider),
    [web3Provider, chainId],
  );
}

export function useRingsWriter() {
  const {web3Provider, chainId} = useWalletProvider();
  const signer = web3Provider?.getSigner();

  return useMemo(
    () => (signer ? RingsForLoot__factory.connect(getAddress(addresses.rings, chainId), signer) : null),
    [signer, chainId],
  );
}
