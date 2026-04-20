"use client";

import { useEffect } from "react";

export default function DigiLockerCallback() {
  useEffect(() => {
    window.close();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center p-6">
        <p className="text-charcoal-text text-lg font-semibold">DigiLocker consent received</p>
        <p className="text-charcoal-text/60 text-sm mt-2">You can close this tab and return to the verification page.</p>
      </div>
    </div>
  );
}
