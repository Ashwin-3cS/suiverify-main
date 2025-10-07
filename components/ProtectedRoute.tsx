'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      // Check if user has valid session from landing page
      const authData = localStorage.getItem('suiverify_auth');
      
      if (!authData) {
        // No auth data, redirect to landing page
        window.location.href = 'https://suiverify.xyz';
        return;
      }

      try {
        const parsed = JSON.parse(authData);
        const now = Date.now();
        const sessionAge = now - parsed.timestamp;
        const sessionTimeout = 3600000; // 1 hour

        if (sessionAge > sessionTimeout) {
          // Session expired, clear and redirect
          localStorage.removeItem('suiverify_auth');
          window.location.href = 'https://suiverify.xyz';
          return;
        }

        // Valid session
        setIsAuthenticated(true);
      } catch {
        // Invalid auth data, redirect
        localStorage.removeItem('suiverify_auth');
        window.location.href = 'https://suiverify.xyz';
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    // Loading state
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This shouldn't render as we redirect, but just in case
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-300">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
