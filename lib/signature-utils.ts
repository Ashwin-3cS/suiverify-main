/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Signature utilities for zkLogin validation and debugging
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Ensure signature is in string format (Sui standard)
 */
export function ensureSignatureString(
  signature: string | Uint8Array | Buffer
): string {
  if (typeof signature === "string") {
    return signature;
  }

  // Convert Uint8Array or Buffer to base64
  try {
    const buffer = Buffer.isBuffer(signature)
      ? signature
      : Buffer.from(signature);
    return buffer.toString("base64");
  } catch (error) {
    console.error("Failed to convert signature to string:", error);
    throw new Error(
      "Invalid signature format - could not convert to string"
    );
  }
}

/**
 * Validate ZK Proof structure
 */
export function validateZkProof(proof: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!proof) {
    return {
      valid: false,
      errors: ["ZK Proof is null or undefined"],
      warnings: [],
    };
  }

  // Required fields
  const requiredFields = [
    "addressSeed",
    "claim",
    "claimValue",
    "issBase64Details",
    "headerBase64",
    "proofPoints",
  ];

  for (const field of requiredFields) {
    if (!proof[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check issBase64Details structure
  if (proof.issBase64Details) {
    if (!proof.issBase64Details.iss) {
      errors.push("issBase64Details missing 'iss' field");
    }
    if (!proof.issBase64Details.issBase64) {
      errors.push("issBase64Details missing 'issBase64' field");
    }
  }

  // Check proofPoints structure
  if (proof.proofPoints) {
    if (
      !proof.proofPoints.A ||
      !proof.proofPoints.B ||
      !proof.proofPoints.C
    ) {
      errors.push("proofPoints missing A, B, or C fields");
    }
  }

  // Warnings
  if (typeof proof.addressSeed !== "string") {
    warnings.push("addressSeed should be a string");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate zkLogin session
 */
export function validateSession(session: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!session) {
    return {
      valid: false,
      errors: ["Session is null or undefined"],
      warnings: [],
    };
  }

  // Required fields
  const requiredFields = [
    "ephemeralPrivateKey",
    "randomness",
    "maxEpoch",
    "userSalt",
    "nonce",
  ];

  for (const field of requiredFields) {
    if (!session[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate maxEpoch
  if (session.maxEpoch) {
    const maxEpoch = parseInt(session.maxEpoch);
    if (isNaN(maxEpoch)) {
      errors.push("maxEpoch is not a valid number");
    } else {
      // Approximate current epoch (Sui epoch ~60 seconds)
      // For testing, we'll be lenient
      const currentEpoch = Math.floor(Date.now() / 1000 / 60);
      if (currentEpoch > maxEpoch) {
        errors.push(
          `Session expired - maxEpoch (${maxEpoch}) has passed (current: ${currentEpoch})`
        );
      } else if (currentEpoch > maxEpoch - 5) {
        warnings.push(`Session expiring soon - only ${maxEpoch - currentEpoch} epochs left`);
      }
    }
  }

  // Validate nonce format (should be base64)
  if (session.nonce) {
    if (!/^[A-Za-z0-9+/=]+$/.test(session.nonce)) {
      warnings.push("Nonce doesn't appear to be valid base64");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Passkey Session
 */
export function validatePasskeySession(session: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!session) {
    return {
      valid: false,
      errors: ["Passkey session is null or undefined"],
      warnings: [],
    };
  }

  // Required fields
  const requiredFields = ["publicKeyBase64", "createdAt", "rpId"];

  for (const field of requiredFields) {
    if (!session[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate publicKeyBase64 is base64
  if (session.publicKeyBase64) {
    if (!/^[A-Za-z0-9+/=]+$/.test(session.publicKeyBase64)) {
      errors.push("publicKeyBase64 is not valid base64");
    }
  }

  // Validate createdAt is recent (not more than 24 hours old)
  if (session.createdAt) {
    const createdTime = new Date(session.createdAt).getTime();
    const now = Date.now();
    const ageHours = (now - createdTime) / (1000 * 60 * 60);

    if (ageHours > 24) {
      warnings.push(`Passkey session is ${ageHours.toFixed(1)} hours old`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate ephemeral signature
 */
export function validateEphemeralSignature(
  signature: string | Uint8Array | Buffer
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!signature) {
    return {
      valid: false,
      errors: ["Signature is null or undefined"],
      warnings: [],
    };
  }

  // Check type
  if (
    typeof signature !== "string" &&
    !Buffer.isBuffer(signature) &&
    !(signature instanceof Uint8Array)
  ) {
    return {
      valid: false,
      errors: [
        `Invalid signature type: ${typeof signature}. Expected string, Buffer, or Uint8Array`,
      ],
      warnings: [],
    };
  }

  // If string, validate format
  if (typeof signature === "string") {
    if (signature.length === 0) {
      errors.push("Signature string is empty");
    }
    // Sui signatures are typically long base64 strings
    if (signature.length < 100) {
      warnings.push("Signature seems short - may be invalid");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Print validation results for debugging
 */
export function printValidationResults(
  name: string,
  result: ValidationResult
): void {
  console.group(`Validation: ${name}`);
  logger.log("Valid:", result.valid);

  if (result.errors.length > 0) {
    console.error(" Errors:");
    result.errors.forEach((err) => console.error(`  - ${err}`));
  }

  if (result.warnings.length > 0) {
    logger.warn(" Warnings:");
    result.warnings.forEach((warn) => logger.warn(`  - ${warn}`));
  }

  if (result.valid && result.warnings.length === 0) {
    logger.log(" All validations passed!");
  }

  console.groupEnd();
}

/**
 * Compare two signatures for debugging
 */
export function compareSignatures(sig1: string, sig2: string): void {
  console.group("Signature Comparison");
  logger.log("Signature 1 length:", sig1.length);
  logger.log("Signature 2 length:", sig2.length);
  logger.log("Are equal:", sig1 === sig2);
  logger.log("Signature 1 (first 50):", sig1.substring(0, 50) + "...");
  logger.log("Signature 2 (first 50):", sig2.substring(0, 50) + "...");
  console.groupEnd();
}

/**
 * Debug helper to check all authentication data
 */
export function debugAuthenticationData(
  session: any,
  zkProof: any,
  ephemeralSignature: any,
  jwtToken: string
): void {
  console.group(" Authentication Data Debug");

  logger.log("--- Session ---");
  const sessionValidation = validateSession(session);
  printValidationResults("Session", sessionValidation);

  logger.log("\n--- ZK Proof ---");
  const proofValidation = validateZkProof(zkProof);
  printValidationResults("ZK Proof", proofValidation);

  logger.log("\n--- Ephemeral Signature ---");
  const sigValidation = validateEphemeralSignature(ephemeralSignature);
  printValidationResults("Ephemeral Signature", sigValidation);

  logger.log("\n--- JWT Token ---");
  logger.log("JWT length:", jwtToken.length);
  logger.log("JWT (first 50):", jwtToken.substring(0, 50) + "...");

  logger.log("\n--- Summary ---");
  logger.log(
    "All valid:",
    sessionValidation.valid &&
      proofValidation.valid &&
      sigValidation.valid &&
      jwtToken.length > 0
  );

  console.groupEnd();
}
