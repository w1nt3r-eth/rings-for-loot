import '../styles/globals.css';
import {withTRPC} from '@trpc/next';
import type {AppProps} from 'next/app';
import {AppRouter} from '../src/api/router';
import {WalletProvider} from '../src/hooks/useWeb3';

function MyApp({Component, pageProps}: AppProps) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
export default withTRPC<AppRouter>({
  config({ctx}) {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    const url = process.env.TRPC_HOST ? `https://${process.env.TRPC_HOST}/api/trpc` : 'http://localhost:3000/api/trpc';

    return {
      url,
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
})(MyApp);
