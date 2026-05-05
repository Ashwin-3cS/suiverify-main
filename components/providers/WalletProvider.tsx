"use client";

import { createContext, useContext, ReactNode } from 'react';
import { WalletProvider as SuiWalletProvider, SuiClientProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWalletAuth } from '@/hooks/useWalletAuth';
// Try alternative CSS import paths
import '@mysten/dapp-kit/dist/index.css';

// Inner client component — runs SIWS once per wallet connection. Mounted
// inside SuiWalletProvider so dapp-kit hooks resolve correctly.
const WalletAuthBootstrap = () => {
  useWalletAuth();
  return null;
};

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

// Stable constants — defined outside component to avoid new references on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
  },
});

const networks = {
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

const defaultNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet') || 'testnet';

export const WalletProvider = ({ children }: WalletProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={defaultNetwork}>
        <SuiWalletProvider
          storageKey="sui-wallet-kit"
          storage={typeof window !== 'undefined' ? window.localStorage : undefined}
          autoConnect={true}
        >
          <WalletContext.Provider value={{}}>
            <WalletAuthBootstrap />
            {children}
          </WalletContext.Provider>
        </SuiWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};
