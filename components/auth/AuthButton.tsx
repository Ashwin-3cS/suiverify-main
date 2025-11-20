'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ZkLoginService } from '@/lib/zklogin';
import { AddressModal } from './AddressModal';

export const AuthButton: React.FC<{ className?: string; size?: 'sm' | 'default' | 'lg' }> = ({
  className = '',
  size = 'sm',
}) => {
  const { address, isAuthenticated, isLoading, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      console.log('🔐 Starting zkLogin flow...');

      // Initialize session and get nonce for OAuth
      const { nonce } = await ZkLoginService.initializeSession();
      console.log('✅ Session initialized with nonce');

      // Get OAuth URL and redirect
      const oauthUrl = ZkLoginService.getOAuthUrl(nonce);
      console.log('🔗 Redirecting to OAuth provider...');

      window.location.href = oauthUrl;
    } catch (error) {
      console.error('❌ Sign-in error:', error);
      setIsLoggingIn(false);
    }
  };

  const handleDisconnect = () => {
    logout();
    setIsModalOpen(false);
  };

  // Modern button design: white background, black text, larger size
  const sizeClasses = size === 'sm' ? 'text-sm px-5 py-2.5' :
                      size === 'lg' ? 'text-base px-8 py-4' :
                      'text-sm px-6 py-3';

  const baseButtonClasses = `flex items-center gap-2 min-w-[160px] justify-center bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 shadow-sm hover:shadow-md ${sizeClasses}`;

  // Show loading state
  if (isLoading) {
    return (
      <button
        disabled
        className={`${baseButtonClasses} ${className}`}
      >
        Loading...
      </button>
    );
  }

  // Not authenticated - show Sign In button
  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={handleSignIn}
          disabled={isLoggingIn}
          className={`${baseButtonClasses} ${className}`}
        >
          {isLoggingIn && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isLoggingIn ? 'Signing In...' : 'Sign In'}
        </button>
      </>
    );
  }

  // Authenticated - show address button that opens modal
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`${baseButtonClasses} ${className}`}
        title="Click to view your address"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Account'}
      </button>

      {/* Address Modal */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        address={address || ''}
        onDisconnect={handleDisconnect}
      />
    </>
  );
};

export default AuthButton;
