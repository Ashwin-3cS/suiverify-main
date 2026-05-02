'use client';

import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { useAuth } from './useAuth';

export type AuthMode = 'zklogin' | 'wallet' | null;

export interface UnifiedAuth {
  address: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authMode: AuthMode;
  zkProof: unknown;
  jwtToken: string | null;
  userSalt: string | null;
  ephemeralPrivateKey: string | null;
  maxEpoch: number | null;
  randomness: string | null;
  logout: () => void;
  checkAuth: () => void;
  setAuthData: (data: {
    address: string;
    zkProof: unknown;
    jwtToken: string;
    userSalt: string;
    ephemeralPrivateKey: string;
    maxEpoch: number;
    randomness: string;
  }) => void;
}

/**
 * Unified auth hook: wallet connection takes priority over zkLogin.
 * Call this in leaf components — dapp-kit re-renders stay isolated here,
 * not propagated through the whole AuthContext tree.
 */
export function useUnifiedAuth(): UnifiedAuth {
  const walletAccount = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const zkAuth = useAuth();

  if (walletAccount) {
    return {
      address: walletAccount.address,
      isAuthenticated: true,
      isLoading: zkAuth.isLoading,
      authMode: 'wallet',
      zkProof: null,
      jwtToken: null,
      userSalt: null,
      ephemeralPrivateKey: null,
      maxEpoch: null,
      randomness: null,
      logout: () => {
        disconnectWallet();
      },
      checkAuth: zkAuth.checkAuth,
      setAuthData: zkAuth.setAuthData,
    };
  }

  return {
    ...zkAuth,
    authMode: zkAuth.isAuthenticated ? 'zklogin' : null,
  };
}

export default useUnifiedAuth;
