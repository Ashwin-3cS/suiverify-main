# zkLogin Integration Fix - AddressSeed Mismatch Issue

## Problem
Transaction signing failed with error:
```
Invalid user signature: Required Signature from 0x[ADDRESS] is absent
```

Login worked fine, but transactions consistently failed on Sui Testnet.

## Root Cause
**Address/Signature Mismatch:**
- Address was computed using **local salt** via `jwtToAddress(jwt, userSalt)`
- zkProof from Enoki contained **Enoki's addressSeed** (from Mysten's salt service)
- Transaction sender used local salt address: `0xe4ab...`
- But signature validated against Enoki's addressSeed: Different address!

**Why the mismatch?**
When using Enoki's ZKP service (`https://api.enoki.mystenlabs.com/v1/zklogin/zkp`), Enoki generates the proof with their own salt service internally. The proof's `addressSeed` is cryptographically tied to their salt, not ours.

## Solution

### 1. Compute Address from Enoki's AddressSeed
**File:** `lib/zklogin.ts:521-546`

```typescript
// After generating zkProof from Enoki
if (zkProof.addressSeed) {
  // Decode JWT to get issuer
  const decodedJWT = this.decodeJWT(jwtToken);

  // Compute address from Enoki's addressSeed + issuer
  address = computeZkLoginAddressFromSeed(
    BigInt(zkProof.addressSeed),
    decodedJWT.iss!  // ⚠️ Use JWT issuer, not "sub"!
  );
}
```

**Key Fix:** Pass `decodedJWT.iss` (e.g., `"https://accounts.google.com"`), NOT `"sub"`.

### 2. Remove Address Verification Check
**File:** `components/zklogin/ZkLoginTransactionTest.tsx:102-105`

Removed the check that recomputed address with local salt, as it would always fail with Enoki's addressSeed.

## Key Takeaways

1. **When using Enoki's ZKP service:** The address MUST be derived from Enoki's `addressSeed` in the proof
2. **Don't generate your own salt:** Enoki handles salt internally - use their `addressSeed`
3. **`computeZkLoginAddressFromSeed()` signature:** `(addressSeed: bigint, iss: string)` - requires JWT issuer
4. **"ADDRESS SEED MISMATCH" warning is expected** when using Enoki - the code correctly uses Enoki's addressSeed despite the warning

## Verification
After fix:
- Login: ✅ Works
- Address: `0xcedb...2f79` (derived from Enoki's addressSeed)
- Transaction: ✅ Succeeds on Testnet
- Check balance: `https://suiscan.xyz/testnet/account/[ADDRESS]`

## Environment Variables Required
```env
NEXT_PUBLIC_ENOKI_NONCE_URL=https://api.enoki.mystenlabs.com/v1/zklogin/nonce
NEXT_PUBLIC_ENOKI_ZKP_URL=https://api.enoki.mystenlabs.com/v1/zklogin/zkp
NEXT_PUBLIC_ENOKI_API_KEY=[YOUR_KEY]
```

**No Mysten salt service needed** - Enoki provides addressSeed in zkProof response.
