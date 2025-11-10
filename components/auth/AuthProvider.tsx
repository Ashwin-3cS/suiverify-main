/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { SessionManager } from '@/lib/session-manager';
import { ZkLoginService } from '@/lib/zklogin';

export interface AuthContextType {
  address: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  zkProof: any;
  jwtToken: string | null;
  userSalt: string | null;
  ephemeralPrivateKey: string | null;
  maxEpoch: number | null;
  randomness: string | null;
  logout: () => void;
  checkAuth: () => void;
  setAuthData: (data: {
    address: string;
    zkProof: any;
    jwtToken: string;
    userSalt: string;
    ephemeralPrivateKey: string;
    maxEpoch: number;
    randomness: string;
  }) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zkProof, setZkProof] = useState<any>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [userSalt, setUserSalt] = useState<string | null>(null);
  const [ephemeralPrivateKey, setEphemeralPrivateKey] = useState<string | null>(null);
  const [maxEpoch, setMaxEpoch] = useState<number | null>(null);
  const [randomness, setRandomness] = useState<string | null>(null);

  // Check for existing cached authentication on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    console.log('🔍 Checking authentication status...');

    try {
      const isAuth = SessionManager.isAuthenticated();

      if (isAuth) {
        const cachedProof = SessionManager.getCachedProof();
        if (cachedProof) {
          console.log('✅ User is authenticated (cached proof valid)');
          console.log('📍 Address:', cachedProof.address);

          setAddress(cachedProof.address);
          setZkProof(cachedProof.zkProof);
          setJwtToken(cachedProof.jwtToken);
          setIsAuthenticated(true);

          // Log cache TTL for debugging
          console.log(`⏰ Cache valid for: ${SessionManager.getFormattedTTL()}`);
        }
      } else {
        console.log('❌ User is not authenticated (no valid cached proof)');
        setAddress(null);
        setZkProof(null);
        setJwtToken(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthData = (data: {
    address: string;
    zkProof: any;
    jwtToken: string;
    userSalt: string;
    ephemeralPrivateKey: string;
    maxEpoch: number;
    randomness: string;
  }) => {
    setAddress(data.address);
    setZkProof(data.zkProof);
    setJwtToken(data.jwtToken);
    setUserSalt(data.userSalt);
    setEphemeralPrivateKey(data.ephemeralPrivateKey);
    setMaxEpoch(data.maxEpoch);
    setRandomness(data.randomness);
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log('🔓 Logging out...');
    try {
      ZkLoginService.clearSession();
      SessionManager.clearSession();

      setAddress(null);
      setZkProof(null);
      setJwtToken(null);
      setUserSalt(null);
      setEphemeralPrivateKey(null);
      setMaxEpoch(null);
      setRandomness(null);
      setIsAuthenticated(false);

      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    address,
    isAuthenticated,
    isLoading,
    zkProof,
    jwtToken,
    userSalt,
    ephemeralPrivateKey,
    maxEpoch,
    randomness,
    logout,
    checkAuth,
    setAuthData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
