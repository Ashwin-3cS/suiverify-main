import { API_ENDPOINTS, buildApiUrl } from '@/config/api';
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'walletAuthToken';
const STORAGE_KEY_EXP = 'walletAuthTokenExp';
const STORAGE_KEY_ADDR = 'walletAuthTokenAddr';

export interface WalletAuthToken {
  token: string;
  expiresAt: number; // unix seconds
  address: string;
}

interface NonceResponse {
  address: string;
  nonce: string;
  message: string;
  issued_at: number;
  expires_at: number;
}

interface LoginResponse {
  token: string;
  expires_at: number;
  address: string;
}

const SAFETY_WINDOW_S = 60; // refresh if <60s remaining

export const walletAuth = {
  getToken(address: string | null | undefined): WalletAuthToken | null {
    if (typeof window === 'undefined' || !address) return null;
    const token = localStorage.getItem(STORAGE_KEY);
    const expRaw = localStorage.getItem(STORAGE_KEY_EXP);
    const addr = localStorage.getItem(STORAGE_KEY_ADDR);
    if (!token || !expRaw || !addr) return null;
    if (addr.toLowerCase() !== address.toLowerCase()) return null;
    const expiresAt = parseInt(expRaw, 10);
    if (!Number.isFinite(expiresAt)) return null;
    if (expiresAt - Math.floor(Date.now() / 1000) < SAFETY_WINDOW_S) return null;
    return { token, expiresAt, address: addr };
  },

  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY_EXP);
    localStorage.removeItem(STORAGE_KEY_ADDR);
  },

  async fetchNonce(address: string): Promise<NonceResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.WALLET_NONCE}?address=${encodeURIComponent(address)}`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch wallet nonce: ${res.status}`);
    }
    return res.json();
  },

  async login(
    address: string,
    signMessage: (message: Uint8Array) => Promise<{ signature: string }>,
  ): Promise<WalletAuthToken> {
    logger.log('SIWS: requesting nonce for', address);
    const nonce = await this.fetchNonce(address);

    logger.log('SIWS: signing personal message');
    const messageBytes = new TextEncoder().encode(nonce.message);
    const { signature } = await signMessage(messageBytes);

    logger.log('SIWS: posting login');
    const res = await fetch(buildApiUrl(API_ENDPOINTS.WALLET_LOGIN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Wallet login failed (${res.status}): ${text}`);
    }
    const data: LoginResponse = await res.json();

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, data.token);
      localStorage.setItem(STORAGE_KEY_EXP, String(data.expires_at));
      localStorage.setItem(STORAGE_KEY_ADDR, data.address);
    }
    return { token: data.token, expiresAt: data.expires_at, address: data.address };
  },
};

export default walletAuth;
