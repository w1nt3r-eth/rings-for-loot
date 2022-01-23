import {useRouter} from 'next/dist/client/router';
import Link from 'next/link';
import Image, {ImageProps} from 'next/image';
import React, {HTMLAttributes, ReactNode, useContext, useEffect, useRef, useState} from 'react';
import SiteHeader from './SiteHeader';
import {useRingsReader, useRingsWriter} from '../hooks/contracts';
import {trpc} from '../hooks/trpc';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import extractErrorMessage from '../extractErrorMessage';
import {ItemLevel, ringLevelFromSupply, ringMaxSupply, SaleState} from '../loot';
import {formatEther} from '@ethersproject/units';
import {
  COMMON_RINGS_IDS,
  ringImageURL,
  RING_ID_TO_MAX_SUPPLY,
  RING_ID_TO_RING_NAME,
  RING_NAME_TO_RING_ID,
} from '../data';
import {BigNumber} from '@ethersproject/bignumber';
import {
  PRICE_FORGE_EPIC,
  PRICE_FORGE_LEGENDARY,
  PRICE_FORGE_MYTHIC,
  PRICE_RING_COMMON,
  PRICE_RING_EPIC,
  PRICE_RING_LEGENDARY,
  PRICE_RING_MYTHIC,
} from '../prices';
import {fetchBags} from '../bags';
import {RingsBalances, useRingBalances} from '../balances';
import useNow from '../hooks/useNow';
import {LAUNCH_DATE_2} from '../launch';
import Countdown from './Countdown';
import {useWalletProvider} from '../hooks/useWeb3';
import addresses from '../addresses';
import ga from '../ga';
import {OpenSeaIcon} from './icons';

const MOBILE_BREAKPOINT = 760;
const COMMON_RINGS_COUNT = COMMON_RINGS_IDS.reduce((acc, id) => acc + RING_ID_TO_MAX_SUPPLY[id], 0);

type SelectedSection = 'common' | 'mint' | 'forge';

type BagWithRing = {
  name: string;
  address: string;
  bagId: number;
  ringName: string;
  claimed: boolean;
};

type Message = {title: string; text: string};
type MintedRing = {id: number};
type ShowDialog = (params: Message | MintedRing) => void;
const DialogContext = React.createContext<ShowDialog>(() => {});

export default function Store({section}: {section: SelectedSection}) {
  const [dialog, showDialog] = useState<Message | MintedRing | null>(null);

  return (
    <>
      <main>
        <div className="img">
          <Image
            layout="fill"
            objectFit="cover"
            alt=""
            placeholder="blur"
            objectPosition={section == 'forge' ? 'center' : 'right'}
            src={
              section == 'forge'
                ? require('../../public/images/bg-forge.jpg')
                : require('../../public/images/bg-mint.jpg')
            }
          />
        </div>
        <div className="site">
          <SiteHeader title={section[0].toUpperCase() + section.slice(1)} />
          <DialogContext.Provider value={showDialog}>
            <Bouncer section={section} />
          </DialogContext.Provider>
        </div>
        <style jsx>{`
          main {
            width: 100vw;
            min-height: 100vh;
          }
          .site {
            width: 100vw;
            min-height: 100vh;
            position: relative;
            display: flex;
          }
          @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
            .site {
              flex-direction: column-reverse;
            }
          }
          .img {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
          }
          .collected-ring {
            border: 1px solid #817456;
          }
        `}</style>
      </main>
      {dialog && (
        <FullscreenModal fade onClickOutside={() => showDialog(null)}>
          {'title' in dialog ? (
            <ModalContent {...dialog} label="Dismiss" onClick={() => showDialog(null)} />
          ) : (
            <LargeRingModalContent id={dialog.id} />
          )}
        </FullscreenModal>
      )}
    </>
  );
}

function Bouncer({section}: {section: SelectedSection}) {
  const {address, chainId, connect} = useWalletProvider();
  const switchNetworks = () => {}; //  useSwitchNetworks(4); TODO

  if (!address) {
    return (
      <FullscreenModal>
        <ModalContent
          title="Rings Store"
          text={
            <>
              Knowledge, armor, weapons, gold
              <br />
              Spoils of war for brave and bold
              <br />
              Tales of legend, children sing
              <br />
              Need only find the rarest rings
              <br />
              Keep them safe, for not too long
              <br />
              Greater treasure may come along
              <br />
            </>
          }
          label="Connect Wallet"
          onClick={connect}
        />
      </FullscreenModal>
    );
  }

  if (!Object.keys(addresses.rings).includes(chainId.toString())) {
    return (
      <FullscreenModal>
        <ModalContent
          title="Rings Store"
          text={`The store is available on Ethereum Mainnet, but your wallet is connected to a different chain (id ${chainId}).`}
          label="Switch to Ethereum Mainnet"
          onClick={switchNetworks}
        />
      </FullscreenModal>
    );
  }

  return <Bouncer2 section={section} address={address} chainId={chainId} />;
}

function Bouncer2({section, address, chainId}: {section: SelectedSection; address: string; chainId: number}) {
  const router = useRouter();
  const rings = useRingsReader();
  const state = useQuery(['state', rings.address], () => rings.state());

  if (state.data === SaleState.Paused) {
    return (
      <FullscreenModal>
        <ModalContent
          title="Rings Store"
          text="The sale is paused, please check back later!"
          label="Return to the website"
          onClick={() => router.push('/')}
        />
      </FullscreenModal>
    );
  }

  return <Content section={section} address={address} chainId={chainId} saleState={state.data} />;
}

function FullscreenModal({
  fade,
  children,
  onClickOutside,
}: {
  fade?: boolean;
  children: ReactNode;
  onClickOutside?: () => void;
}) {
  const backgroundRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={backgroundRef}
      className="modal"
      onClick={(event) => onClickOutside && event.target === backgroundRef.current && onClickOutside()}>
      {children}
      <style jsx>{`
        .modal {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: ${fade ? 'rgba(0, 0, 0, 0.9)' : 'transparent'};
          pointer-events: ${fade ? 'auto' : 'none'};
        }
      `}</style>
    </div>
  );
}

function ModalContent({
  title,
  text,
  label,
  onClick,
}: {
  title: string;
  text?: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="box">
      <h1>{title}</h1>
      {text && <p>{text}</p>}
      <div>
        <YellowButton filled onClick={onClick}>
          {label}
        </YellowButton>
      </div>
      <style jsx>{`
        .box {
          max-width: 640px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        }
        h1 {
          font-family: 'EB Garamond';
          font-weight: normal;
          font-size: 40px;
          line-height: 56px;
          margin: 0px;
          padding: 0px;
        }
        p {
          text-align: center;
          font-size: 20px;
          line-height: 28px;
          margin: 4px 0px 24px;
        }
      `}</style>
    </div>
  );
}

function LargeRingModalContent({id}: {id: number}) {
  const {chainId} = useWalletProvider();
  const ringsAddress = useRingsReader().address;
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');

  return (
    <div className="box">
      <div className="collected-ring">
        <Image
          alt={RING_ID_TO_RING_NAME[id]}
          width={640}
          height={640}
          src={ringImageURL(id)}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
          priority
        />
        <div className={`placeholder ${state}`}>
          <Image
            alt="Loading"
            width={640}
            height={640}
            src={require('../../public/placeholder.jpg')}
            placeholder="blur"
          />
        </div>
        {state === 'loaded' && <div className="shine" />}
      </div>
      <p>
        {RING_ID_TO_RING_NAME[id]}{' '}
        <a
          href={`https://${chainId === 4 ? 'testnets.' : ''}opensea.io/assets/${ringsAddress}/${id}`}
          target="_blank"
          rel="noreferrer">
          <OpenSeaIcon size={14} />
        </a>
      </p>
      <style jsx>{`
        .box {
          max-width: 640px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .collected-ring {
          border: 1px solid #817456;
          margin: 16px;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }
        a {
          text-decoration: none;
          color: inherit;
        }
        @keyframes pulse {
          0% {
            filter: brightness(50%);
          }
          50% {
            filter: brightness(150%);
          }
          100% {
            filter: brightness(50%);
          }
        }
        .placeholder {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          transition: 0.5s opacity;
        }
        .loading {
          animation: pulse 2s ease-in-out infinite;
        }
        .loaded {
          opacity: 0;
        }
        @keyframes shine {
          10% {
            opacity: 0.3;
            top: -30%;
            left: -30%;
            transition-property: left, top, opacity;
            transition-duration: 0.7s, 0.7s, 0.15s;
            transition-timing-function: ease;
          }
          100% {
            opacity: 0;
            top: -30%;
            left: -30%;
            transition-property: left, top, opacity;
          }
        }
        .shine {
          animation: shine 10s ease-in-out;
          animation-delay: 0.5s;
          animation-fill-mode: forwards;
          position: absolute;
          top: -110%;
          left: -210%;
          width: 200%;
          height: 200%;
          opacity: 0;
          transform: rotate(30deg);

          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0) 77%,
            rgba(255, 255, 255, 0.5) 92%,
            rgba(255, 255, 255, 0) 100%
          );
        }
      `}</style>
    </div>
  );
}

function SaleNotice() {
  const router = useRouter();
  const now = useNow();
  const delta = LAUNCH_DATE_2 - now;

  return (
    <div className="container">
      <h1>Drop 2: December 7th</h1>
      <Countdown delta={delta} />

      <div>
        <YellowButton filled onClick={() => router.push('/common')}>
          Purchase Common Rings
        </YellowButton>
      </div>
      <style jsx>{`
        .container {
          margin: 48px 32px;
          max-width: 512px;
        }
        h1 {
          font-family: 'EB Garamond';
          font-weight: normal;
          font-size: 40px;
          line-height: 56px;
          margin: 0px;
          padding: 0px;
        }
        .container :global(p) {
          font-size: 20px;
          line-height: 28px;
          margin: 4px 0px 24px;
          text-align: left;
        }
      `}</style>
    </div>
  );
}

function WithEmptyState({title, text, children}: {title: string; text: string; children: React.ReactNode}) {
  if (React.Children.toArray(children).filter(Boolean).length > 0) {
    return children as any;
  }

  return (
    <div className="empty">
      <h1>{title}</h1>
      <p>{text}</p>
      <style jsx>{`
        .empty {
          margin: 24px 36px !important;
          max-width: 256px;
        }
        h1 {
          font-family: 'EB Garamond';
          font-weight: normal;
          font-weight: 600;
          font-size: 18px;
          line-height: 24px;
          margin: 0px;
          padding: 0px;
        }
        p {
          font-size: 14px;
          line-height: 20px;
          color: rgba(255, 255, 255, 0.7);
          margin: 4px 0px 24px;
        }
      `}</style>
    </div>
  );
}

function Content({
  section,
  address,
  chainId,
  saleState,
}: {
  section: SelectedSection;
  address: string;
  chainId: number;
  saleState?: SaleState;
}) {
  const ringsReader = useRingsReader();

  const signature = trpc.useQuery(['whitelist.signature', {address, chainId, contractAddress: ringsReader.address}]);
  const bagsWithRings = useQuery(['bags', {address, chainId}], () => fetchBags(address, chainId, ringsReader));
  const ringsBalances = useRingBalances({address, chainId});

  const commonUnclaimed = (bagsWithRings.data || []).filter(
    (b) => !b.claimed && COMMON_RINGS_IDS.includes(RING_NAME_TO_RING_ID[b.ringName]),
  ).length;
  const rareUnclaimed = (bagsWithRings.data || []).filter(
    (b) => !b.claimed && !COMMON_RINGS_IDS.includes(RING_NAME_TO_RING_ID[b.ringName]),
  ).length;
  const forgeColors = ringsBalances.data ? COMMON_RINGS_IDS.filter((id) => ringsBalances.data[id] > 0).length : 0;

  return (
    <>
      <YourRingsSection chainId={chainId} ringsAddress={ringsReader.address} ringsBalances={ringsBalances.data} />
      <MintingRingsSection
        section={section}
        saleState={saleState}
        badges={{common: commonUnclaimed, mint: rareUnclaimed, forge: forgeColors}}>
        {section == 'common' && bagsWithRings.data && (
          <CommonCards bagsWithRings={bagsWithRings.data} signature={signature.data} />
        )}
        {section == 'mint' && bagsWithRings.data && (
          <MintingCards bagsWithRings={bagsWithRings.data} signature={signature.data} saleState={saleState} />
        )}
        {section == 'forge' && ringsBalances.data && (
          <ForgingCards ringsBalances={ringsBalances.data} saleState={saleState} />
        )}
      </MintingRingsSection>
    </>
  );
}

function Title({selected, badge, children}: {children: any; badge?: number; selected?: boolean}) {
  return (
    <h2>
      {children}
      {badge ? `\u00A0(${badge})` : ''}
      <style jsx>{`
        h2 {
          font-size: 28px;
          font-family: 'EB Garamond';
          font-weight: normal;
          margin: 0px;
          padding: 0px;
          text-decoration: ${selected ? 'underline' : 'none'};
          color: ${selected ? '#E5BF72' : 'inherit'};
        }
      `}</style>
    </h2>
  );
}

function YourRingsSection({
  chainId,
  ringsAddress,
  ringsBalances,
}: {
  chainId: number;
  ringsAddress: string;
  ringsBalances?: RingsBalances;
}) {
  const showDialog = useContext(DialogContext);

  function ringNameWithBalance(id: string, balance: number) {
    const name = RING_ID_TO_RING_NAME[id];
    if (balance > 1) {
      return balance + ' ' + name.replace('Ring', 'Rings');
    }
    return name;
  }

  const list =
    ringsBalances &&
    Object.keys(ringsBalances)
      .filter((id) => ringsBalances[id] > 0)
      .sort(compareRings)
      .map((id) => (
        <RingItem
          key={id}
          title={ringNameWithBalance(id, ringsBalances![id])}
          subtitle={capitalize(ringLevelFromSupply(ringMaxSupply(Number(id))))}
          image={ringImageURL(Number(id))}
          href={`https://${chainId === 4 ? 'testnets.' : ''}opensea.io/assets/${ringsAddress}/${id}`}
          onClick={() => showDialog({id: Number(id)})}
        />
      ));

  return (
    <section>
      <Title>Your Rings</Title>
      <div>
        {list && list.length > 0 ? (
          <WithSeparator>{list}</WithSeparator>
        ) : (
          <p>When you mint or forge rings, they will appear here.</p>
        )}
      </div>
      <Title>Info</Title>
      <div className="subsection">
        <h3>Mint</h3>
        <p>
          If you own Loot, mLoot, or a Genesis Adventurer, you can mint any Ring that matches your Loot bag or
          Adventurer.
        </p>
      </div>
      <div className="subsection">
        <h3>Forge</h3>
        <p>
          Upgrade your Common Rings with a Blacksmith in exchange for rare Rings. The Blacksmith will forge a randomized
          Epic, Legendary, or Mythic Ring of the same color.
        </p>
        <p>Forging requires Common Rings to be the same color and burns the used Common Rings.</p>
      </div>
      <style jsx>{`
        section {
          display: flex;
          flex-direction: column;
          padding 92px 32px;
          width: 320px;
          background-color: rgba(0, 0, 0, 0.4);
          min-height: 100vh;
        }
        @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
          section {
            width: 100%;
            min-height: initial;
          }
        }
        section > :global(*):not(:last-child) {
          margin-top: 0px;
          margin-bottom: 32px;
        }
        .subsection {
          display: flex;
          flex-direction: column;
        }
        h3 {
          font-family: 'EB Garamond';
          font-weight: 600;
          font-size: 18px;
          line-height: 24px;
          margin: 0px;
          padding: 0px;
        }
        p {
          font-size: 14px;
          line-height: 20px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0px;
        }
      `}</style>
    </section>
  );
}

function YellowButton({filled, ...props}: HTMLAttributes<HTMLButtonElement> & {filled?: boolean; disabled?: boolean}) {
  return (
    <>
      <button {...props} />
      <style jsx>{`
        button {
          align-self: stretch;
          cursor: pointer;
          font-family: serif;
          font-size: 16px;
          line-height: 22px;
          color: ${filled ? 'white' : '#e5bf72'};
          background: ${filled ? '#736039' : '#0f0f0f'};
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-sizing: border-box;
          border-radius: 4px;
          height: 32px;
          padding: 0px 16px;
        }
        button:active {
          background-color: ${filled ? '#e5bf72' : '#0f0f0f'};
          border-color: #e5bf72;
        }
        button:disabled {
          filter: grayscale(100%) brightness(50%);
          cursor: auto;
        }
      `}</style>
    </>
  );
}

function RingItem({
  title,
  subtitle,
  image,
  href,
  onClick,
}: {
  title: string;
  subtitle: string;
  image: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <div className="container">
      <div className="image">
        <ImageWithFallback alt={title} width={48} height={48} src={image} />
      </div>
      <div className="details">
        <a
          onClick={(e) => {
            if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
              e.preventDefault();
              onClick();
            }
          }}
          href={href}
          target="_blank"
          rel="noreferrer">
          <div className="title">{title}</div>
        </a>
        <div className="subtitle">{subtitle}</div>
      </div>
      <style jsx>{`
        .container {
          display: flex;
          padding: 12px 0px;
        }
        .image {
          width: 48px;
          height: 48px;
          margin-right: 12px;
          background-color: black;
          border-radius: 4px;
          overflow: hidden;
        }
        .details {
          display: flex;
          flex: 1;
          flex-direction: column;
          justify-content: center;
        }
        .title {
          font-size: 16px;
          line-height: 22px;
        }
        .subtitle {
          font-size: 14px;
          line-height: 20px;
          color: rgba(255, 255, 255, 0.7);
        }
        a {
          text-decoration: none;
          color: inherit;
        }
        a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

function WithSeparator({children}: {children: React.ReactNode}) {
  return React.Children.toArray(children).flatMap((item, index) =>
    index > 0 ? [<RingItemSeparator key={'sep' + index} />, item] : [item],
  ) as any;
}

function RingItemSeparator() {
  return (
    <div>
      <style jsx>{`
        div {
          height: 1px;
          background: rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
}

function ImageWithFallback(props: ImageProps) {
  const [hasFailed, setFailed] = useState(false);

  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} src={hasFailed ? '/placeholder.jpg' : props.src} onError={() => setFailed(true)} />;
}

function MintingRingsSection({
  section,
  children,
  saleState,
  badges,
}: {
  section: SelectedSection;
  children: React.ReactNode;
  saleState?: SaleState;
  badges: {[key: string]: number};
}) {
  const disabled = saleState == SaleState.OnlyCommon && section !== 'common';

  return (
    <section>
      <div className="toggle">
        <Link href="/common">
          <a>
            <Title badge={badges.common} selected={section == 'common'}>
              Common
            </Title>
          </a>
        </Link>
        <Link href="/rare">
          <a>
            <Title badge={badges.mint} selected={section == 'mint'}>
              Rare
            </Title>
          </a>
        </Link>
        <Link href="/forge">
          <a>
            <Title badge={badges.forge} selected={section == 'forge'}>
              Forge
            </Title>
          </a>
        </Link>
      </div>
      {disabled && <SaleNotice />}
      <div className={`content ${disabled ? 'disabled' : ''}`}>{children}</div>
      <style jsx>{`
        section {
          display: flex;
          flex-direction: column;
          padding 92px 32px;
          flex: 1;
        }
        @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
          section {
            padding: 168px 20px;
          }
        }
        .toggle {
          display: flex;
          padding: 0px 32px;
        }
        .toggle > :global(*):not(:last-child) {
          margin-right: 24px;
        }
        .toggle a {
          text-decoration: none;
          color: white;
        }
        .content {
          display: flex;
          flex-wrap: wrap;
        }
        .disabled {
          filter: grayscale(100%);
        }
        .disabled :global(img) {
          filter: blur(4px) brightness(50%);
        }
        .content > :global(*) {
          margin: 16px;
        }
      `}</style>
    </section>
  );
}

function CommonCards({bagsWithRings, signature}: {bagsWithRings: BagWithRing[]; signature?: string | null}) {
  return (
    <>
      <PurchaseCommonCard signature={signature} />
      {bagsWithRings
        .filter((bag) => COMMON_RINGS_IDS.includes(RING_NAME_TO_RING_ID[bag.ringName]))
        .map((bag) => (
          <MintingCard key={bag.address + bag.bagId} {...bag} signature={signature} />
        ))}
    </>
  );
}

function PurchaseCommonCard({signature}: {signature?: string | null}) {
  const rings = useRingsReader();
  const ringsWriter = useRingsWriter();
  const client = useQueryClient();
  const showDialog = useContext(DialogContext);

  const minted = useQuery(['minted', rings.address], async () => {
    const batch = await rings.mintedBatched(COMMON_RINGS_IDS);
    return batch.reduce((acc, value) => acc.add(value)).toNumber();
  });

  const [amount, setAmount] = useState(1);

  const value = signature && amount === 1 ? BigNumber.from(0) : PRICE_RING_COMMON.mul(amount);

  const purchasing = useMutation<void, Error, number>(
    async (amount: number) => {
      const whitelist = (amount == 1 && signature) || [];
      // add 25-33% gas limit because contract uses "randomness" and the gas estimate might be incorrect
      const gas = await ringsWriter!.estimateGas.purchaseCommon(amount, whitelist, {value});
      const gasLimit = amount == 1 ? gas.add(gas.div(3)) : gas.add(gas.div(2));
      const tx = await ringsWriter!.purchaseCommon(amount, whitelist, {value, gasLimit});
      const receipt = await tx.wait();

      if (amount === 1 && receipt.events) {
        for (const event of receipt.events) {
          if (!event.args) {
            continue;
          }

          const {from, id} = event.args;

          if (id && from === '0x0000000000000000000000000000000000000000') {
            showDialog({id: id.toNumber()});
            return;
          }
        }
      }
    },
    {
      onMutate: () => {
        ga.sendEvent({eventCategory: 'Store', eventAction: 'Purchase Common', eventValue: amount});
      },
      onSuccess: () => {
        client.invalidateQueries('minted');
        client.invalidateQueries('signature');
      },
      onError: (error) => {
        showDialog({title: 'Something went wrong…', text: extractErrorMessage(error)});
      },
    },
  );

  let label: string;
  let disabled = true;

  if (purchasing.isLoading) {
    label = 'Purchasing…';
  } else if (COMMON_RINGS_COUNT === minted.data) {
    label = 'Sold Out';
  } else {
    label = amount == 1 ? 'Mint Ring' : `Mint ${amount} Rings for ${formatEther(value)} ETH`;
    disabled = false;
  }

  return (
    <Card
      title="Random Common Ring"
      subtitle={
        minted.isSuccess
          ? `${formatCount(COMMON_RINGS_COUNT - minted.data)}/${formatCount(COMMON_RINGS_COUNT)} available`
          : `${formatCount(COMMON_RINGS_COUNT)} common rings`
      }
      price={value.eq(0) ? 'Free (only pay for gas)' : formatEther(PRICE_RING_COMMON) + ' ETH'}
      image="/images/rings-stacked.jpg"
      label={label}
      filled
      disabled={disabled}
      onClick={() => purchasing.mutate(amount)}>
      <UpDown amount={amount} onChange={setAmount} />
    </Card>
  );
}

function MintingCards({
  bagsWithRings,
  signature,
  saleState,
}: {
  bagsWithRings: BagWithRing[];
  signature?: string | null;
  saleState?: SaleState;
}) {
  return (
    <WithEmptyState
      title="No Loot bags found"
      text="You can mint a matching ring if you have Loot, mLoot, or a Genesis Adventurer.">
      {bagsWithRings
        .filter((bag) => !COMMON_RINGS_IDS.includes(RING_NAME_TO_RING_ID[bag.ringName]))
        .map((bag) => (
          <MintingCard
            key={bag.address + bag.bagId}
            {...bag}
            signature={signature}
            comingSoon={saleState == SaleState.OnlyCommon || saleState == SaleState.Paused}
          />
        ))}
    </WithEmptyState>
  );
}

function MintingCard({
  name,
  address,
  bagId,
  ringName,
  signature,
  comingSoon,
}: {
  name: string;
  address: string;
  bagId: number;
  ringName: string;
  signature?: string | null;
  comingSoon?: boolean;
}) {
  const ringsWriter = useRingsWriter();
  const client = useQueryClient();
  const showDialog = useContext(DialogContext);

  const ringId: number | undefined = RING_NAME_TO_RING_ID[ringName];
  const value =
    ringId === undefined || signature
      ? BigNumber.from(0)
      : RING_ID_TO_MAX_SUPPLY[ringId] === 1
      ? PRICE_RING_MYTHIC
      : RING_ID_TO_MAX_SUPPLY[ringId] === 2
      ? PRICE_RING_LEGENDARY
      : RING_ID_TO_MAX_SUPPLY[ringId] < 1000
      ? PRICE_RING_EPIC
      : PRICE_RING_COMMON;

  const queryKey = ['bag', bagId, address, ringsWriter?.address];
  const info = useQuery(queryKey, async () => {
    const claimed = await ringsWriter!.bagClaimed(address, bagId);
    const minted = await ringsWriter!.mintedBatched([ringId]);
    const maxSupply = RING_ID_TO_MAX_SUPPLY[ringId];
    return {
      claimed,
      remaining: maxSupply - minted[0].toNumber(),
    };
  });

  const minting = useMutation<void, Error>(
    async () => {
      // add 33% gas limit because contract uses "randomness" and the gas estimate might be incorrect
      const gas = await ringsWriter!.estimateGas.purchaseMatching(address, bagId, ringId, signature || [], {value});
      const gasLimit = gas.add(gas.div(3));
      const tx = await ringsWriter!.purchaseMatching(address, bagId, ringId, signature || [], {value, gasLimit});
      const receipt = await tx.wait();
      if (receipt.events) {
        for (const event of receipt.events) {
          if (!event.args) {
            continue;
          }

          const {from, id} = event.args;

          if (id && from === '0x0000000000000000000000000000000000000000') {
            showDialog({id: id.toNumber()});
            return;
          }
        }
      }
    },
    {
      onMutate: () => {
        ga.sendEvent({eventCategory: 'Store', eventAction: 'Purchase Matching', eventLabel: address});
      },
      onSuccess: () => {
        client.setQueryData(queryKey, (old: typeof info.data) => ({
          claimed: true,
          remaining: old ? old.remaining - 1 : 0,
        }));
        client.invalidateQueries(['bag', bagId]);
        client.invalidateQueries('bags');

        client.setQueryData(['whitelist.signature'], () => null);
      },
      onError: (error) => {
        showDialog({title: 'Something went wrong…', text: extractErrorMessage(error)});
      },
    },
  );

  let label: string;
  let disabled = true;

  if (comingSoon) {
    label = 'Coming Soon';
  } else if (minting.isLoading) {
    label = 'Purchasing…';
  } else if (!ringId) {
    label = 'Not Available';
  } else if (info.isLoading) {
    label = 'Loading…';
  } else if (info.data?.claimed) {
    label = 'Purchased';
  } else if (info.data?.remaining === 0) {
    label = 'Sold Out';
  } else {
    label = 'Mint Ring';
    disabled = false;
  }

  return (
    <Card
      title={ringName}
      subtitle={`From ${name} #${bagId}`}
      price={
        ringId === undefined
          ? 'Not from original 8,000 Loot bags'
          : value.eq(0)
          ? 'Free (only pay for gas)'
          : formatEther(value) + ' ETH'
      }
      image={ringImageURL(RING_NAME_TO_RING_ID[ringName])}
      label={label}
      filled
      disabled={disabled}
      onClick={() => minting.mutate()}
    />
  );
}

function ForgingCards({ringsBalances, saleState}: {ringsBalances: RingsBalances; saleState?: SaleState}) {
  // Sort by balance so the most rings we have are at the top
  return (
    <WithEmptyState
      title="Purchase common rings to forge"
      text="You can turn your common rings into epic, legendary or mythic rings using Blacksmith.">
      {ringsBalances &&
        COMMON_RINGS_IDS.slice()
          .sort((ring1, ring2) => ringsBalances[ring2] - ringsBalances[ring1])
          .map(
            (ringId) =>
              ringsBalances[ringId] > 0 && (
                <ForgingGroup
                  key={ringId}
                  material={COMMON_RINGS_IDS.indexOf(ringId)}
                  balance={ringsBalances[ringId]}
                  comingSoon={saleState == SaleState.OnlyCommon || saleState == SaleState.Paused}
                />
              ),
          )}
    </WithEmptyState>
  );
}

const FORGING_IMAGES = [
  [
    require('../../public/images/forging/Gold Rings 2.jpg'),
    require('../../public/images/forging/Gold Rings 3.jpg'),
    require('../../public/images/forging/Gold Rings 4.jpg'),
  ],
  [
    require('../../public/images/forging/Silver Rings 2.jpg'),
    require('../../public/images/forging/Silver Rings 3.jpg'),
    require('../../public/images/forging/Silver Rings 4.jpg'),
  ],
  [
    require('../../public/images/forging/Bronze Rings 2.jpg'),
    require('../../public/images/forging/Bronze Rings 3.jpg'),
    require('../../public/images/forging/Bronze Rings 4.jpg'),
  ],
  [
    require('../../public/images/forging/Platinum Rings 2.jpg'),
    require('../../public/images/forging/Platinum Rings 3.jpg'),
    require('../../public/images/forging/Platinum Rings 4.jpg'),
  ],
  [
    require('../../public/images/forging/Titanium Rings 2.jpg'),
    require('../../public/images/forging/Titanium Rings 3.jpg'),
    require('../../public/images/forging/Titanium Rings 4.jpg'),
  ],
];

function ForgingGroup({material, balance, comingSoon}: {material: number; balance: number; comingSoon: boolean}) {
  return (
    <>
      <ForgingCard
        level={ItemLevel.Epic}
        material={material}
        balance={balance}
        needs={2}
        fee={PRICE_FORGE_EPIC}
        comingSoon={comingSoon}
      />
      <ForgingCard
        level={ItemLevel.Legendary}
        material={material}
        balance={balance}
        needs={3}
        fee={PRICE_FORGE_LEGENDARY}
        comingSoon={comingSoon}
      />
      <ForgingCard
        level={ItemLevel.Mythic}
        material={material}
        balance={balance}
        needs={4}
        fee={PRICE_FORGE_MYTHIC}
        comingSoon={comingSoon}
      />
    </>
  );
}

function ForgingCard({
  level,
  material,
  balance,
  needs,
  fee,
  comingSoon,
}: {
  level: ItemLevel.Epic | ItemLevel.Legendary | ItemLevel.Mythic;
  material: number;
  balance: number;
  needs: number;
  fee: BigNumber;
  comingSoon: boolean;
}) {
  const ringsWriter = useRingsWriter();
  const client = useQueryClient();
  const router = useRouter();
  const showDialog = useContext(DialogContext);

  const forging = useMutation<void, Error>(
    async () => {
      // add 33% gas limit because contract uses "randomness" and the gas estimate might be incorrect
      const gas = await ringsWriter!.estimateGas.forge(material, needs, {value: fee});
      const gasLimit = gas.add(gas.div(3));
      const tx = await ringsWriter!.forge(material, needs, {value: fee, gasLimit});
      const receipt = await tx.wait();
      if (receipt.events) {
        for (const event of receipt.events) {
          if (!event.args) {
            continue;
          }

          const {from, id} = event.args;

          if (id && from === '0x0000000000000000000000000000000000000000') {
            showDialog({id: id.toNumber()});
            return;
          }
        }
      }
    },
    {
      onMutate: () => {
        ga.sendEvent({eventCategory: 'Store', eventAction: 'Forge', eventValue: needs});
      },
      onSuccess: () => {
        client.invalidateQueries('balances');
      },
      onError: (error) => {
        showDialog({title: 'Something went wrong…', text: extractErrorMessage(error)});
      },
    },
  );

  const props =
    balance < needs
      ? {
          subtitle: `Requires +${needs - balance} Common Ring${needs - balance > 1 ? 's' : ''}`,
          label: 'Acquire More Rings',
          filled: false,
          onClick: () => router.push('/common'),
        }
      : {
          subtitle: `${needs} Common Rings`,
          label: forging.isLoading ? 'Forging…' : `Forge ${capitalize(level)} Ring`,
          filled: true,
          disabled: forging.isLoading,
          onClick: () => forging.mutate(),
        };

  if (comingSoon) {
    props.label = 'Coming Soon';
    props.disabled = true;
    props.filled = true;
  }

  return (
    <Card
      title={RING_ID_TO_RING_NAME[COMMON_RINGS_IDS[material]].split(' ').join(' ' + capitalize(level) + ' ')}
      price={`${formatEther(fee)} ETH Blacksmith Fee`}
      image={FORGING_IMAGES[material][needs - 2] || ringImageURL(COMMON_RINGS_IDS[material])}
      {...props}
    />
  );
}

function Card({
  title,
  subtitle,
  price,
  image,
  label,
  filled,
  disabled,
  onClick,
  children,
}: {
  title: string;
  subtitle: string;
  price: string;
  image: string;
  label: string;
  filled?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="image">
        <ImageWithFallback alt={title} width={288} height={288} src={image} />
      </div>
      <div className="details">
        <p className="title">{title}</p>
        <p className="subtitle">{subtitle}</p>
        <p className="subtitle">{price}</p>
      </div>
      <div className="spacer" />
      {children}
      <YellowButton filled={filled} disabled={disabled} onClick={onClick}>
        {label}
      </YellowButton>
      <style jsx>{`
        .card {
          width: 320px;
          max-width: 320px;
          padding: 16px;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
        }
        .card > :global(*):not(:last-child) {
          margin-bottom: 8px;
        }
        .image {
          background: black;
          aspect-ratio: 1;
          border-radius: 4px;
          overflow: hidden;
        }
        .details p {
          margin: 0px;
        }
        .title {
          font-size: 18px;
          line-height: 24px;
        }
        .subtitle {
          font-size: 16px;
          line-height: 22px;
          opacity: 0.5;
        }
        .spacer {
          flex: 1;
          margin-bottom: 0px !important;
        }
      `}</style>
    </div>
  );
}

function UpDown({amount, onChange}: {amount: number; onChange: (value: number) => void}) {
  const MAX = 20;
  const [text, setText] = useState(amount.toString());

  useEffect(() => {
    setText(amount.toString());
  }, [amount]);

  function handleInput() {
    let newAmount = Number(text);
    if (!newAmount) {
      setText(amount.toString());
      return;
    }

    newAmount = Math.min(MAX, Math.max(1, newAmount));
    onChange(newAmount);
    setText(newAmount.toString());
  }

  return (
    <div className="container">
      <button disabled={amount <= 1} onClick={() => onChange(Math.max(1, amount - 1))}>
        –
      </button>
      <input
        type="text"
        value={text}
        onKeyPress={(e) => e.key === 'Enter' && handleInput()}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleInput}
      />
      <button disabled={amount >= MAX} onClick={() => onChange(Math.min(MAX, amount + 1))}>
        +
      </button>
      <style jsx>{`
        .container {
          display: flex;
        }
        button,
        input {
          background-color: #303033;
          border: none;
          color: white;
          font-size: 20px;
          font-family: 'Times New Roman';
          border-radius: 4px;
        }
        button {
          width: 32px;
          height: 32px;
        }
        button:active {
          background-color: #505055;
        }
        button:disabled {
          color: #666;
        }
        input {
          text-align: center;
          height: 32px;
          margin: 0px 4px;
          flex: 1;
        }
      `}</style>
    </div>
  );
}

function capitalize(s?: string) {
  return (s && s[0].toUpperCase() + s.slice(1)) || '';
}

function formatCount(count: number | null | undefined) {
  if (typeof count === 'number' && !isNaN(count)) {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return '…';
}

function compareRings(id1: string, id2: string) {
  const ring1Index = COMMON_RINGS_IDS.indexOf(Number(id1));
  const ring2Index = COMMON_RINGS_IDS.indexOf(Number(id2));

  if (ring1Index > -1 && ring2Index > -1) {
    return ring1Index - ring2Index;
  }

  if (ring1Index > -1) {
    return -1;
  }

  if (ring2Index > -1) {
    return 1;
  }

  return RING_ID_TO_MAX_SUPPLY[id2] - RING_ID_TO_MAX_SUPPLY[id1];
}
