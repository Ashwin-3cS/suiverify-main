/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '@/lib/logger';
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

  useEffect(() => {
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = () => {
    logger.log(' Checking authentication status...');

    // Debug: Log all localStorage keys
    logger.log(' LocalStorage keys:', Object.keys(localStorage));
    logger.log(' zkLoginProofCache exists?', localStorage.getItem('zkLoginProofCache') !== null);
    logger.log(' zkLoginSession exists?', localStorage.getItem('zkLoginSession') !== null);

    try {
      const isAuth = SessionManager.isAuthenticated();
      logger.log(' SessionManager.isAuthenticated():', isAuth);

      if (isAuth) {
        const cachedProof = SessionManager.getCachedProof();
        logger.log(' Cached proof data:', cachedProof);

        if (cachedProof && cachedProof.address) {
          logger.log(' User is authenticated (cached address valid)');
          logger.log(' Address:', cachedProof.address);
          logger.log(' Note: Sensitive data (JWT, keys) must be in React context');

          //  IMPORTANT: Only restore address from cache
          // Sensitive data (jwtToken, ephemeralPrivateKey, userSalt, etc)
          // MUST be retrieved from React context on the callback page
          // or re-derived from email on next login
          setAddress(cachedProof.address);
          setZkProof(null); // Don't load from cache - context only
          setJwtToken(null); // Don't load from cache - context only
          setUserSalt(null); // Don't load from cache - context only
          setEphemeralPrivateKey(null); // Don't load from cache - context only
          setMaxEpoch(null); // Don't load from cache - context only
          setRandomness(null); // Don't load from cache - context only
          setIsAuthenticated(true);

          // Log cache TTL for debugging
          logger.log(`⏰ Address cache valid for: ${SessionManager.getFormattedTTL()}`);
        } else {
          logger.log(' isAuth=true but no cached proof or address');
        }
      } else {
        logger.log(' User is not authenticated (no valid cached address)');
        setAddress(null);
        setZkProof(null);
        setJwtToken(null);
        setUserSalt(null);
        setEphemeralPrivateKey(null);
        setMaxEpoch(null);
        setRandomness(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      logger.error('Error checking authentication:', error);
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
    logger.log(' Logging out...');
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

      logger.log(' Logout successful');
    } catch (error) {
      logger.error('Error during logout:', error);
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
