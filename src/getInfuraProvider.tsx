import {providers} from 'ethers';
import memoizee from 'memoizee';

const {INFURA_PROJECT_ID} = process.env;

export const getInfuraProvider = memoizee((chainId: number) => {
  const domain = chainIdToName(chainId);
  const url = `https://${domain}.infura.io/v3/${INFURA_PROJECT_ID}`;
  return providers.getDefaultProvider(url);
});

function chainIdToName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'mainnet';
    case 3:
      return 'ropsten';
    case 4:
      return 'rinkeby';
    case 5:
      return 'goerli';
    case 42:
      return 'kovan';
  }

  return 'mainnet';
}
