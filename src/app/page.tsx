'use client'
import styles from './page.module.css'
import { Wallet } from './wallet'
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
} from "@solana/wallet-adapter-react-ui";
import '@solana/wallet-adapter-react-ui/styles.css'
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import * as web3 from "@solana/web3.js";
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('./wallet')).Wallet,
      { ssr: false }
  )

  enum CLUSTER {
    DEVNET = 'devnet',
    TESTNET = 'testnet',
    MAINNET = 'mainnet-beta'
  };

export default function Home() {
  const endpoint1 = web3.clusterApiUrl(CLUSTER.DEVNET);
  const endpoint2 = 'https://mass-krysta-fast-mainnet.helius-rpc.com/';
  const wallet = new PhantomWalletAdapter();
  return (
    <ConnectionProvider endpoint={endpoint2}>
      <WalletProvider wallets={[wallet]}>
        <WalletModalProvider>
          <main>
            <WalletMultiButtonDynamic />
          </main>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>

  )
}
