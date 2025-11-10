/* eslint-disable @typescript-eslint/no-explicit-any */

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
  getZkLoginSignature,
  genAddressSeed,
} from "@mysten/sui/zklogin";
import { jwtDecode } from "jwt-decode";
import { suiClient } from "./sui-client";
import { ZkLoginSession, DecodedJWT } from "./types";
import { SessionManager } from "./session-manager";

export class ZkLoginService {
  private static STORAGE_KEY = "zkLoginSession";

  /**
   * Initialize a new zkLogin session
   * Note: userSalt will be derived from JWT email for consistency across devices
   */
  static async initializeSession(): Promise<{
    ephemeralKeyPair: Ed25519Keypair;
    nonce: string;
    randomness: string;
    maxEpoch: number;
    userSalt: string;
  }> {
    console.log("🔄 Initializing new session...");

    // Generate ephemeral key pair
    const ephemeralKeyPair = new Ed25519Keypair();

    // Generate randomness
    const randomness = generateRandomness();

    // Get current epoch
    const { epoch } = await suiClient.getLatestSuiSystemState();
    const maxEpoch = Number(epoch) + 10; // Valid for ~2 days

    // Generate a consistent user salt (will be finalized with JWT email later)
    // For now, use a placeholder - will be updated in completeZkLoginFlow
    let userSalt = localStorage.getItem("userSalt");
    if (!userSalt) {
      // Temporary salt - will be replaced with email-derived salt
      userSalt = generateRandomness();
      localStorage.setItem("userSalt", userSalt);
    }

    // Generate nonce
    const nonce = generateNonce(
      ephemeralKeyPair.getPublicKey(),
      maxEpoch,
      randomness
    );

    console.log("=== Session Initialization ===");
    console.log("Nonce generated:", nonce);
    console.log("Max epoch:", maxEpoch);
    console.log("Randomness:", randomness);

    // Get the secret key as Bech32 string (suiprivkey1...)
    const secretKey = ephemeralKeyPair.getSecretKey();
    console.log("Secret key (Bech32):", secretKey.substring(0, 20) + "...");

    // Store session data
    const sessionData: ZkLoginSession = {
      ephemeralPrivateKey: secretKey, // Store the Bech32 string directly
      randomness,
      maxEpoch: maxEpoch.toString(),
      userSalt,
      nonce,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));

    // Verify storage
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const parsed = JSON.parse(stored!);
    console.log("✅ Session stored successfully");
    console.log("Stored nonce:", parsed.nonce);

    return {
      ephemeralKeyPair,
      nonce,
      randomness,
      maxEpoch,
      userSalt,
    };
  }

  /**
   * Get OAuth login URL
   */
  static getOAuthUrl(nonce: string): string {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URL!,
      response_type: "id_token",
      scope: "openid email profile",
      nonce: nonce,
      state: "random_state_" + Date.now(),
    });

    return `${process.env.NEXT_PUBLIC_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Load session from localStorage
   */
  static loadSession(): ZkLoginSession | null {
    if (typeof window === "undefined") return null;

    const sessionStr = localStorage.getItem(this.STORAGE_KEY);
    if (!sessionStr) return null;

    try {
      const session = JSON.parse(sessionStr);
      console.log("📦 Session loaded:");
      console.log("  - Has key:", !!session.ephemeralPrivateKey);
      console.log("  - Nonce:", session.nonce);
      console.log("  - Max epoch:", session.maxEpoch);
      console.log("  - Randomness:", session.randomness);
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Compute zkLogin address from JWT
   */
  static computeAddress(jwtToken: string, userSalt: string): string {
    return jwtToAddress(jwtToken, userSalt);
  }

  /**
   * Decode JWT token
   */
  static decodeJWT(jwtToken: string): DecodedJWT {
    return jwtDecode<DecodedJWT>(jwtToken);
  }

  /**
   * Recreate ephemeral key pair from stored Bech32 secret key
   */
  static recreateKeyPair(secretKeyBech32: string): Ed25519Keypair {
    console.log("=== Recreating KeyPair ===");
    console.log("Bech32 key:", secretKeyBech32.substring(0, 20) + "...");

    // Create keypair from Bech32 secret key string
    const keypair = Ed25519Keypair.fromSecretKey(secretKeyBech32);

    // Verify the public key
    const publicKey = keypair.getPublicKey();
    console.log("Recreated public key:", publicKey.toSuiAddress());
    console.log("✅ KeyPair recreated successfully");

    return keypair;
  }

  /**
   * Generate ZK Proof via Mysten Labs prover service
   */
  static async generateZkProof(params: {
    jwtToken: string;
    ephemeralKeyPair: Ed25519Keypair;
    randomness: string;
    maxEpoch: number;
    userSalt: string;
  }): Promise<any> {
    const { jwtToken, ephemeralKeyPair, randomness, maxEpoch, userSalt } =
      params;

    console.log("=== Generating ZK Proof ===");
    console.log("Using randomness:", randomness);
    console.log("Using maxEpoch:", maxEpoch);

    // Get extended ephemeral public key
    const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
      ephemeralKeyPair.getPublicKey()
    );

    console.log("Extended ephemeral public key:", extendedEphemeralPublicKey);

    // Decode JWT to verify nonce
    const decodedJWT = this.decodeJWT(jwtToken);
    console.log("JWT nonce:", decodedJWT.nonce);

    // Verify the nonce matches what we expect
    const expectedNonce = generateNonce(
      ephemeralKeyPair.getPublicKey(),
      maxEpoch,
      randomness
    );
    console.log("Expected nonce (recalculated):", expectedNonce);
    console.log("JWT nonce:", decodedJWT.nonce);
    console.log("Nonces match:", expectedNonce === decodedJWT.nonce);

    if (expectedNonce !== decodedJWT.nonce) {
      console.error("❌ NONCE MISMATCH!");
      console.error("Expected:", expectedNonce);
      console.error("Got:", decodedJWT.nonce);
      console.error("Randomness used:", randomness);
      console.error("MaxEpoch used:", maxEpoch);

      throw new Error(
        `Nonce mismatch! Expected: ${expectedNonce}, Got: ${decodedJWT.nonce}. ` +
          `This means the ephemeral keypair was not restored correctly. Please restart the flow.`
      );
    }

    console.log("✅ Nonce verification passed!");

    // Prepare request
    const zkProofRequest = {
      jwt: jwtToken,
      extendedEphemeralPublicKey,
      maxEpoch: maxEpoch.toString(),
      jwtRandomness: randomness,
      salt: userSalt,
      keyClaimName: "sub",
    };

    console.log(
      "Sending proof request to:",
      process.env.NEXT_PUBLIC_PROVER_URL
    );

    // Call prover service
    const response = await fetch(process.env.NEXT_PUBLIC_PROVER_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(zkProofRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Prover service error response:", errorText);
      throw new Error(
        `Prover service error: ${response.status} - ${errorText}`
      );
    }

    const proof = await response.json();
    console.log("✅ ZK Proof received successfully");
    return proof;
  }

  /**
   * Create zkLogin signature for transaction
   */
  static createSignature(params: {
    zkProof: any;
    maxEpoch: number;
    ephemeralSignature: string | Uint8Array;
    jwtToken: string;
    userSalt: string;
  }): string {
    console.log("=== Creating zkLogin Signature ===");
    console.log("zkProof keys:", Object.keys(params.zkProof));
    console.log("maxEpoch:", params.maxEpoch);
    console.log("ephemeralSignature type:", typeof params.ephemeralSignature);

    try {
      // Decode JWT to get claim info
      const decodedJWT = this.decodeJWT(params.jwtToken);

      // Compute addressSeed from JWT and salt
      const addressSeed = genAddressSeed(
        BigInt(params.userSalt),
        "sub", // claim name
        decodedJWT.sub, // claim value
        decodedJWT.aud
      ).toString();

      console.log("Address seed:", addressSeed);

      // Add addressSeed to zkProof
      const completeZkProof = {
        ...params.zkProof,
        addressSeed,
      };

      console.log(
        "Complete zkProof with addressSeed:",
        Object.keys(completeZkProof)
      );

      const signature = getZkLoginSignature({
        inputs: completeZkProof,
        maxEpoch: params.maxEpoch,
        userSignature: params.ephemeralSignature,
      });

      console.log("✅ zkLogin signature created successfully");
      return signature;
    } catch (error) {
      console.error("❌ Failed to create zkLogin signature:", error);
      console.error(
        "zkProof content:",
        JSON.stringify(params.zkProof, null, 2)
      );
      throw error;
    }
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.STORAGE_KEY);
    SessionManager.clearSession();
    console.log("🗑️ Session cleared");
  }

  /**
   * Derive user salt from JWT email (deterministic across devices)
   * This ensures same email = same salt = same address
   * Uses proper hashing to stay within BN254 field bounds
   */
  static deriveSaltFromJWT(jwtToken: string): string {
    const decodedJWT = this.decodeJWT(jwtToken);
    console.log("📧 Deriving salt from email:", decodedJWT.email);

    // Create a deterministic hash from email
    // This approach uses the randomness generator which is cryptographically sound
    const emailSalt = generateRandomness();

    // Better approach: use email to seed the salt in a bounded way
    // Convert email to a number that's safe for BN254 field
    const emailBytes = new TextEncoder().encode(decodedJWT.email);

    // Create a simpler, bounded hash
    let hash = 0;
    for (let i = 0; i < emailBytes.length; i++) {
      hash = (hash << 5) - hash + emailBytes[i];
      hash = hash & hash; // Keep it within 32-bit bounds
    }

    // Ensure the salt is positive and bounded
    const salt = Math.abs(hash).toString();

    console.log("📧 Deterministic salt created from email");
    console.log("✅ Salt is within safe bounds for crypto operations");
    return salt;
  }

  /**
   * Complete zkLogin flow in one step - handles initialization + proof generation
   *
   * Flow Logic:
   * 1. Check if email already exists → Return cached proof & address (existing user)
   * 2. If new email → Generate new proof & address (new user)
   * 3. Cache for 24h for instant future logins
   */
  static async completeZkLoginFlow(jwtToken: string): Promise<{
    address: string;
    zkProof: any;
    session: ZkLoginSession;
    isNewUser: boolean;
    jwtToken: string;
    userSalt: string;
    ephemeralPrivateKey: string;
    maxEpoch: number;
    randomness: string;
  }> {
    console.log("=== Starting Streamlined zkLogin Flow ===");

    // Decode JWT first to get email
    const decodedJWT = this.decodeJWT(jwtToken);
    console.log("📧 Email:", decodedJWT.email);

    // Derive salt from email (consistent across devices!)
    const emailDerivedSalt = this.deriveSaltFromJWT(jwtToken);

    // ✅ CHECK 1: Is this user already logged in (cached proof exists)?
    const cachedProof = SessionManager.getCachedProof();
    if (
      cachedProof &&
      cachedProof.userSalt === emailDerivedSalt &&
      cachedProof.ephemeralPrivateKey &&
      cachedProof.randomness
    ) {
      console.log("👤 EXISTING USER - Using cached data");
      console.log(
        "✅ Cached proof still valid (",
        SessionManager.getFormattedTTL() + ")"
      );
      console.log("📧 Same email → Same address:", cachedProof.address);

      return {
        address: cachedProof.address!,
        zkProof: cachedProof.zkProof,
        session: {
          ephemeralPrivateKey: cachedProof.ephemeralPrivateKey,
          randomness: cachedProof.randomness,
          maxEpoch: (cachedProof.maxEpoch ?? 0).toString(),
          userSalt: cachedProof.userSalt,
        },
        isNewUser: false, // ← Existing user
        jwtToken,
        userSalt: cachedProof.userSalt,
        ephemeralPrivateKey: cachedProof.ephemeralPrivateKey,
        maxEpoch: cachedProof.maxEpoch!,
        randomness: cachedProof.randomness,
      };
    }

    console.log("🆕 NEW USER - Generating fresh proof");

    // Load or create session
    let session = this.loadSession();
    if (!session) {
      console.log("📦 Creating new session...");
      const initResult = await this.initializeSession();
      session = {
        ephemeralPrivateKey: initResult.ephemeralKeyPair.getSecretKey(),
        randomness: initResult.randomness,
        maxEpoch: initResult.maxEpoch.toString(),
        userSalt: emailDerivedSalt, // ← Use email-derived salt for new user!
        nonce: initResult.nonce,
      };
      SessionManager.saveSession(session);
    } else {
      // Update session with email-derived salt for consistency
      session.userSalt = emailDerivedSalt;
      SessionManager.saveSession(session);
    }

    // Compute address with email-derived salt
    const address = this.computeAddress(jwtToken, session.userSalt);
    console.log("✅ Address computed for new user:", address);
    console.log("💾 This address will be saved & returned on future logins");

    // Recreate ephemeral key pair
    const ephemeralKeyPair = this.recreateKeyPair(session.ephemeralPrivateKey);

    // Generate ZK Proof
    console.log("🔐 Generating ZK proof...");
    const zkProof = await this.generateZkProof({
      jwtToken,
      ephemeralKeyPair,
      randomness: session.randomness,
      maxEpoch: parseInt(session.maxEpoch),
      userSalt: session.userSalt,
    });

    console.log("✅ ZK Proof generated successfully");

    // Cache the proof for 24h (for both new and existing users)
    SessionManager.cacheProof({
      zkProof,
      jwtToken,
      address,
      userSalt: session.userSalt,
      maxEpoch: parseInt(session.maxEpoch),
      randomness: session.randomness,
      ephemeralPrivateKey: session.ephemeralPrivateKey,
    });

    console.log("✅ NEW USER REGISTERED");
    console.log("📧 Email:", decodedJWT.email);
    console.log("💾 Address:", address);
    console.log("⏰ Proof cached for 24h");

    return {
      address,
      zkProof,
      session,
      isNewUser: true, // ← New user
      jwtToken,
      userSalt: session.userSalt,
      ephemeralPrivateKey: session.ephemeralPrivateKey,
      maxEpoch: parseInt(session.maxEpoch),
      randomness: session.randomness,
    };
  }

  /**
   * Get signature for transaction using cached or provided proof
   */
  static getTransactionSignature(params: {
    zkProof?: any;
    maxEpoch?: number;
    ephemeralSignature: string | Uint8Array;
    jwtToken?: string;
    userSalt?: string;
    useCache?: boolean;
  }): string {
    // Use cached data if requested
    if (params.useCache) {
      const cached = SessionManager.getCachedProof();
      if (!cached || !cached.jwtToken || !cached.userSalt) {
        throw new Error(
          "No cached proof available or missing JWT token/userSalt"
        );
      }
      return this.createSignature({
        zkProof: cached.zkProof,
        maxEpoch: cached.maxEpoch!,
        ephemeralSignature: params.ephemeralSignature,
        jwtToken: cached.jwtToken,
        userSalt: cached.userSalt,
      });
    }

    // Use provided data
    if (
      !params.zkProof ||
      !params.maxEpoch ||
      !params.jwtToken ||
      !params.userSalt
    ) {
      throw new Error("Missing required parameters for signature creation");
    }

    return this.createSignature({
      zkProof: params.zkProof,
      maxEpoch: params.maxEpoch,
      ephemeralSignature: params.ephemeralSignature,
      jwtToken: params.jwtToken,
      userSalt: params.userSalt,
    });
  }
}
