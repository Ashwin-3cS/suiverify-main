// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Aadhaar endpoints
  EXTRACT_AADHAAR_DATA: "/api/aadhaar/extract-aadhaar-data",

  // PAN endpoints
  EXTRACT_PAN_DATA: "/api/pan/extract-pan-data",
  CORRECT_PAN_DATA: "/api/pan/correct-pan-data",
  VERIFY_PAN: "/api/pan/verify-pan",

  // DigiLocker endpoints
  DIGILOCKER_VERIFY_USER: "/api/digilocker/user/verify",
  DIGILOCKER_INIT_SESSION: "/api/digilocker/init-session",
  DIGILOCKER_SESSION_STATUS: (sessionId: string) =>
    `/api/digilocker/sessions/${sessionId}/status`,
  DIGILOCKER_FETCH_PAN_DATA: "/api/digilocker/fetch-pan-data",
  DIGILOCKER_CONFIRM_AND_ATTEST: "/api/digilocker/confirm-and-attest",

  // Face verification endpoints
  VALIDATE_DOCUMENT_FACE: "/api/face/validate-document-face",
  VERIFY_PAN_FACE: "/api/face/verify-pan-face-yolo",

  // Liveness endpoints
  LIVENESS_CHECK_FRAME: "/api/liveness/check-frame",
  LIVENESS_RESET_SESSION: "/api/liveness/reset-session",

  // OTP endpoints (for Aadhaar flow only)
  GENERATE_OTP: "/api/otp/generate-otp",
  VERIFY_OTP_ENDPOINT: "/api/otp/verify-otp",

  // Encryption endpoints
  ENCRYPTION_STORE: "/api/encryption/store",
  ENCRYPTION_GOVERNMENT_DECRYPTION_DATA: (
    userAddress: string,
    governmentWallet: string,
  ) =>
    `/api/encryption/government/decryption-data/${userAddress}?government_wallet=${governmentWallet}`,

  // Verification endpoints
  VERIFY_AADHAAR: "/api/verify-aadhaar",
  VERIFY_OTP: "/api/verify-otp",

  // Credential endpoints
  CREDENTIALS: "/api/credentials",
} as const;
