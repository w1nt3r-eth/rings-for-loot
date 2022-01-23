import Image from 'next/image';
import Link from 'next/link';
import type {NextPage} from 'next';
import SiteHeader from '../src/components/SiteHeader';
import {useRouter} from 'next/dist/client/router';
import {LAUNCH_DATE_1, LAUNCH_DATE_2} from '../src/launch';
import useNow from '../src/hooks/useNow';
import Countdown from '../src/components/Countdown';
import {formatEther} from '@ethersproject/units';
import {PRICE_RING_COMMON, PRICE_RING_EPIC, PRICE_RING_LEGENDARY, PRICE_RING_MYTHIC} from '../src/prices';

const Home2: NextPage = () => {
  const router = useRouter();

  const now = useNow();
  const delta1 = router.query.live == 'now' ? 0 : LAUNCH_DATE_1 - now;
  const delta2 = LAUNCH_DATE_2 - now;

  return (
    <main>
      <SiteHeader />
      <div className="hero">
        <Image
          priority
          className="hero-bg"
          alt="Rare Rings + Forge"
          placeholder="blur"
          layout="fill"
          objectFit="cover"
          src={require('../public/images/forging-wide.jpg')}
        />
        <h1>Drop 2: Rare&nbsp;Rings + Forge</h1>
        <Countdown delta={delta2} />
        {delta2 <= 0 && (
          <Link href="/rare">
            <a className="mint-link">Mint Rare Rings</a>
          </Link>
        )}
      </div>
      <div className="hero">
        <Image
          priority
          className="hero-bg"
          alt="Common Rings"
          placeholder="blur"
          layout="fill"
          objectFit="contain"
          src={require('../public/images/rings-stacked.jpg')}
        />
        <h1>Drop 1: Common&nbsp;Rings</h1>
        <Countdown delta={delta1} />
        {delta1 <= 0 && (
          <Link href="/common">
            <a className="mint-link">Mint Common Rings</a>
          </Link>
        )}
      </div>
      <section className="rings mobile-reverse">
        <div className="image-sm">
          <Image
            priority
            alt="Silver Ring of Enlightenment"
            placeholder="blur"
            layout="fill"
            objectFit="cover"
            src={require('../public/images/ringEnlightenment.png')}
          />
        </div>
        <div className="content">
          <h1>
            8,000&nbsp;Rings.
            <br />
            1&nbsp;for&nbsp;each&nbsp;Loot&nbsp;bag.
          </h1>
          <p>
            Rings (for Loot) is the first and largest 3D interpretation of an entire category in Loot. Adventurers,
            builders, and artists are encouraged to reference Rings (for Loot) to further expand on the imagination of
            Loot.
          </p>
        </div>
      </section>

      <section className="rarity">
        <div className="content">
          <h2>4&nbsp;rarity&nbsp;levels</h2>
          <p>Common</p>
          <p>Epic</p>
          <p>Legendary</p>
          <p>Mythic</p>
        </div>
        <div className="image-xl">
          <Image
            alt="Bronze Ring of Protection"
            placeholder="blur"
            layout="fill"
            objectFit="cover"
            src={require('../public/images/ringProtection.png')}
          />
        </div>
      </section>

      <section className="loot mobile-reverse">
        <div className="image-xl">
          <Image
            alt="Platinum Ring of Rage"
            placeholder="blur"
            layout="fill"
            objectFit="cover"
            src={require('../public/images/ringRage.png')}
          />
        </div>
        <div className="content">
          <div className="owners">
            <h2>Loot,&nbsp;mLoot,&nbsp;&amp; Genesis&nbsp;Adventurer Owners</h2>
            <p>
              If you own Loot, mLoot, or a Genesis Adventurer, you can buy any Ring that matches your Loot bag or
              Adventurer.
            </p>
            <p>Rings in mLoot bags are eligible when they match a Ring in the original 8,000 Loot bags.</p>
          </div>

          <div className="everyone">
            <h2>Non&nbsp;Loot&nbsp;Owners</h2>
            <p>
              If you don’t own Loot, you can buy Common Rings and choose to forge them with a Blacksmith in exchange for
              a randomized Epic, Legendary, or Mythic Ring of the same color.
            </p>
            <p>&nbsp;</p>
            <p>Forging requires Common Rings to be the same color and burns the used Common Rings.</p>
          </div>
        </div>
      </section>

      <section className="forging">
        <div className="content">
          <h2>Forging</h2>
          <p>
            Owners of Common Rings can upgrade their Rings with a Blacksmith. In exchange, the Blacksmith will forge a
            randomized Epic, Legendary, or Mythic Ring of the same color.
          </p>
          <p className="topSpacer">
            Forging requires Common Rings to be the same color and burns the used Common Rings.
          </p>
          <p>&nbsp;</p>
          <h4>Epic Ring</h4>
          <p>2 Common Rings of the same color</p>
          <p>Epic Blacksmith fee: 0.02&nbsp;ETH</p>
          <p>&nbsp;</p>
          <h4>Legendary Ring</h4>
          <p>3 Common Rings of the same color</p>
          <p>Legendary Blacksmith fee: 0.04&nbsp;ETH</p>
          <p>&nbsp;</p>
          <h4>Mythic Ring</h4>
          <p>4 Common Rings of the same color</p>
          <p>Mythic Blacksmith fee: 0.06&nbsp;ETH</p>
        </div>
        <div className="image-xl">
          <Image
            alt="Forging"
            placeholder="blur"
            layout="fill"
            objectFit="cover"
            src={require('../public/images/forging.png')}
          />
        </div>
      </section>

      <section className="timeline mobile-reverse">
        <div className="image-xl">
          <Image
            alt="Titanium Ring of the Fox"
            placeholder="blur"
            layout="fill"
            objectFit="cover"
            src={require('../public/images/ringFox.png')}
          />
        </div>
        <div className="content">
          <h2>Timeline</h2>
          <p>
            Drop 1 contains Common Rings only, enabling the community to prepare for minting and forging Epic,
            Legendary, and Mythic Rings in Drop 2.
          </p>
          <p>&nbsp;</p>
          <h4>Drop 1</h4>
          <p>
            November 30<sup>th</sup> at 1<span className="small-caps">PM</span> EST
          </p>
          <p>Common Rings</p>
          <p>&nbsp;</p>
          <h4>Drop 2</h4>
          <p>
            December 7<sup>th</sup> at 1<span className="small-caps">PM</span> EST
          </p>
          <p>Epic, Legendary, and Mythic Rings + Forging</p>
          <p>&nbsp;</p>
          <p>
            <a className="twitter-link" href="https://twitter.com/RingsforLoot">
              Follow on Twitter for updates »
            </a>
          </p>
        </div>
      </section>

      <section className="supply">
        <h1>Pricing & Supply</h1>
        <p className="center">Ring supply is fixed and is first come first serve.</p>
        <div className="ringOptions">
          <div className="ringOption">
            <div className="ringImage">
              <Image alt="Common Ring" placeholder="blur" src={require('../public/images/example/Common.png')} />
            </div>
            <h4>Common Ring</h4>
            <p>{formatEther(PRICE_RING_COMMON)}&nbsp;ETH</p>
            <p>5,712 total</p>
          </div>
          <div className="ringOption">
            <div className="ringImage">
              <Image alt="Epic Ring" placeholder="blur" src={require('../public/images/example/Epic.png')} />
            </div>
            <h4>Epic Ring</h4>
            <p>{formatEther(PRICE_RING_EPIC)}&nbsp;ETH</p>
            <p>1,518 total</p>
          </div>
          <div className="ringOption">
            <div className="ringImage">
              <Image alt="Legendary Ring" placeholder="blur" src={require('../public/images/example/Legendary.png')} />
            </div>
            <h4>Legendary Ring</h4>
            <p>{formatEther(PRICE_RING_LEGENDARY)}&nbsp;ETH</p>
            <p>50 total, 2 of a kind</p>
          </div>
          <div className="ringOption">
            <div className="ringImage">
              <Image alt="Mythic Ring" placeholder="blur" src={require('../public/images/example/Mythic.png')} />
            </div>
            <h4>Mythic Ring</h4>
            <p>{formatEther(PRICE_RING_MYTHIC)}&nbsp;ETH</p>
            <p>720 total, 1 of a kind</p>
          </div>
        </div>
      </section>
      <style jsx>{`
        main {
          display: flex;
          flex-direction: column;
          max-width: 100%;
          width: 1440px;
          padding: 92px 128px;
          margin: 0px auto;
          position: relative;
        }
        @media only screen and (max-width: 1024px) {
          main {
            width: 760px;
            max-width: 100%;
            padding: 92px 0px;
          }
        }
        h1 {
          font-family: EB Garamond;
          font-style: normal;
          font-weight: normal;
          font-size: 40px;
          line-height: 56px;
        }
        h2 {
          font-family: EB Garamond;
          font-style: normal;
          font-weight: normal;
          font-size: 32px;
          line-height: 44px;
        }
        h4 {
          font-weight: bold;
          font-size: 20px;
          line-height: 28px;
          margin: 0px;
        }
        p {
          font-family: Times;
          font-style: normal;
          font-weight: normal;
          font-size: 20px;
          line-height: 28px;
          margin: 8px 0px;
        }
        .small-caps {
          font-variant: small-caps;
          font-size: 70%;
        }
        .twitter-link {
          margin-top: 48px;
          font-size: 24px;
          line-height: 32px;
          color: #E6BF72;
          text-decoration: none;
          font-family: EB Garamond;
        }
        section {
          display: flex;
        }
        @media only screen and (max-width: 1024px) {
          section {
            flex-direction: column;
          }
        }
        @media only screen and (min-width: 1024px) {
          section > :global(*):not(:last-child) {
            margin-right: 80px;
          }
        }
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          height: 592px;
          padding: 24px;
          margin: 32px 0px;
        }
        .hero > :global(*) {
          z-index: 1;
        }
        .hero h1 {
          margin: 0px;
          text-align: center;
        }
        .hero p {
          margin: 0;
          font-size: 32px;
          line-height: 44px;
          text-align: center;
          color: #E5BF72;
        }
        .mint-link {
          padding 8px 16px;
          background: #736039;
          border: 1px solid #8C7546;
          border-radius: 4px;
          color: white;
          text-decoration: none;
          font-size: 18px;
          line-height: 24px;
          justify-self: flex-end;
          position: absolute;
          bottom: 24px;
        }
        .hero-bg {
          z-index: -1;
        }
        .content {
          flex: 1;
        }
        .image-sm {
          width: 592px;
          height: 592px;
          position: relative;
        }
        .image-xl {
          width: 720px;
          height: 720px;
          position: relative;
        }
        @media only screen and (max-width: 1024px) {
          .image-sm,
          .image-xl {
            aspect-ratio: 1;
            flex: 1;
            width: auto;
            height: auto;
          }
        }
        .rings {
          margin-top: 128px;
        }
        .rings .image-sm {
          z-index: 1;
        }
        @media only screen and (max-width: 1024px) {
          .mobile-reverse {
            flex-direction: column-reverse;
          }
          .content {
            margin: 64px;
          }
        }
        @media only screen and (min-width: 1024px) {
          .rarity {
            margin-top: -128px;
          }
          .rarity .content {
            padding-top: 128px;
          }
        }
        @media only screen and (min-width: 1024px) {
          .loot {
            margin: 128px -128px;
          }
          .loot .content {
            min-width: 512px;
            padding-right: 128px;
          }
        }
        @media only screen and (min-width: 1024px) {
          .forging {
            margin: 0px -128px;
          }
          .forging .content {
            min-width: 512px;
            padding-left: 128px;
          }
        }
        @media only screen and (min-width: 1024px) {
          .timeline {
            margin: 128px 0px;
          }
          .timeline .content {
            min-width: 400px;
          }
        }
        .supply {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
        }
        .supply h1 {
          margin: 0px;
        }
        @media only screen and (max-width: 1024px) {
          .supply h1 {
            margin: 64px;
          }
        }
        .center {
          margin: 16px 0px 64px;
        }
        @media only screen and (min-width: 1024px) {
          .ringOptions {
            display: flex;AccountInfo
            justify-content: space-between;
            align-self: stretch;
          }
        }
        .ringOptions > :global(*):not(:last-child) {
          margin-right: 48px;
        }
        .ringOption {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        @media only screen and (max-width: 1024px) {
          .ringOption {
            max-width: 256px;
            margin: 32px 0px;
          }
        }
        .ringImage {
          aspect-ratio: 1;
        }
      `}</style>
    </main>
  );
};

export default Home2;
