import { logger } from '@/lib/logger';

export const getZkLoginJwt = (): string | null => {
  if (typeof window === "undefined") return null;
  const configStr = localStorage.getItem("zkLoginProofCache");
  if (!configStr) return null;

  try {
    const config = JSON.parse(configStr);
    return config.jwtToken || config.jwt || null;
  } catch {
    logger.warn("Failed to parse zkLoginProofCache for JWT");
    return null;
  }
};

const getWalletJwt = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("walletAuthToken");
  const expRaw = localStorage.getItem("walletAuthTokenExp");
  if (!token || !expRaw) return null;
  const exp = parseInt(expRaw, 10);
  if (!Number.isFinite(exp)) return null;
  if (exp - Math.floor(Date.now() / 1000) < 30) return null; // expiring soon
  return token;
};

/**
 * Returns either the wallet-issued backend JWT (SIWS) or the zkLogin Google
 * JWT, whichever is present and fresh. Wallet token takes priority — matches
 * useUnifiedAuth's "wallet wins if both present" rule.
 */
export const getAuthToken = (): string | null => getWalletJwt() ?? getZkLoginJwt();

const isLikelyJwt = (token: string): boolean => {
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3) return false;
  const base64UrlPart = /^[A-Za-z0-9_=\-]+$/;
  return parts.every((p) => p.length > 0 && base64UrlPart.test(p));
};

const handleApiError = async (response: Response) => {
  let errorData: { detail?: string; message?: string } = {};
  try {
    errorData = await response.json();
  } catch {
    errorData = { detail: response.statusText };
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      // Just clear stale tokens; UI surfaces the error. No force-reload —
      // it caused an infinite loop on /dashboard for wallet users.
      if (localStorage.getItem("zkLoginProofCache")) {
        localStorage.removeItem("zkLoginProofCache");
        localStorage.removeItem("zkLoginSession");
      }
      if (localStorage.getItem("walletAuthToken")) {
        localStorage.removeItem("walletAuthToken");
        localStorage.removeItem("walletAuthTokenExp");
        localStorage.removeItem("walletAuthTokenAddr");
      }
    }
    throw new Error("Authentication expired. Please log in again.");
  }

  throw new Error(
    errorData.detail || errorData.message || "API Request Failed",
  );
};

export const apiFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const jwt = getAuthToken();

  const headers = new Headers(options.headers || {});
  if (jwt) {
    if (!isLikelyJwt(jwt)) {
      // Token is malformed — clear and let caller handle the resulting 401.
      localStorage.removeItem("zkLoginProofCache");
      localStorage.removeItem("zkLoginSession");
      localStorage.removeItem("walletAuthToken");
      localStorage.removeItem("walletAuthTokenExp");
      localStorage.removeItem("walletAuthTokenAddr");
      throw new Error("Authentication token is invalid. Please log in again.");
    }
    headers.set("Authorization", `Bearer ${jwt}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response;
};

export const apiPost = async <T = unknown>(
  url: string,
  body: unknown,
  isFormData: boolean = false,
): Promise<T> => {
  const options: RequestInit = {
    method: "POST",
    body: isFormData ? (body as FormData) : JSON.stringify(body),
  };

  if (!isFormData) {
    options.headers = {
      "Content-Type": "application/json",
    };
  }

  const response = await apiFetch(url, options);
  return response.json();
};

export const apiGet = async <T = unknown>(url: string): Promise<T> => {
  const response = await apiFetch(url, { method: "GET" });
  return response.json();
};
