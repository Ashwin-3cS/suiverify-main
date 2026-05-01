/* eslint-disable @typescript-eslint/no-explicit-any */

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { logger } from '@/lib/logger';
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
  getZkLoginSignature,
  genAddressSeed,
  computeZkLoginAddressFromSeed,
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
   * Uses Enoki API for nonce generation on testnet
   */
  static async initializeSession(): Promise<{
    ephemeralKeyPair: Ed25519Keypair;
    nonce: string;
    randomness: string;
    maxEpoch: number;
    userSalt: string;
  }> {
    logger.log(" Initializing new session...");

    // Generate ephemeral key pair
    const ephemeralKeyPair = new Ed25519Keypair();

    // Generate a consistent user salt (will be finalized with JWT email later)
    let userSalt = localStorage.getItem("userSalt");
    if (!userSalt) {
      // Temporary salt - will be replaced with email-derived salt
      userSalt = generateRandomness();
      localStorage.setItem("userSalt", userSalt);
    }

    // Get nonce from Enoki API
    // Use toSuiPublicKey() which serializes with the Ed25519 flag (0x00) that Enoki expects
    const ephemeralPublicKeyBase64 = ephemeralKeyPair
      .getPublicKey()
      .toSuiPublicKey();

    logger.log(" Requesting nonce from Enoki API...");
    const nonceResponse = await fetch(
      process.env.NEXT_PUBLIC_ENOKI_NONCE_URL!,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ENOKI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          network: "testnet",
          ephemeralPublicKey: ephemeralPublicKeyBase64,
          additionalEpochs: 2, // Valid for 2 epochs
        }),
      }
    );

    if (!nonceResponse.ok) {
      const errorText = await nonceResponse.text();
      logger.error("Enoki nonce API error:", errorText);
      throw new Error(
        `Failed to get nonce from Enoki: ${nonceResponse.status}`
      );
    }

    const nonceData = await nonceResponse.json();
    const { nonce, randomness, maxEpoch } = nonceData.data;

    logger.log("=== Session Initialization ===");
    logger.log("Nonce generated:", nonce);
    logger.log("Max epoch:", maxEpoch);
    logger.log("Randomness:", randomness);

    // Get the secret key as Bech32 string (suiprivkey1...)
    const secretKey = ephemeralKeyPair.getSecretKey();
    logger.log("Secret key (Bech32):", secretKey.substring(0, 20) + "...");

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
    logger.log(" Session stored successfully");
    logger.log("Stored nonce:", parsed.nonce);

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
      logger.log(" Session loaded:");
      logger.log("  - Has key:", !!session.ephemeralPrivateKey);
      logger.log("  - Nonce:", session.nonce);
      logger.log("  - Max epoch:", session.maxEpoch);
      logger.log("  - Randomness:", session.randomness);
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Compute zkLogin address from JWT
   */
  static computeAddress(jwtToken: string, userSalt: string): string {
    try {
      const address = jwtToAddress(jwtToken, userSalt);
      logger.log(" Computed zkLogin address:", address);
      logger.log("  Using salt:", userSalt);
      return address;
    } catch (error) {
      logger.error(" Failed to compute address:", error);
      logger.error("  JWT token (first 50 chars):", jwtToken.substring(0, 50));
      logger.error("  User salt:", userSalt);
      throw error;
    }
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
    logger.log("=== Recreating KeyPair ===");
    logger.log("Bech32 key:", secretKeyBech32.substring(0, 20) + "...");

    // Create keypair from Bech32 secret key string
    const keypair = Ed25519Keypair.fromSecretKey(secretKeyBech32);

    // Verify the public key
    const publicKey = keypair.getPublicKey();
    logger.log("Recreated public key:", publicKey.toSuiAddress());
    logger.log(" KeyPair recreated successfully");

    return keypair;
  }

  /**
   * Generate ZK Proof via Enoki API
   * Uses the Enoki zkLogin ZKP endpoint for testnet
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

    logger.log("=== Generating ZK Proof via Enoki API ===");
    logger.log("Using randomness:", randomness);
    logger.log("Using maxEpoch:", maxEpoch);

    // Get serialized ephemeral public key (same format as nonce endpoint)
    const ephemeralPublicKeyBase64 = ephemeralKeyPair
      .getPublicKey()
      .toSuiPublicKey();

    logger.log("Ephemeral public key (Base64):", ephemeralPublicKeyBase64);

    // Decode JWT to verify nonce
    const decodedJWT = this.decodeJWT(jwtToken);
    logger.log("JWT nonce:", decodedJWT.nonce);

    // Verify the nonce matches what we expect
    const expectedNonce = generateNonce(
      ephemeralKeyPair.getPublicKey(),
      maxEpoch,
      randomness
    );
    logger.log("Expected nonce (recalculated):", expectedNonce);
    logger.log("JWT nonce:", decodedJWT.nonce);
    logger.log("Nonces match:", expectedNonce === decodedJWT.nonce);

    if (expectedNonce !== decodedJWT.nonce) {
      logger.error(" NONCE MISMATCH!");
      logger.error("Expected:", expectedNonce);
      logger.error("Got:", decodedJWT.nonce);
      logger.error("Randomness used:", randomness);
      logger.error("MaxEpoch used:", maxEpoch);

      throw new Error(
        `Nonce mismatch! Expected: ${expectedNonce}, Got: ${decodedJWT.nonce}. ` +
          `This means the ephemeral keypair was not restored correctly. Please restart the flow.`
      );
    }

    logger.log(" Nonce verification passed!");

    logger.log(
      " Sending ZKP request to Enoki API:",
      process.env.NEXT_PUBLIC_ENOKI_ZKP_URL
    );

    // Call Enoki ZKP service
    const response = await fetch(process.env.NEXT_PUBLIC_ENOKI_ZKP_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_ENOKI_API_KEY}`,
        "Content-Type": "application/json",
        "zklogin-jwt": jwtToken,
      },
      body: JSON.stringify({
        network: "testnet",
        ephemeralPublicKey: ephemeralPublicKeyBase64,
        maxEpoch: maxEpoch,
        randomness: randomness,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Enoki ZKP API error response:", errorText);
      throw new Error(
        `Enoki ZKP service error: ${response.status} - ${errorText}`
      );
    }

    const zkpData = await response.json();
    logger.log(" ZK Proof received successfully from Enoki");

    // Enoki returns the proof in a data wrapper
    return zkpData.data || zkpData;
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
    logger.log("=== Creating zkLogin Signature ===");
    logger.log("zkProof keys:", Object.keys(params.zkProof));
    logger.log("maxEpoch:", params.maxEpoch);
    logger.log("ephemeralSignature type:", typeof params.ephemeralSignature);

    try {
      // Decode JWT to get claim info
      const decodedJWT = this.decodeJWT(params.jwtToken);

      // Handle aud field - it can be string or array
      // Google OAuth typically returns string, but handle both cases
      const aud = Array.isArray(decodedJWT.aud)
        ? decodedJWT.aud[0] // Use first element if array
        : decodedJWT.aud; // Use as-is if string

      logger.log("JWT aud (normalized):", aud);
      logger.log("JWT sub:", decodedJWT.sub);
      logger.log("User salt:", params.userSalt);

      // Log Enoki's addressSeed (if present)
      if (params.zkProof.addressSeed) {
        logger.log(" Enoki's addressSeed:", params.zkProof.addressSeed);
      }

      // IMPORTANT: Extract only the proof components, NOT the addressSeed from Enoki
      // Enoki might include an addressSeed computed with a different salt
      const partialZkProof = {
        proofPoints: params.zkProof.proofPoints,
        issBase64Details: params.zkProof.issBase64Details,
        headerBase64: params.zkProof.headerBase64,
      };

      // Compute addressSeed from JWT and salt using OUR salt
      const ourAddressSeed = genAddressSeed(
        BigInt(params.userSalt),
        "sub", // claim name
        decodedJWT.sub, // claim value
        aud // normalized aud (string, not array)
      ).toString();

      logger.log(" Our computed addressSeed:", ourAddressSeed);

      // Note: Enoki's addressSeed may differ from ours (expected - Enoki uses Mysten's salt service)
      if (params.zkProof.addressSeed && params.zkProof.addressSeed !== ourAddressSeed) {
        logger.log("ℹ Using Enoki's addressSeed (expected behavior)");
      }

      // CRITICAL: ALWAYS use Enoki's addressSeed if present
      // The Groth16 proof is cryptographically tied to Enoki's addressSeed
      // Changing it will cause "Groth16 proof verify failed" error
      const finalAddressSeed = params.zkProof.addressSeed || ourAddressSeed;

      if (params.zkProof.addressSeed && params.zkProof.addressSeed !== ourAddressSeed) {
        logger.warn("  USING ENOKI'S ADDRESSSEED (proof is tied to it)");
        logger.warn("   Enoki's:", params.zkProof.addressSeed);
        logger.warn("   Ours:    ", ourAddressSeed);
        logger.warn("   This is expected - Enoki uses Mysten's salt service");
      } else {
        logger.log(" Using addressSeed:", finalAddressSeed);
      }

      // Create complete zkProof with the final addressSeed
      const completeZkProof = {
        ...partialZkProof,
        addressSeed: finalAddressSeed,
      };

      logger.log(
        "Complete zkProof with addressSeed:",
        Object.keys(completeZkProof)
      );

      const signature = getZkLoginSignature({
        inputs: completeZkProof,
        maxEpoch: params.maxEpoch,
        userSignature: params.ephemeralSignature,
      });

      logger.log(" zkLogin signature created successfully");
      return signature;
    } catch (error) {
      logger.error(" Failed to create zkLogin signature:", error);
      logger.error(
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
    logger.log(" Session cleared");
  }

  /**
   * Extract salt from Enoki's zkProof addressSeed
   * Enoki computes the addressSeed using Mysten's salt service
   * We extract the salt by reverse-engineering from the addressSeed
   * NOTE: This is a workaround to avoid CORS issues with Mysten's salt service
   */
  static deriveSaltFromJWT(jwtToken: string): string {
    const decodedJWT = this.decodeJWT(jwtToken);
    logger.log(" Deriving deterministic salt from email:", decodedJWT.email);

    // Use email to create a deterministic salt
    // This ensures same email = same salt = same address across devices
    const emailBytes = new TextEncoder().encode(decodedJWT.email);

    let hash = 0;
    for (let i = 0; i < emailBytes.length; i++) {
      hash = (hash << 5) - hash + emailBytes[i];
      hash = hash & hash; // Keep it within 32-bit bounds
    }

    const salt = Math.abs(hash).toString();
    logger.log(" Deterministic salt created:", salt);
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
    logger.log("=== Starting Streamlined zkLogin Flow ===");

    // Decode JWT first to get email
    const decodedJWT = this.decodeJWT(jwtToken);
    logger.log(" Email:", decodedJWT.email);

    // Derive salt from email (deterministic across devices)
    const userSalt = this.deriveSaltFromJWT(jwtToken);

    //  CHECK 1: Is this user already logged in (cached proof exists)?
    const cachedProof = SessionManager.getCachedProof();
    if (
      cachedProof &&
      cachedProof.userSalt === userSalt &&
      cachedProof.ephemeralPrivateKey &&
      cachedProof.randomness
    ) {
      logger.log(" EXISTING USER - Using cached data");
      logger.log(
        " Cached proof still valid (",
        SessionManager.getFormattedTTL() + ")"
      );
      logger.log(" Same email → Same address:", cachedProof.address);

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

    logger.log("🆕 NEW USER - Generating fresh proof");

    // Load or create session
    let session = this.loadSession();
    if (!session) {
      logger.log(" Creating new session...");
      const initResult = await this.initializeSession();
      session = {
        ephemeralPrivateKey: initResult.ephemeralKeyPair.getSecretKey(),
        randomness: initResult.randomness,
        maxEpoch: initResult.maxEpoch.toString(),
        userSalt: userSalt, // ← Use email-derived salt (deterministic)
        nonce: initResult.nonce,
      };
      SessionManager.saveSession(session);
    } else {
      // Update session with user salt for consistency
      session.userSalt = userSalt;
      SessionManager.saveSession(session);
    }

    // Recreate ephemeral key pair
    const ephemeralKeyPair = this.recreateKeyPair(session.ephemeralPrivateKey);

    // Generate ZK Proof
    logger.log(" Generating ZK proof...");
    const zkProof = await this.generateZkProof({
      jwtToken,
      ephemeralKeyPair,
      randomness: session.randomness,
      maxEpoch: parseInt(session.maxEpoch),
      userSalt: session.userSalt,
    });

    logger.log(" ZK Proof generated successfully");

    // CRITICAL: Compute address from Enoki's addressSeed (if present)
    // The zkProof is cryptographically tied to Enoki's addressSeed
    // We MUST use the address derived from that addressSeed, not our local salt
    let address: string;
    if (zkProof.addressSeed) {
      logger.log(" Computing address from Enoki's addressSeed...");
      logger.log("  Enoki's addressSeed:", zkProof.addressSeed);

      // Decode JWT to get the issuer (iss) - required for address computation
      const decodedJWT = this.decodeJWT(jwtToken);
      logger.log("  JWT issuer:", decodedJWT.iss);

      // Compute address from Enoki's addressSeed + issuer
      // The issuer (iss) is needed to derive the correct zkLogin address
      address = computeZkLoginAddressFromSeed(
        BigInt(zkProof.addressSeed),
        decodedJWT.iss! // Use the issuer from JWT, not "sub"
      );
      logger.log(" Address computed from Enoki's addressSeed:", address);
      logger.log(" This address matches the zkProof and will work for transactions");
    } else {
      // Fallback: compute with user salt (for non-Enoki flows)
      logger.log(" No addressSeed in proof, using local salt");
      address = this.computeAddress(jwtToken, session.userSalt);
      logger.log(" Address computed from local salt:", address);
    }

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

    logger.log(" NEW USER REGISTERED");
    logger.log(" Email:", decodedJWT.email);
    logger.log(" Address:", address);
    logger.log("⏰ Proof cached for 24h");

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
