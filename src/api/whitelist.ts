import {Wallet} from '@ethersproject/wallet';
import * as trpc from '@trpc/server';
import dedent from 'dedent';
import {z} from 'zod';
import {RingsForLoot__factory} from '../../typechain';
import {getInfuraProvider} from '../getInfuraProvider';
import signWhitelist from '../signWhitelist';

const SIGNER = Wallet.fromMnemonic(process.env.WHITELIST_SIGNER_MNEMONIC!);

const WHITELIST = new Set(
  dedent`
  0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B
`
    .split('\n')
    .map((address) => address.toLowerCase()),
);

const whitelist = trpc
  .router()
  .query('signature', {
    input: z.object({
      contractAddress: z.string(),
      address: z.string(),
      chainId: z.number(),
    }),
    async resolve({input}) {
      const isWhitelisted = WHITELIST.has(input.address.toLowerCase());

      if (!isWhitelisted) {
        return null;
      }

      const rings = RingsForLoot__factory.connect(input.contractAddress, getInfuraProvider(input.chainId));
      const used = await rings.whitelistUsed(input.address);

      if (used) {
        return null;
      }

      return signWhitelist(input.chainId, input.contractAddress, SIGNER, input.address);
    },
  })
  .query('address', {
    resolve: () => SIGNER.address,
  });

export default whitelist;
