'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ZkLoginService } from '@/lib/zklogin';
import { useAuth } from '@/hooks/useAuth';

function CallbackContent() {
  const router = useRouter();
  const { setAuthData, checkAuth } = useAuth();
  const [status, setStatus] = useState('Processing OAuth callback...');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) {
      console.log('⏭️ Callback already processed - skipping second StrictMode run.');
      return;
    }
    hasProcessedRef.current = true;

    const handleCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');

        // Extract JWT from URL fragment (#id_token=...)
        const fragment = window.location.hash;
        console.log('Fragment:', fragment.substring(0, 50) + '...');

        const idTokenMatch = fragment.match(/id_token=([^&]+)/);
        if (!idTokenMatch) {
          throw new Error('No id_token found in URL fragment. OAuth authentication may have failed.');
        }

        const jwtToken = decodeURIComponent(idTokenMatch[1]);
        console.log('✅ JWT token extracted');

        // Update status
        setStatus('Generating ZK proof (this takes 2-3 seconds)...');

        // Complete the entire zkLogin flow in one step
        // This includes: initialization, proof generation, and caching
        console.log('🔐 Completing zkLogin flow...');
        const result = await ZkLoginService.completeZkLoginFlow(jwtToken);

        console.log('✅ zkLogin flow completed successfully');
        console.log('📍 Address:', result.address);
        console.log(`👤 User type: ${result.isNewUser ? 'NEW' : 'EXISTING'}`);

        // Store auth data in React context (not localStorage)
        setAuthData({
          address: result.address,
          zkProof: result.zkProof,
          jwtToken: result.jwtToken,
          userSalt: result.userSalt,
          ephemeralPrivateKey: result.ephemeralPrivateKey,
          maxEpoch: result.maxEpoch,
          randomness: result.randomness,
        });

        checkAuth();
        setStatus('Authentication successful! Redirecting...');

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1200);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('❌ Callback error:', errorMessage);

        setError(errorMessage);
        setStatus('Authentication failed');

        // Redirect back to home after error delay
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    // Use Suspense boundary to handle searchParams
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent">
      <div className="max-w-md w-full mx-4 text-center outfit">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>

        {/* Status Message */}
        <h1 className="text-2xl font-bold text-charcoal-text mb-3">
          {error ? '❌ Authentication Failed' : '🔐 Signing You In'}
        </h1>

        <p className={`text-sm mb-6 ${error ? 'text-red-600' : 'text-charcoal-text/70'}`}>
          {error || status}
        </p>

        {/* Error Details */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-red-700 font-mono break-all">{error}</p>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-charcoal-text/60 space-y-2">
          <p>This page will close automatically.</p>
          {isProcessing && <p>Please keep this window open...</p>}
        </div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div />}>
      <CallbackContent />
    </Suspense>
  );
}
