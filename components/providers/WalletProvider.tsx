"use client";

import { createContext, useContext, ReactNode } from 'react';
import { WalletProvider as SuiWalletProvider, SuiClientProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Try alternative CSS import paths
import '@mysten/dapp-kit/dist/index.css';

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

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
  },
});

export const WalletProvider = ({ children }: WalletProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={{
        testnet: { url: getFullnodeUrl('testnet') },
        mainnet: { url: getFullnodeUrl('mainnet') },
      }} defaultNetwork="testnet">
        <SuiWalletProvider
          storageKey="sui-wallet-kit"
          storage={typeof window !== 'undefined' ? window.localStorage : undefined}
          autoConnect={true}
        >
          <WalletContext.Provider value={{}}>
            {children}
          </WalletContext.Provider>
        </SuiWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};
