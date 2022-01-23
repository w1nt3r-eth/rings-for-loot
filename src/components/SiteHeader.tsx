import {NextSeo} from 'next-seo';
import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import AccountButton from './AccountButton';
import {DiscordIcon, OpenSeaIcon, TwitterIcon} from './icons';

export default function SiteHeader({title}: {title?: string}) {
  return (
    <header>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.png" />
        <meta name="theme-color" content="#000" />
        <meta name="msapplication-navbutton-color" content="#000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </Head>
      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-SEZ41DQE1K" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-SEZ41DQE1K');
        `}
      </Script>
      <NextSeo
        title={title ? 'Rings (for Loot) | ' + title : 'Rings (for Loot)'}
        description="Rings (for Loot) is the first and largest 3D interpretation of an entire category in Loot. Adventurers, builders, and artists are encouraged to reference Rings (for Loot) to further expand on the imagination of Loot."
        canonical="https://rings.market/"
        openGraph={{
          images: [
            {
              url: 'https://rings.market/og-image.png',
              width: 1200,
              height: 630,
              alt: 'Rings for Loot',
              type: 'image/png',
            },
          ],
        }}
      />
      <Menu />
      <style jsx>{`
        header {
          display: flex;
          justify-content: space-between;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 16px 32px;
          font-size: 20px;
          font-family: 'EB Garamond';
        }
      `}</style>
    </header>
  );
}

function Menu() {
  return (
    <nav>
      <div className="edge">
        <Link href="/">
          <a>Rings</a>
        </Link>
      </div>
      <div className="center">
        <Link href="https://opensea.io/collection/rings-for-loot">
          <a>
            <span className="large">OpenSea</span>
            <span className="small">
              <OpenSeaIcon size={18} />
            </span>
          </a>
        </Link>
        <Link href="https://twitter.com/RingsforLoot">
          <a>
            <span className="large">Twitter</span>
            <span className="small">
              <TwitterIcon size={18} />
            </span>
          </a>
        </Link>
        <Link href="https://discord.gg/3kCXG4N8HX">
          <a>
            <span className="large">Discord</span>
            <span className="small">
              <DiscordIcon size={18} />
            </span>
          </a>
        </Link>
      </div>
      <div className="edge connect">
        <AccountButton />
      </div>
      <style jsx>{`
        nav {
          display: flex;
          flex-wrap: wrap;
          flex: 1;
        }
        .center {
          display: flex;
          flex: 1;
          align-items: center;
          justify-content: center;
        }
        @media only screen and (min-width: 1024px) {
          .center > :global(*):not(:last-child) {
            margin-right: 32px;
          }
          .edge {
            width: 150px;
          }
        }
        @media only screen and (max-width: 1024px) {
          .center > :global(*):not(:last-child) {
            margin-right: 8px;
          }
        }
        .small {
          display: none;
        }
        @media only screen and (max-width: 500px) {
          .small {
            display: inline-flex;
            margin: 4px;
          }
          .large {
            display: none;
          }
        }
        nav :global(a) {
          color: white;
          text-decoration: none;
        }
        nav :global(a):hover {
          color: #e5bf72;
        }
        .connect {
          text-align: right;
        }
      `}</style>
    </nav>
  );
}
