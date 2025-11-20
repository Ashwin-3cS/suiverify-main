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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-[0.1em_0.1em] border-[3px] border-primary/30">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-primary/30"></div>
          </div>
          <h2 className="text-xl font-bold text-charcoal-text mb-2">Verifying Authentication</h2>
          <p className="text-sm text-charcoal-text/70">Please wait while we verify your session...</p>
        </div>
      </div>
    </div>
  );
}
