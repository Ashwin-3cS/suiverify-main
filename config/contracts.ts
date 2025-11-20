// Contract Configuration for SUI Blockchain
// This file contains all contract addresses and IDs used across the application

// =============================================================================
// PACKAGE IDs - Main contract packages deployed on different networks
// =============================================================================

export const CONTRACT_PACKAGES = {
  // Development network (not deployed yet)
  DEVNET: '0xTODO',
  
  // Testnet deployment - Current active package
  TESTNET: '0x6ec40d30e636afb906e621748ee60a9b72bc59a39325adda43deadd28dc89e09',
  
  // Mainnet deployment (not deployed yet)
  MAINNET: '0xTODO',
} as const;

// =============================================================================
// REGISTRY & SHARED OBJECTS - Core system objects
// =============================================================================

export const SHARED_OBJECTS = {
  // DID Registry - Manages all DID operations
  DID_REGISTRY: '0x2c6962f40c84a7df1d40c74ab05c7f60c9afdbae8129cfe507ced948a02cbdc4',
  
  // Government Whitelist - Controls access permissions for government entities
  GOVERNMENT_WHITELIST: '0x5db149489d68ece83a08559773a1d1f898e4fa4b31d9807b7bb24c88dc8ffb26',
  
  // Payment Registry - Handles payment operations (if needed)
  PAYMENT_REGISTRY: '0x000af5ea941c01e426968d91a420018b9746c493e6fb2512dac4f20f93005748',
  
  // SUI Clock object - System clock for timestamp operations
  CLOCK: '0x0000000000000000000000000000000000000000000000000000000000000006',
} as const;

// =============================================================================
// NETWORK CONFIGURATION
// =============================================================================

export const NETWORK_CONFIG = {
  // Current active network
  CURRENT_NETWORK: 'TESTNET' as keyof typeof CONTRACT_PACKAGES,
  
  // RPC endpoints
  RPC_ENDPOINTS: {
    DEVNET: 'https://fullnode.devnet.sui.io:443',
    TESTNET: 'https://fullnode.testnet.sui.io:443',
    MAINNET: 'https://fullnode.mainnet.sui.io:443',
  },
  
  // Explorer URLs for different networks
  EXPLORER_URLS: {
    DEVNET: 'https://suiscan.xyz/devnet',
    TESTNET: 'https://suiscan.xyz/testnet', 
    MAINNET: 'https://suiscan.xyz/mainnet',
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the current active package ID based on network configuration
 */
export const getCurrentPackageId = (): string => {
  return CONTRACT_PACKAGES[NETWORK_CONFIG.CURRENT_NETWORK];
};

/**
 * Get the current RPC endpoint
 */
export const getCurrentRpcEndpoint = (): string => {
  return NETWORK_CONFIG.RPC_ENDPOINTS[NETWORK_CONFIG.CURRENT_NETWORK];
};

/**
 * Get the current explorer base URL
 */
export const getCurrentExplorerUrl = (): string => {
  return NETWORK_CONFIG.EXPLORER_URLS[NETWORK_CONFIG.CURRENT_NETWORK];
};

/**
 * Build explorer URL for a specific object/transaction/account
 */
export const buildExplorerUrl = (objectId: string, type: 'object' | 'tx' | 'account' = 'object'): string => {
  const baseUrl = getCurrentExplorerUrl();
  return `${baseUrl}/${type}/${objectId}`;
};

// =============================================================================
// CONTRACT FUNCTION TARGETS - Commonly used contract functions
// =============================================================================

export const CONTRACT_FUNCTIONS = {
  // DID Registry functions
  DID_REGISTRY: {
    CREATE_USER_DID: `${getCurrentPackageId()}::did_registry::create_user_did`,
    CLAIM_DID_NFT: `${getCurrentPackageId()}::did_registry::claim_did_nft`,
    VERIFY_DID: `${getCurrentPackageId()}::did_registry::verify_did`,
  },
  
  // Government Whitelist functions
  GOVERNMENT: {
    ADD_TO_WHITELIST: `${getCurrentPackageId()}::government_whitelist::add_to_whitelist`,
    REMOVE_FROM_WHITELIST: `${getCurrentPackageId()}::government_whitelist::remove_from_whitelist`,
  },
  
  // Enclave functions (if applicable)
  ENCLAVE: {
    VERIFY_SIGNATURE: `${getCurrentPackageId()}::enclave::verify_signature`,
  },
} as const;

// =============================================================================
// EVENT TYPES - Contract event identifiers
// =============================================================================

export const EVENT_TYPES = {
  // DID Registry events
  VERIFICATION_COMPLETED: `${getCurrentPackageId()}::did_registry::VerificationCompleted`,
  DID_CREATED: `${getCurrentPackageId()}::did_registry::DIDCreated`,
  NFT_CLAIMED: `${getCurrentPackageId()}::did_registry::NFTClaimed`,
  
  // Government events
  WHITELIST_UPDATED: `${getCurrentPackageId()}::government_whitelist::WhitelistUpdated`,
} as const;

// =============================================================================
// DID TYPES & STATUS CONSTANTS
// =============================================================================

export const DID_TYPES = {
  AGE_VERIFICATION: 1,
  CITIZENSHIP_VERIFICATION: 2,
} as const;

export const VERIFICATION_STATUS = {
  PENDING: 0,
  VERIFIED: 1,
  REJECTED: 2,
} as const;

// =============================================================================
// GAS CONFIGURATION
// =============================================================================

export const GAS_CONFIG = {
  // Standard gas budget for most operations
  STANDARD_GAS_BUDGET: 10_000_000, // 10M MIST
  
  // Higher gas budget for complex operations
  HIGH_GAS_BUDGET: 50_000_000, // 50M MIST
  
  // Gas budget for NFT claiming
  NFT_CLAIM_GAS_BUDGET: 10_000_000, // 10M MIST
} as const;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate if an object ID has the correct format
 */
export const isValidObjectId = (objectId: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(objectId);
};

/**
 * Validate if a package ID matches the current network
 */
export const isCurrentPackage = (packageId: string): boolean => {
  return packageId === getCurrentPackageId();
};

// =============================================================================
// EXPORT DEFAULT CONFIG
// =============================================================================

export const CONTRACT_CONFIG = {
  PACKAGES: CONTRACT_PACKAGES,
  SHARED_OBJECTS,
  NETWORK: NETWORK_CONFIG,
  FUNCTIONS: CONTRACT_FUNCTIONS,
  EVENTS: EVENT_TYPES,
  DID_TYPES,
  VERIFICATION_STATUS,
  GAS: GAS_CONFIG,
} as const;

export default CONTRACT_CONFIG;
