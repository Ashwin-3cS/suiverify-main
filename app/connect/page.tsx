'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ZkLoginService } from '@/lib/zklogin';
import { Button } from '@/components/ui/button';
import { partnerService, type PartnerCtx } from '@/services/partnerService';
import { credentialService } from '@/services/credentialService';
import { ConnectModal } from '@mysten/dapp-kit';

type Phase =
  | 'validating'
  | 'invalid-partner'
  | 'awaiting-login'
  | 'logging-in'
  | 'checking-existing'
  | 'redirecting'
  | 'route-to-kyc'
  | 'error';

function ConnectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isAuthenticated, isLoading: authLoading } = useAuth();

  const [phase, setPhase] = useState<Phase>('validating');
  const [partnerName, setPartnerName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [ctx, setCtx] = useState<PartnerCtx | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const isResume = searchParams.get('step') === 'resume';

  // Phase 1: validate partner ctx (or load from sessionStorage on resume)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let nextCtx: PartnerCtx | null = null;

      if (isResume) {
        nextCtx = partnerService.loadCtx();
        if (!nextCtx) {
          if (!cancelled) {
            setPhase('error');
            setErrorMsg('Lost partner context after sign-in. Please restart from the partner site.');
          }
          return;
        }
      } else {
        const client_id = searchParams.get('client_id');
        const redirect_uri = searchParams.get('redirect_uri');
        const state = searchParams.get('state');
        const didTypeRaw = searchParams.get('did_type');

        if (!client_id || !redirect_uri || !state) {
          if (!cancelled) {
            setPhase('invalid-partner');
            setErrorMsg('Missing client_id, redirect_uri or state.');
          }
          return;
        }
        const did_type = didTypeRaw ? parseInt(didTypeRaw, 10) : 1;
        if (Number.isNaN(did_type)) {
          if (!cancelled) {
            setPhase('invalid-partner');
            setErrorMsg('did_type must be a number.');
          }
          return;
        }
        nextCtx = { client_id, redirect_uri, state, did_type };
      }

      const validation = await partnerService.validate(nextCtx.client_id, nextCtx.redirect_uri);
      if (cancelled) return;
      if (!validation) {
        setPhase('invalid-partner');
        setErrorMsg('Untrusted partner or redirect_uri not allowlisted.');
        return;
      }

      partnerService.saveCtx(nextCtx);
      setCtx(nextCtx);
      setPartnerName(validation.name);
      setPhase(isAuthenticated ? 'checking-existing' : 'awaiting-login');
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResume]);

  // Phase 2: once authenticated, look for existing matching NFT
  useEffect(() => {
    if (phase !== 'checking-existing') return;
    if (!isAuthenticated || !address || !ctx) return;

    let cancelled = false;
    (async () => {
      try {
        const { credentials } = await credentialService.getUserCredentials(address);
        const now = Date.now();
        // Note: backend credentials.did_type currently stores the UserDID
        // object id (a 0x... hex), not the partner's integer did_type. Until
        // schema is fixed, accept any verified NFT for the wallet. Granular
        // matching (age vs citizenship vs ...) lands when did_type column
        // is split into a separate verification_kind field.
        const match = credentials.find((c) => {
          if (c.type !== 'nft' || !c.nftId) return false;
          if (c.status !== 'verified') return false;
          if (c.expiryDate) {
            const exp = Date.parse(c.expiryDate);
            if (!Number.isNaN(exp) && exp <= now) return false;
          }
          return true;
        });

        if (cancelled) return;

        if (match && match.nftId) {
          await partnerService.recordEvent({
            client_id: ctx.client_id,
            user_wallet: address,
            nft_id: match.nftId,
            did_type: ctx.did_type,
            reused_existing: true,
            state: ctx.state,
          });
          partnerService.clearCtx();
          const url = partnerService.buildRedirectUrl(ctx, {
            nft_id: match.nftId,
            owner: address,
            status: 'success',
            is_new: false,
          });
          setPhase('redirecting');
          window.location.replace(url);
        } else {
          // No NFT — route to KYC; partner ctx stays in sessionStorage and is
          // picked up by /kyc on success.
          setPhase('route-to-kyc');
          router.push('/kyc');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('existing-NFT lookup failed', err);
        setPhase('error');
        setErrorMsg('Failed to check existing credentials. Try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, isAuthenticated, address, ctx, router]);

  // Phase 3: after auth resolves, advance from awaiting-login → checking-existing
  useEffect(() => {
    if (phase === 'awaiting-login' && isAuthenticated && !authLoading) {
      setPhase('checking-existing');
    }
  }, [phase, isAuthenticated, authLoading]);

  const handleSignIn = async () => {
    setPhase('logging-in');
    try {
      const { nonce } = await ZkLoginService.initializeSession();
      const oauthUrl = ZkLoginService.getOAuthUrl(nonce);
      window.location.href = oauthUrl;
    } catch (err) {
      console.error('sign-in failed', err);
      setPhase('error');
      setErrorMsg('Sign-in failed. Try again.');
    }
  };

  const handleCancel = () => {
    if (!ctx) return;
    const url = partnerService.buildRedirectUrl(ctx, {
      nft_id: '',
      owner: '',
      status: 'error',
      reason: 'user_cancelled',
    });
    partnerService.clearCtx();
    window.location.replace(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-semibold mb-2">Verify with SuiVerify</h1>
        {partnerName && (
          <p className="text-sm text-muted-foreground mb-6">
            Continuing to <span className="font-medium text-foreground">{partnerName}</span>
          </p>
        )}

        {phase === 'validating' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Validating partner…
          </div>
        )}

        {phase === 'invalid-partner' && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <p className="text-xs text-muted-foreground">
              Please return to the partner site and start the verification again.
            </p>
          </div>
        )}

        {phase === 'awaiting-login' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in to verify your identity. We&apos;ll create a
              wallet-bound credential and send you back to {partnerName} when done.
            </p>
            <Button onClick={handleSignIn} className="w-full">Continue with Google</Button>
            <Button onClick={() => setWalletModalOpen(true)} variant="secondary" className="w-full">
              Connect Wallet instead
            </Button>
            <Button onClick={handleCancel} variant="outline" className="w-full">Cancel</Button>
            <ConnectModal
              trigger={<span />}
              open={walletModalOpen}
              onOpenChange={setWalletModalOpen}
            />
          </div>
        )}

        {phase === 'logging-in' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to sign-in…
          </div>
        )}

        {phase === 'checking-existing' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking existing credentials…
          </div>
        )}

        {phase === 'route-to-kyc' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> No credential yet — starting KYC…
          </div>
        )}

        {phase === 'redirecting' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Returning you to {partnerName}…
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <Button onClick={handleCancel} variant="outline" className="w-full">
              Return to partner
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <ConnectInner />
    </Suspense>
  );
}
