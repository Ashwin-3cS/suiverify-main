'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, ExternalLink, Info } from 'lucide-react';
import { buildExplorerUrl } from '@/config/contracts';
import { Button } from '@/components/ui/button';

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-[3px] border-primary/30 shadow-[0.2em_0.2em] max-w-md w-full max-h-[90vh] overflow-auto pointer-events-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b-2 border-primary/20 p-6 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-2xl font-bold text-charcoal-text">
                  Your <span className="text-primary">SuiVerify</span> Address
                </h2>
                <p className="text-sm text-charcoal-text/70 mt-1">
                  Save this address for all transactions
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <X className="w-5 h-5 text-charcoal-text" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Address Display Box */}
              <div className="rounded-xl p-4 bg-primary/5 border-2 border-primary/20">
                <p className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider mb-3">
                  Your Sui Address
                </p>
                <div className="flex items-start gap-3">
                  <code className="flex-1 text-sm font-mono break-all leading-relaxed bg-white px-3 py-2 rounded-lg border-2 border-primary/20 text-charcoal-text">
                    {address}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-2 hover:bg-primary/10 rounded-lg transition-colors group"
                    title="Copy address"
                  >
                    {copied ? (
                      <span className="text-sm font-bold text-success"></span>
                    ) : (
                      <Copy className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>
              </div>

              {/* Information Box */}
              <div className="rounded-xl p-4 bg-primary/10 border-2 border-primary/20">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                  <div>
                    <p className="font-semibold text-charcoal-text mb-1 text-sm">
                      Save this address
                    </p>
                    <p className="text-xs text-charcoal-text/70">
                      You&apos;ll need this address for all transactions on the Sui blockchain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => window.open(explorerUrl, '_blank', 'noopener,noreferrer')}
                  variant="primary"
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>

                <Button
                  onClick={handleDisconnect}
                  variant="error"
                  className="w-full"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export { AddressModal };
export default AddressModal;
