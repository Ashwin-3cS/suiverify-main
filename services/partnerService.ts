import { API_CONFIG } from '@/config/api';

export interface PartnerCtx {
  client_id: string;
  redirect_uri: string;
  state: string;
  did_type: number;
}

export interface PartnerValidateResponse {
  client_id: string;
  name: string;
}

const STORAGE_KEY = 'suiverify:partner_ctx';

export const partnerService = {
  /**
   * Validate that a client_id + redirect_uri pair is allowlisted.
   * Public endpoint (no auth header). Returns null on rejection.
   */
  async validate(clientId: string, redirectUri: string): Promise<PartnerValidateResponse | null> {
    const url = `${API_CONFIG.BASE_URL}/api/partners/${encodeURIComponent(clientId)}/validate?redirect_uri=${encodeURIComponent(redirectUri)}`;
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) return null;
      return (await res.json()) as PartnerValidateResponse;
    } catch (err) {
      console.error('partner validate failed', err);
      return null;
    }
  },

  /**
   * Record a successful verification event (billing).
   */
  async recordEvent(args: {
    client_id: string;
    user_wallet: string;
    nft_id: string;
    did_type: number;
    reused_existing: boolean;
    state?: string;
  }): Promise<boolean> {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/partners/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      return res.ok;
    } catch (err) {
      console.error('partner event record failed', err);
      return false;
    }
  },

  // ---- sessionStorage helpers ----

  saveCtx(ctx: PartnerCtx): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
    } catch (err) {
      console.error('saveCtx failed', err);
    }
  },

  loadCtx(): PartnerCtx | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PartnerCtx;
    } catch {
      return null;
    }
  },

  clearCtx(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },

  /**
   * Build the partner redirect URL with verification result.
   */
  buildRedirectUrl(
    ctx: PartnerCtx,
    args: { nft_id: string; owner: string; status: 'success' | 'error'; reason?: string },
  ): string {
    const u = new URL(ctx.redirect_uri);
    u.searchParams.set('status', args.status);
    u.searchParams.set('state', ctx.state);
    if (args.status === 'success') {
      u.searchParams.set('nft_id', args.nft_id);
      u.searchParams.set('owner', args.owner);
    } else if (args.reason) {
      u.searchParams.set('reason', args.reason);
    }
    return u.toString();
  },
};
