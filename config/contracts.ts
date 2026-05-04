// Contract Configuration for SUI Blockchain
// Per-network maps. CURRENT_NETWORK driven by NEXT_PUBLIC_SUI_NETWORK env var.

type Network = 'DEVNET' | 'TESTNET' | 'MAINNET';

const ENV_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet').toUpperCase() as Network;
const CURRENT_NETWORK: Network = (['DEVNET', 'TESTNET', 'MAINNET'] as const).includes(ENV_NETWORK)
  ? ENV_NETWORK
  : 'TESTNET';

// =============================================================================
// PACKAGE IDs
// =============================================================================

export const CONTRACT_PACKAGES = {
  DEVNET: '0xTODO',
  TESTNET: '0x6ec40d30e636afb906e621748ee60a9b72bc59a39325adda43deadd28dc89e09',
  MAINNET: '0x1b93fc8314a79d97b5698a041bd0169895d6644faf9644365c1fab49b3f4f827',
} as const;

// =============================================================================
// SHARED OBJECTS — per network
// =============================================================================

const SHARED_OBJECTS_BY_NETWORK = {
  DEVNET: {
    DID_REGISTRY: '0xTODO',
    GOVERNMENT_WHITELIST: '0xTODO',
    PAYMENT_REGISTRY: '0xTODO',
    CLOCK: '0x0000000000000000000000000000000000000000000000000000000000000006',
  },
  TESTNET: {
    DID_REGISTRY: '0x2c6962f40c84a7df1d40c74ab05c7f60c9afdbae8129cfe507ced948a02cbdc4',
    GOVERNMENT_WHITELIST: '0x5db149489d68ece83a08559773a1d1f898e4fa4b31d9807b7bb24c88dc8ffb26',
    PAYMENT_REGISTRY: '0x000af5ea941c01e426968d91a420018b9746c493e6fb2512dac4f20f93005748',
    CLOCK: '0x0000000000000000000000000000000000000000000000000000000000000006',
  },
  MAINNET: {
    DID_REGISTRY: '0xe4092c8d9da174ab4381510e54bb95e7a67609d7cdbfef0036f3fbd1e2c06d57',
    GOVERNMENT_WHITELIST: '0xe7823b00eaaf8affeb1878cd071380beb4519faa66dd2df654fb3ac874f2b66d',
    PAYMENT_REGISTRY: '0x1489cb3aaba0125636016b21eeb394ce1eb0f49c84408bc3fd981f798f3b28ae',
    CLOCK: '0x0000000000000000000000000000000000000000000000000000000000000006',
  },
} as const;

export const SHARED_OBJECTS = SHARED_OBJECTS_BY_NETWORK[CURRENT_NETWORK];

// =============================================================================
// NETWORK CONFIGURATION
// =============================================================================

export const NETWORK_CONFIG = {
  CURRENT_NETWORK,
  RPC_ENDPOINTS: {
    DEVNET: 'https://fullnode.devnet.sui.io:443',
    TESTNET: 'https://fullnode.testnet.sui.io:443',
    MAINNET: 'https://fullnode.mainnet.sui.io:443',
  },
  EXPLORER_URLS: {
    DEVNET: 'https://suiscan.xyz/devnet',
    TESTNET: 'https://suiscan.xyz/testnet',
    MAINNET: 'https://suiscan.xyz/mainnet',
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const getCurrentPackageId = (): string => CONTRACT_PACKAGES[CURRENT_NETWORK];
export const getCurrentRpcEndpoint = (): string => NETWORK_CONFIG.RPC_ENDPOINTS[CURRENT_NETWORK];
export const getCurrentExplorerUrl = (): string => NETWORK_CONFIG.EXPLORER_URLS[CURRENT_NETWORK];

export const buildExplorerUrl = (objectId: string, type: 'object' | 'tx' | 'account' = 'object'): string => {
  return `${getCurrentExplorerUrl()}/${type}/${objectId}`;
};

// =============================================================================
// CONTRACT FUNCTION TARGETS
// =============================================================================

export const CONTRACT_FUNCTIONS = {
  DID_REGISTRY: {
    CREATE_USER_DID: `${getCurrentPackageId()}::did_registry::create_user_did`,
    CLAIM_DID_NFT: `${getCurrentPackageId()}::did_registry::claim_did_nft`,
    VERIFY_DID: `${getCurrentPackageId()}::did_registry::verify_did`,
  },
  GOVERNMENT: {
    ADD_TO_WHITELIST: `${getCurrentPackageId()}::government_whitelist::add_to_whitelist`,
    REMOVE_FROM_WHITELIST: `${getCurrentPackageId()}::government_whitelist::remove_from_whitelist`,
  },
  ENCLAVE: {
    VERIFY_SIGNATURE: `${getCurrentPackageId()}::enclave::verify_signature`,
  },
} as const;

// =============================================================================
// EVENT TYPES
// =============================================================================

export const EVENT_TYPES = {
  VERIFICATION_COMPLETED: `${getCurrentPackageId()}::did_registry::VerificationCompleted`,
  DID_CREATED: `${getCurrentPackageId()}::did_registry::DIDCreated`,
  NFT_CLAIMED: `${getCurrentPackageId()}::did_registry::NFTClaimed`,
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
  STANDARD_GAS_BUDGET: 10_000_000,
  HIGH_GAS_BUDGET: 50_000_000,
  NFT_CLAIM_GAS_BUDGET: 10_000_000,
} as const;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export const isValidObjectId = (objectId: string): boolean => /^0x[a-fA-F0-9]{64}$/.test(objectId);
export const isCurrentPackage = (packageId: string): boolean => packageId === getCurrentPackageId();

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
