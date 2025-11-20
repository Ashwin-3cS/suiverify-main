/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ZkLoginSession {
  ephemeralPrivateKey: string;
  randomness: string;
  maxEpoch: string;
  userSalt: string;
  nonce?: string;
}

export interface ZkLoginState {
  address: string;
  jwtToken: string;
  zkProof: any;
  ephemeralKeyPair: any;
  randomness: string;
  maxEpoch: number;
  userSalt: string;
}

export interface DecodedJWT {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  nonce: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}

export interface PasskeySession {
  publicKeyBase64: string;
  createdAt: number;
  rpId: string;
}

export interface PasskeyState {
  address: string;
  publicKey: string;
  authMethod: "passkey";
}

export type AuthMethod = "zklogin" | "passkey";

export interface AuthState {
  method: AuthMethod;
  address: string;
  isAuthenticated: boolean;
}
