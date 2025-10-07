// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Encryption endpoints
  ENCRYPTION_STORE: '/api/encryption/store',
  ENCRYPTION_GOVERNMENT_DECRYPTION_DATA: (userAddress: string, governmentWallet: string) => 
    `/api/encryption/government/decryption-data/${userAddress}?government_wallet=${governmentWallet}`,
  
  // Verification endpoints
  VERIFY_AADHAAR: '/api/verify-aadhaar',
  VERIFY_OTP: '/api/verify-otp',
  
  // Credential endpoints
  CREDENTIALS: '/api/credentials',
} as const;
