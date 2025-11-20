'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ZkLoginService } from '@/lib/zklogin';
import { Button } from '@/components/ui/button';
import { Loader2, User, Copy, LogOut, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { buildExplorerUrl } from '@/config/contracts';

export const AuthButton: React.FC<{ className?: string; size?: 'sm' | 'default' | 'lg' }> = ({
  className = '',
  size = 'sm',
}) => {
  const { address, isAuthenticated, isLoading, logout } = useAuth();
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

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied', {
        position: "bottom-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy address', {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    logout();
    toast.success('Wallet disconnected', {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  const handleAddressClick = () => {
    if (!address) return;
    const explorerUrl = buildExplorerUrl(address, 'account');
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  };

  // Show loading state
  if (isLoading) {
    return (
      <Button
        disabled
        variant="outline"
        size={size}
        className={className}
      >
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Not authenticated - show Sign In button
  if (!isAuthenticated) {
    return (
      <>
        <Button
          onClick={handleSignIn}
          disabled={isLoggingIn}
          variant="primary"
          className={className}
        >
          {isLoggingIn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoggingIn ? 'Signing In...' : <><UserRound className="w-4 h-4 mr-1" /> Sign In</>}
        </Button>
      </>
    );
  }

  // Authenticated - show address with copy and disconnect icons inside container
  return (
    <div
      onClick={handleAddressClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-[3px] border-secondary/30 shadow-[0.1em_0.1em_0_0_rgb(0,0,0)] bg-white hover:bg-secondary/5 transition-colors cursor-pointer ${className}`}
      title="Click to view on explorer"
    >
      <User className="w-4 h-4 text-secondary flex-shrink-0" />
      <span className="text-charcoal-text font-medium underline-offset-2 underline">
        {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Account'}
      </span>
      
      <button
        onClick={handleCopy}
        className="ml-auto p-1.5 rounded hover:bg-primary/10 transition-colors flex-shrink-0"
        title="Copy address"
      >
        <Copy className="w-4 h-4 text-secondary" />
      </button>
      
      <button
        onClick={handleDisconnect}
        className="p-1.5 rounded hover:bg-error/10 transition-colors flex-shrink-0"
        title="Disconnect wallet"
      >
        <LogOut className="w-4 h-4 text-error" />
      </button>
    </div>
  );
};

export default AuthButton;
