# SuiVerify Complete User Flow Documentation

## Overview
This document outlines the complete user journey from protocol integration to DID NFT claiming, based on the current SuiVerify architecture with government compliance via Walrus blob storage.

## Architecture Context

### Data Storage Strategy:
- **Protocols**: Only need verification status (18+, citizenship, etc.) - don't access raw government documents
- **Government Compliance**: Blob ID stored in NFT for Walrus retrieval when authorities need access
- **User Control**: Non-custodial approach where government entities are whitelisted for access when required
- **MongoDB Backup**: Stores NFT metadata for recovery if user leaves mid-process

---

## Complete User Flow

### Phase 1: Protocol Integration & DID Discovery

#### Step 1.1: Protocol Interaction
```
User visits Protocol → Requires age verification → Protocol integrates SuiVerify SDK
```

#### Step 1.2: SuiVerify Popup
**Popup Content:**
```
┌─────────────────────────────────────────────┐
│  SuiVerify Identity Verification Required   │
├─────────────────────────────────────────────┤
│  [Protocol Name] requires:                  │
│  • Age 18+ Verification                     │
│  • Citizenship Verification                 │
│                                             │
│  [Already have this DID? Verify]           │
│  [Get New DID Verification]                │
└─────────────────────────────────────────────┘
```

#### Step 1.3: Routing Logic
- **Existing DID**: Direct verification popup
- **New DID**: Route from `protocol.suiverify.xyz` → `suiverify.xyz/auth`

---

### Phase 2: Authentication & DID Dashboard

#### Step 2.1: Wallet Authentication
```
URL: suiverify.xyz/auth
Action: User connects wallet (MetaMask, Sui Wallet, etc.)
```

#### Step 2.2: DID Dashboard View
**Dashboard Layout:**
```
┌─────────────────────────────────────────────┐
│            Your Digital Identity            │
├─────────────────────────────────────────────┤
│  Personal Identity                          │
│  ┌─────────────────────────────────────────┐ │
│  │  18+ Age Verification    [✓ Verified]  │ │
│  │  Citizenship Status      [Get Now]     │ │
│  │  Identity Authenticity   [Get Now]     │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  Financial Identity                         │
│  ┌─────────────────────────────────────────┐ │
│  │  Income Verification     [Get Now]     │ │
│  │  Tax Compliance         [Get Now]      │ │
│  │  Bank Account Verified  [Get Now]      │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  [+ Add New Identity Type]                  │
└─────────────────────────────────────────────┘
```

---

### Phase 3: Document Country & Type Selection

#### Step 3.1: Country Selection
**Interface:**
```
Choose your document issuing country:
┌─────────────────────────────────────────────┐
│  Select Country [Dropdown]                  │
│  🇮🇳 India                                   │
│  🇦🇫 Afghanistan                            │
│  🇺🇸 United States                          │
│  🇬🇧 United Kingdom                         │
│  ... [Full country list]                   │
└─────────────────────────────────────────────┘
```

#### Step 3.2: Document Type Selection
**Country-Specific Options (Example: India):**
```
Select document type for verification:
┌─────────────────────────────────────────────┐
│  Valid government issued documents:         │
│                                             │
│  ○ National ID (Aadhaar)                    │
│    • Biometric verification                │
│    • Residence proof                       │
│    • Government database linkage           │
│                                             │
│  ○ PAN Card                                │
│    • Tax ID verification                   │
│    • Age verification                      │
│    • Income tax compliance                 │
│                                             │
│  ○ Passport                                │
│    • International identity                │
│    • Citizenship proof                     │
│    • Travel authorization                  │
│                                             │
│  ○ Driver's License                        │
│    • Age verification                      │
│    • Address proof                         │
│    • Driving authorization                 │
└─────────────────────────────────────────────┘
```

---

### Phase 4: Document Verification Process

#### Step 4.1: Real-Time Document Capture
**Camera Interface:**
```
┌─────────────────────────────────────────────┐
│            Document Capture                 │
├─────────────────────────────────────────────┤
│  [Camera View with document outline]       │
│                                             │
│  Instructions:                              │
│  • Place document within frame             │
│  • Ensure good lighting                    │
│  • Avoid glare or shadows                  │
│  • Keep camera steady                      │
│                                             │
│  [Capture Photo] [Retake]                  │
└─────────────────────────────────────────────┘
```

#### Step 4.2: Face Liveness Detection (if required)
**Biometric Capture:**
```
┌─────────────────────────────────────────────┐
│          Face Verification                  │
├─────────────────────────────────────────────┤
│  [Face detection camera view]              │
│                                             │
│  Please follow instructions:               │
│  • Look directly at camera                 │
│  • Blink when prompted                     │
│  • Turn head as directed                   │
│                                             │
│  [Continue] [Retry]                        │
└─────────────────────────────────────────────┘
```

#### Step 4.3: Start Verification Button
```
[Start Verification] ← User clicks to begin processing
```

---

### Phase 5: Data Review & Correction

#### Step 5.1: OCR Extraction Review
**Review Interface:**
```
┌─────────────────────────────────────────────┐
│        Review Extracted Details             │
├─────────────────────────────────────────────┤
│  Document Type: PAN Card                    │
│  ─────────────────────────────────────────  │
│  PAN Number:     [HJTPB9891M]    [Edit]    │
│  Full Name:      [Ashwin Balaguru] [Edit]  │
│  Date of Birth:  [27/10/2004]   [Edit]    │
│  Father's Name:  [Balaguru S]   [Edit]    │
│                                             │
│  Is this information correct?               │
│  [Yes, Continue] [Make Changes]            │
└─────────────────────────────────────────────┘
```

#### Step 5.2: OTP Verification (Aadhaar Only)
**For Aadhaar Documents:**
```
┌─────────────────────────────────────────────┐
│           OTP Verification                  │
├─────────────────────────────────────────────┤
│  OTP sent to: ****-****-XX34               │
│                                             │
│  Enter OTP: [____] [____] [____] [____]    │
│                                             │
│  Didn't receive? [Resend OTP]              │
│  [Verify OTP]                              │
└─────────────────────────────────────────────┘
```

---

### Phase 6: Enclave Processing & Verification

#### Step 6.1: Processing Status
**Loading Screen:**
```
┌─────────────────────────────────────────────┐
│          Verifying Your Identity            │
├─────────────────────────────────────────────┤
│  [Loading Animation]                        │
│                                             │
│  ✓ Document submitted to secure enclave    │
│  ⏳ Verifying with government database      │
│  ⏳ Generating cryptographic proof          │
│  ⏳ Creating blockchain attestation         │
│                                             │
│  This may take 30-60 seconds...            │
└─────────────────────────────────────────────┘
```

#### Step 6.2: Background Processing
**Technical Flow:**
1. Python backend sends verification request to Redis
2. Rust enclave consumes from Redis stream
3. Enclave authenticates with government API
4. Government verification performed (PAN/Aadhaar API)
5. Evidence hash generated from API response
6. Cryptographic signature created in enclave
7. NFT metadata prepared with blob reference
8. Results stored in MongoDB for claiming

---

### Phase 7: Verification Results & NFT Claiming

#### Step 7.1: Verification Success
**Success Screen:**
```
┌─────────────────────────────────────────────┐
│         Verification Successful! ✓         │
├─────────────────────────────────────────────┤
│  Your identity has been verified:           │
│                                             │
│  ✓ Age 18+ Confirmed                       │
│  ✓ Indian Citizenship Verified             │
│  ✓ Government Database Validated           │
│  ✓ Cryptographic Proof Generated           │
│                                             │
│  [Claim Your DID NFT]                      │
│                                             │
│  ℹ️ You can claim this anytime from your   │
│     dashboard if you leave now              │
└─────────────────────────────────────────────┘
```

#### Step 7.2: NFT Claiming Process
**Wallet Interaction:**
```
┌─────────────────────────────────────────────┐
│            Claim Your DID NFT               │
├─────────────────────────────────────────────┤
│  [NFT Preview - 18+ Badge]                 │
│                                             │
│  This NFT contains:                         │
│  • Verification proof                      │
│  • Cryptographic signature                 │
│  • Expiry date                            │
│  • Walrus blob reference                   │
│                                             │
│  Gas fee: ~0.001 SUI                      │
│                                             │
│  [Sign Transaction to Claim]               │
└─────────────────────────────────────────────┘
```

#### Step 7.3: Return to Protocol
**Completion Flow:**
```
NFT Claimed → Redirect to Protocol → Automatic verification → Access granted
```

---

## NFT Data Structure

### On-Chain NFT Fields:
```json
{
  "name": "18+ Age Verification",
  "description": "Verify user is 18 years or older using Aadhaar and face verification",
  "did_type": "1",
  "expiry_epoch": "1236",
  "signature_timestamp_ms": "1759049546236",
  "evidence_hash": "sha256_hash_of_government_response",
  "nautilus_signature": "enclave_cryptographic_signature",
  "blob_id": "Q7Xu68TAQMrCH8qQAudvVLFQ4jd-pSBgtQfNNlyc",
  "image_url": "https://imgs.search.brave.com/yP6T4k861JXcqslXHKA7c3fdXau70iuOP...",
  "minted_at": "1759029812528",
  "owner": "0x57bf2f621ffb6f11952c1da5e9...e51b3112a72ee6d2a9ea17424f7"
}
```

### MongoDB Backup Record:
```json
{
  "user_wallet": "0x57bf2f...",
  "verification_type": "pan_age_verification", 
  "government_response_hash": "evidence_hash_value",
  "walrus_blob_id": "Q7Xu68TAQMrCH8qQAudvVLFQ4jd-pSBgtQfNNlyc",
  "enclave_signature": "nautilus_signature",
  "nft_claimed": true,
  "created_at": "2025-01-19T10:30:00Z",
  "expiry_at": "2026-01-19T10:30:00Z"
}
```

---

## SDK Integration for Protocols

### Protocol Verification Code:
```javascript
import { SuiVerifySDK } from 'suiverify-sdk';

// Protocol checks user's DID
const userDID = await suiVerifySDK.getUserDID(userWallet, ["age_18+", "indian_citizenship"]);

if (userDID.verified && userDID.hasValidClaims(["age_18+"])) {
    // Grant access to age-restricted content
    allowAccess();
} else {
    // Redirect to SuiVerify for new DID
    redirectToSuiVerify();
}
```

### Government Compliance Access:
When authorities need access:
1. Government entity whitelisted in Seal protocol
2. Blob ID retrieved from NFT on-chain
3. Encrypted document fetched from Walrus using blob ID  
4. Document decrypted using Seal with government credentials
5. Full verification details available for audit

This flow maintains user privacy while ensuring regulatory compliance through the decentralized storage and encryption architecture.