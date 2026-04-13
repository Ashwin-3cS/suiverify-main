"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't protect adminLogin, admin, dashboard, and callback pages
    // Dashboard is the main entry point where users can connect their wallet
    // Callback is where OAuth returns and zkLogin proof is generated
    if (
      pathname === "/adminLogin" ||
      pathname === "/admin" ||
      pathname === "/dashboard" ||
      pathname === "/" ||
      pathname === "/callback"
    ) {
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = () => {
      // Check if user has valid session
      const authData = localStorage.getItem("suiverify_auth");

      if (!authData) {
        // No auth data, redirect to dashboard (where they can sign in)
        router.push("/dashboard");
        return;
      }

      try {
        const parsed = JSON.parse(authData);
        const now = Date.now();
        const sessionAge = now - parsed.timestamp;
        const sessionTimeout = 3600000; // 1 hour

        if (sessionAge > sessionTimeout) {
          // Session expired, clear and redirect
          localStorage.removeItem("suiverify_auth");
          router.push("/dashboard");
          return;
        }

        // Valid session
        setIsAuthenticated(true);
      } catch {
        // Invalid auth data, redirect
        localStorage.removeItem("suiverify_auth");
        router.push("/dashboard");
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (isAuthenticated === null) {
    // Loading state
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-white outfit relative overflow-hidden">
        {/* Blob Animations Background */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-[0.1em_0.1em] border-[3px] border-primary/30">
            <div className="relative mx-auto w-16 h-16 mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-primary/30"></div>
            </div>
            <h2 className="text-xl font-bold text-charcoal-text mb-2">
              Verifying Authentication
            </h2>
            <p className="text-sm text-charcoal-text/70">
              Please wait while we verify your session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This shouldn't render as we redirect, but just in case
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-white outfit relative overflow-hidden">
        {/* Blob Animations Background */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-[0.1em_0.1em] border-[3px] border-primary/30">
            <h2 className="text-xl font-bold text-charcoal-text mb-2">
              Redirecting to Login
            </h2>
            <p className="text-sm text-charcoal-text/70">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
