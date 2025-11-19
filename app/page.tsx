'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard as the main entry point
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ghost-white outfit relative overflow-hidden">
      {/* Blob Animations Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      
      <div className="relative z-10 text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/20 border-t-primary mx-auto"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-2 border-primary/30 mx-auto"></div>
        </div>
        <p className="mt-6 text-charcoal-text font-semibold">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
