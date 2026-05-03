'use client';

import { Fuel } from 'lucide-react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useSelfPayGas } from '@/lib/gasPreference';

const SelfPayGasToggle = () => {
  const { authMode } = useUnifiedAuth();
  const [enabled, setEnabled] = useSelfPayGas();

  if (authMode !== 'wallet') return null;

  return (
    <label
      className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-md border border-gray-700 bg-gray-900/40 hover:bg-gray-800/60 transition"
      title="Sign and pay gas from your wallet instead of using sponsored transactions (~0.008 SUI per claim)."
    >
      <Fuel className="w-4 h-4 text-gray-300" />
      <span className="hidden sm:inline text-xs text-gray-200">Pay own gas</span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
        className="w-4 h-4 accent-emerald-500 cursor-pointer"
      />
    </label>
  );
};

export default SelfPayGasToggle;
