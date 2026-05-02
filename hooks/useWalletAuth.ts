'use client';

import { useEffect, useRef, useState } from 'react';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { walletAuth } from '@/services/walletAuth';
import { logger } from '@/lib/logger';

/**
 * Triggers SIWS (Sign-In-With-Sui) when a wallet connects and there's no
 * valid backend-issued JWT for that address. Stores the JWT in localStorage
 * so api-client.ts can attach it as Bearer to subsequent backend calls.
 *
 * Mount once (see WalletProvider). Cheap to call from many places — the
 * inFlightRef + token check guard prevents duplicate signings.
 */
export function useWalletAuth() {
  const account = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const inFlightRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'signing' | 'authed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const address = account?.address;
    if (!address) {
      setStatus('idle');
      return;
    }

    // Already have a fresh token for this address
    if (walletAuth.getToken(address)) {
      setStatus('authed');
      return;
    }

    if (inFlightRef.current === address) return;
    inFlightRef.current = address;

    (async () => {
      try {
        setStatus('signing');
        setError(null);
        await walletAuth.login(address, async (message) => {
          const result = await signPersonalMessage({ message });
          return { signature: result.signature };
        });
        setStatus('authed');
        logger.log('SIWS: wallet authenticated');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.warn('SIWS failed:', msg);
        setError(msg);
        setStatus('error');
      } finally {
        if (inFlightRef.current === address) inFlightRef.current = null;
      }
    })();
  }, [account?.address, signPersonalMessage]);

  return { status, error };
}

export default useWalletAuth;
