import {useMutation, useQuery} from 'react-query';
import {IPFS_HASH} from '../src/data';
import {useGenesisReader, useLootReader, useMLootReader, useRingsWriter} from '../src/hooks/contracts';
import {trpc} from '../src/hooks/trpc';
import {useWalletProvider} from '../src/hooks/useWeb3';
import {SaleState} from '../src/loot';
import {Genesis__factory, Loot__factory, RingsForLoot__factory, TemporalLoot__factory} from '../typechain';
import {Sample1155__factory} from '../typechain/factories/Sample1155__factory';

export default function Bouncer() {
  const {connect, connected} = useWalletProvider();

  if (!connected) {
    return <button onClick={() => connect()}>Connect</button>;
  }

  return <Deploy />;
}

function Deploy() {
  const {web3Provider, address, chainId} = useWalletProvider();
  const signer = web3Provider?.getSigner();

  const loot = useLootReader();
  const mloot = useMLootReader();
  const genesis = useGenesisReader();
  const rings = useRingsWriter();

  const signerAddress = trpc.useQuery(['whitelist.address']);
  const saleState = useQuery('state', () => rings?.state());

  if (!signer) {
    throw new Error('Not connected');
  }

  return (
    <div>
      <div>
        Wallet: {address}, chain: {chainId}
      </div>
      <Action
        name="Deploy Loot"
        code={async () => {
          const Loot = new Loot__factory(signer);
          const loot = await Loot.deploy();
          return loot.address;
        }}
      />
      <Action
        name="Deploy mLoot"
        code={async () => {
          const MLoot = new TemporalLoot__factory(signer);
          const mloot = await MLoot.deploy();
          return mloot.address;
        }}
      />
      <Action
        name="Deploy Genesis"
        code={async () => {
          const Genesis = new Genesis__factory(signer);
          const genesis = await Genesis.deploy();
          return genesis.address;
        }}
      />
      <Action
        name="Deploy Rings"
        code={async () => {
          const loots = [loot.address, mloot.address, genesis.address];
          console.log(loots);
          const Rings = new RingsForLoot__factory(signer);
          const rings = await Rings.deploy(loots);
          return rings.address;
        }}
      />
      <div className="row">
        <div>State: </div>
        {Object.keys(SaleState)
          .filter((key) => isNaN(Number(key)))
          .map((state: string) => (
            <div key={state}>
              <Action
                name={state}
                bold={SaleState[state] == saleState.data}
                code={async () => {
                  const tx = await rings!.setState(SaleState[state]);
                  await tx.wait();
                }}
              />
            </div>
          ))}
      </div>
      <Action
        name={`Set Whitelist to ${signerAddress.data}`}
        code={async () => {
          const tx = await rings!.setWhitelistSigningAddress(signerAddress.data!);
          await tx.wait();
        }}
      />
      <Action
        name={`Set Whitelist to NULL`}
        code={async () => {
          const tx = await rings!.setWhitelistSigningAddress('0x0000000000000000000000000000000000000000');
          await tx.wait();
        }}
      />
      <Action
        name={`Set IPFS to ${IPFS_HASH}`}
        code={async () => {
          const tx = await rings!.setIpfs(IPFS_HASH);
          await tx.wait();
        }}
      />
      <Action
        name="Deploy Sample"
        code={async () => {
          const factory = new Sample1155__factory(signer);
          const sample = await factory.deploy();
          return sample.address;
        }}
      />
      <style jsx>{`
        .row {
          display: flex;
        }
      `}</style>
    </div>
  );
}

function Action({name, bold, code}: {name: string; bold?: boolean; code: () => Promise<any>}) {
  const mutation = useMutation<any, Error>(code);
  return (
    <div>
      <button
        disabled={mutation.isLoading}
        onClick={() => mutation.mutate()}
        style={{fontWeight: bold ? 'bold' : 'normal'}}>
        {name}
      </button>{' '}
      <span>
        {mutation.isLoading ? 'Loading' : mutation.isError ? mutation.error.message : mutation.data?.toString() || ''}
      </span>
    </div>
  );
}
