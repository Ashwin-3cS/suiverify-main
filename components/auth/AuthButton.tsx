'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ZkLoginService } from '@/lib/zklogin';
import { ConnectModal } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Loader2, User, Copy, LogOut, UserRound, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import { buildExplorerUrl } from '@/config/contracts';
import { logger } from '@/lib/logger';

export const AuthButton: React.FC<{ className?: string; size?: 'sm' | 'default' | 'lg' }> = ({
  className = '',
  size = 'sm',
}) => {
  const router = useRouter();
  const { address, isAuthenticated, isLoading, logout } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      logger.log(' Starting zkLogin flow...');

      // Initialize session and get nonce for OAuth
      const { nonce } = await ZkLoginService.initializeSession();
      logger.log(' Session initialized with nonce');

      // Get OAuth URL and redirect
      const oauthUrl = ZkLoginService.getOAuthUrl(nonce);
      logger.log(' Redirecting to OAuth provider...');

      window.location.href = oauthUrl;
    } catch (error) {
      console.error(' Sign-in error:', error);
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
    toast.info('Wallet disconnected', {
      position: "bottom-right",
      autoClose: 2000,
    });
    router.push('/');
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

  // Not authenticated - show Sign In button with options
  if (!isAuthenticated) {
    return (
      <div className="relative">
        <ConnectModal
          open={walletModalOpen}
          onOpenChange={setWalletModalOpen}
          trigger={<span />}
        />
        {showLoginOptions ? (
          <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[200px]">
            <button
              onClick={() => { setShowLoginOptions(false); handleSignIn(); }}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-charcoal-text transition-colors"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserRound className="w-4 h-4" />}
              Continue with Google
            </button>
            <button
              onClick={() => { setShowLoginOptions(false); setWalletModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-charcoal-text transition-colors"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          </div>
        ) : null}
        <Button
          onClick={() => setShowLoginOptions(v => !v)}
          disabled={isLoggingIn}
          variant="primary"
          className={className}
        >
          {isLoggingIn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoggingIn ? 'Signing In...' : <><UserRound className="w-4 h-4 mr-1" /> Sign In</>}
        </Button>
      </div>
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
