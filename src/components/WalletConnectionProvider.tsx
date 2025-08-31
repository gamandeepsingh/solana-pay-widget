import React, { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  AlphaWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// Import wallet adapter CSS (consumer needs to include this)
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletConnectionProviderProps {
  children: ReactNode;
  rpcEndpoint?: string;
}

export const WalletConnectionProvider: React.FC<WalletConnectionProviderProps> = ({
  children,
  rpcEndpoint = 'https://api.devnet.solana.com'
}) => {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new AlphaWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={rpcEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};