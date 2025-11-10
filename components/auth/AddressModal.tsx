'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildExplorerUrl } from '@/config/contracts';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  onDisconnect: () => void;
}

const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  address,
  onDisconnect,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    onDisconnect();
    onClose();
  };

  const explorerUrl = `${buildExplorerUrl(address, 'object')}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-99999 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-[#011829] rounded-2xl md:p-8 p-6 max-w-md w-full shadow-2xl relative border border-[#4DA2FF]/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute md:top-6 top-4 right-6 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 text-white">
                Your <span className="text-[#4DA2FF]">SuiVerify</span> Address
              </h2>
              <p className="text-sm text-white/70">
                Save this address for all transactions
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Address Display Box */}
              <div className="bg-[#030f1c] border border-[#4DA2FF]/40 rounded-xl p-4">
                <p className="text-xs text-white/60 uppercase tracking-wider font-bold mb-3">
                  Your Sui Address
                </p>
                <div className="flex items-start gap-3">
                  <code className="flex-1 text-sm text-white font-mono break-all leading-relaxed bg-[#0a1929] px-3 py-2 rounded-lg border border-[#4DA2FF]/20">
                    {address}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 mt-2 p-2 hover:bg-[#4DA2FF]/20 rounded-lg transition-colors group"
                    title="Copy address"
                  >
                    {copied ? (
                      <span className="text-xs font-bold text-[#4DD0E1]">✓</span>
                    ) : (
                      <svg
                        className="w-5 h-5 text-[#4DA2FF] group-hover:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Information Box */}
              <div className="bg-[#4DA2FF]/10 border border-[#4DA2FF]/30 rounded-xl p-4">
                <div className="flex gap-3">
                  <span className="text-xl flex-shrink-0">ℹ️</span>
                  <div>
                    <p className="font-bold text-white mb-1 text-sm">
                      Save this address
                    </p>
                    <p className="text-xs text-white/80">
                      You&apos;ll need this address for all transactions on the Sui blockchain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#00BFFF] text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium text-base"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View on Explorer
                </a>

                <button
                  onClick={handleDisconnect}
                  className="w-full py-3 px-4 rounded-lg border border-[#4DA2FF]/40 text-white hover:bg-[#4DA2FF]/10 transition-colors font-medium text-base"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { AddressModal };
export default AddressModal;
