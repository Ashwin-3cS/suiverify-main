'use client';

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/components/auth/AuthProvider';

/**
 * Custom hook to access authentication context
 *
 * Usage:
 * ```tsx
 * const { address, isAuthenticated, logout } = useAuth();
 * ```
 *
 * @returns Authentication context with address, auth state, and logout method
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider> in the root layout.'
    );
  }

  return context;
}

export default useAuth;
