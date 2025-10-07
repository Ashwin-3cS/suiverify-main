"use client";

import { createContext, useContext, ReactNode } from 'react';
import { WalletProvider as SuiWalletProvider, SuiClientProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';

// Create a custom context for wallet state
interface WalletContextType {
  // Add any custom wallet state here if needed
  [key: string]: unknown;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  return (
    <SuiClientProvider networks={{
      testnet: { url: getFullnodeUrl('testnet') },
      mainnet: { url: getFullnodeUrl('mainnet') },
    }} defaultNetwork="testnet">
      <SuiWalletProvider>
        <WalletContext.Provider value={{}}>
          {children}
        </WalletContext.Provider>
      </SuiWalletProvider>
    </SuiClientProvider>
  );
};
