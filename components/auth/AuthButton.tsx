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

  // Get button size classes - match Connect Wallet button style
  const sizeClasses = size === 'sm' ? 'text-xs sm:text-sm px-3 sm:px-4 py-2' :
                      size === 'lg' ? 'text-base px-6 py-3' :
                      'text-sm px-4 py-2';

  const baseButtonClasses = `flex items-center gap-2 bg-[#00BFFF] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`;

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
