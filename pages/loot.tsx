/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import {useMutation} from 'react-query';
import extractErrorMessage from '../src/extractErrorMessage';
import {useGenesisWriter, useLootWriter, useMLootWriter} from '../src/hooks/contracts';
import {useWalletProvider} from '../src/hooks/useWeb3';

export default function Loot() {
  return (
    <main>
      <Bouncer />
      <style jsx global>{`
        h1,
        h2,
        h3 {
          font-weight: normal;
        }
      `}</style>
      <style jsx>{`
        main {
          max-width: 720px;
          padding: 20px;
          margin: 100px auto;
        }
      `}</style>
    </main>
  );
}

function Bouncer() {
  const {address, chainId, connect, provider} = useWalletProvider();

  if (!address) {
    return <button onClick={connect}>Connect your wallet</button>;
  }

  return <Minter address={address} />;
}

function Minter({address}: {address: string}) {
  const lootWriter = useLootWriter();
  const mLootWriter = useMLootWriter();
  const genesisWriter = useGenesisWriter();

  const claimingLoot = useMutation<any, Error, string>(async (id: string) => {
    const tx = await lootWriter!.claim(id);
    await tx.wait();
  });
  const claimingMLoot = useMutation<any, Error, string>(async (id: string) => {
    const tx = await mLootWriter!.claim(id);
    await tx.wait();
  });
  const claimingGenesis = useMutation<any, Error, string>(async (ring: string) => {
    const tx = await genesisWriter!.mintRing(ring);
    await tx.wait();
  });

  return (
    <div>
      <form
        onSubmit={(e: any) => {
          e.preventDefault();
          claimingLoot.mutate(e.target.id.value);
        }}>
        <h1>Loot (for Testing)</h1>
        <p>The original 8,000 OG Loot bags on the Rinkeby testnet.</p>
        <fieldset disabled={claimingLoot.isLoading}>
          <legend>Claim your Loot bag for testing</legend>
          <input type="text" placeholder="Enter Bag ID" name="id" />
          <button type="submit">Claim</button>
        </fieldset>
        <div className="error">{extractErrorMessage(claimingLoot.error)}&nbsp;</div>
      </form>
      <form
        onSubmit={(e: any) => {
          e.preventDefault();
          claimingMLoot.mutate(e.target.id.value);
        }}>
        <h1>mLoot (for Testing)</h1>
        <p>Same as Loot but more. Claim bags 8001 and above.</p>
        <fieldset disabled={claimingMLoot.isLoading}>
          <legend>Claim your mLoot bag for testing</legend>
          <input type="text" placeholder="8001 or more" name="id" />
          <button type="submit">Claim</button>
        </fieldset>
        <div className="error">{extractErrorMessage(claimingMLoot.error)}&nbsp;</div>
      </form>
      <form
        onSubmit={(e: any) => {
          e.preventDefault();
          claimingGenesis.mutate(e.target.id.value);
        }}>
        <h1>Genesis Advanturer (for Testing)</h1>
        <p>A simple contract to emulate GA.</p>
        <fieldset disabled={claimingGenesis.isLoading}>
          <legend>Claim your GA for testing</legend>
          <input type="text" placeholder="Enter Ring Name" name="id" />
          <button type="submit">Mint</button>
        </fieldset>
        <div className="error">{extractErrorMessage(claimingGenesis.error)}&nbsp;</div>
      </form>
      <style jsx>{`
        .bags {
          display: flex;
          flex-wrap: wrap;
        }
        fieldset {
          display: inline-block;
        }
        h2 {
          margin-top: 50px;
        }
        .error {
          color: pink;
        }
      `}</style>
    </div>
  );
}
