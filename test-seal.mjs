// Simple Seal SDK encryption test
// Uses Ruby Nodes paid server + SuiVerify testnet package

import { SuiClient } from '@mysten/sui/client';
import { SealClient } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';

const RPC_URL = 'https://fullnode.testnet.sui.io';
const PACKAGE_ID = '0x6ec40d30e636afb906e621748ee60a9b72bc59a39325adda43deadd28dc89e09';
const GOVERNMENT_WHITELIST_ID = '0x5db149489d68ece83a08559773a1d1f898e4fa4b31d9807b7bb24c88dc8ffb26';

// Ruby Nodes paid server (from .env)
const SEAL_API_KEY = 'bjg9QeWnqMLTM8P4fVo4LiVuTFt7IeN0Rj7k069J';
const SEAL_URL = 'https://free-eu-central-1.api.rubynodes.io';
const RUBY_NODES_OBJECT_ID = '0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2';

const suiClient = new SuiClient({ url: RPC_URL });

const sealClient = new SealClient({
  suiClient,
  serverConfigs: [
    {
      objectId: RUBY_NODES_OBJECT_ID,
      weight: 1,
      apiKeyName: 'X-API-Key',
      apiKey: SEAL_API_KEY,
    },
  ],
  verifyKeyServers: false,
});

async function main() {
  const testString = 'Hello SuiVerify — Seal encryption test';
  console.log('Input:', testString);

  // Build encryption ID same way encryptionService does
  const nonce = new Uint8Array(5);
  crypto.getRandomValues(nonce);
  const policyObjectBytes = fromHex(GOVERNMENT_WHITELIST_ID);
  const encryptionId = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
  console.log('Encryption ID:', encryptionId);

  const data = new TextEncoder().encode(testString);

  console.log('\nEncrypting...');
  const { encryptedObject } = await sealClient.encrypt({
    threshold: 1,
    packageId: PACKAGE_ID,
    id: encryptionId,
    data,
  });

  console.log('Encrypted bytes:', encryptedObject.length);
  console.log('First 32 bytes (hex):', toHex(encryptedObject.slice(0, 32)));
  console.log('\nEncryption succeeded.');
}

main().catch((err) => {
  console.error('Error:', err?.message ?? err);
  process.exit(1);
});
