import Link from 'next/link';
import {useWalletProvider} from '../hooks/useWeb3';
import AccountInfo from './AccountInfo';

export default function AccountButton() {
  const wallet = useWalletProvider();

  return wallet.address ? (
    <AccountInfo address={wallet.address} />
  ) : (
    <Link href="#">
      <a
        onClick={(e) => {
          wallet.connect();
          e.preventDefault();
        }}>
        Connect&nbsp;Wallet
      </a>
    </Link>
  );
}
