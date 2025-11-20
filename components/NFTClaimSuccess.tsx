import React from 'react';
import { CheckCircle, ExternalLink, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface NFTClaimSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  nftData: {
    nftId: string;
    title: string;
    description: string;
    suiExplorerUrl: string;
    walrusUrl?: string;
    transactionHash: string;
    userAddress: string;
  };
}

export function NFTClaimSuccessModal({ isOpen, onClose, nftData }: NFTClaimSuccessModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-[3px] border-primary/30 shadow-[0.2em_0.2em] max-w-2xl w-full max-h-[90vh] overflow-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b-2 border-primary/20 p-6 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-success/15 border-2 border-success/30">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-charcoal-text">NFT Claimed Successfully!</h2>
                  <p className="text-sm text-charcoal-text/70 mt-1">Your identity verification NFT has been minted</p>
                </div>
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
              {/* NFT Details */}
              <div className="rounded-xl p-6 bg-primary/5 border-2 border-primary/20">
                <h3 className="text-lg font-semibold mb-4 text-charcoal-text">NFT Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider mb-2">Title</p>
                    <p className="text-lg font-semibold text-charcoal-text">{nftData.title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider mb-2">Description</p>
                    <p className="text-base text-charcoal-text">{nftData.description}</p>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-charcoal-text">Technical Information</h3>
                
                {/* NFT ID */}
                <div className="rounded-xl p-4 bg-primary/5 border-2 border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider">NFT Object ID</p>
                    <button
                      onClick={() => copyToClipboard(nftData.nftId, 'nftId')}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
                    >
                      {copiedField === 'nftId' ? 'Copied!' : 'Copy'}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-mono text-sm p-3 rounded-lg border-2 border-primary/20 bg-white break-all text-charcoal-text">
                    {nftData.nftId}
                  </p>
                </div>

                {/* Transaction Hash */}
                <div className="rounded-xl p-4 bg-primary/5 border-2 border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider">Transaction Hash</p>
                    <button
                      onClick={() => copyToClipboard(nftData.transactionHash, 'txHash')}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
                    >
                      {copiedField === 'txHash' ? 'Copied!' : 'Copy'}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-mono text-sm p-3 rounded-lg border-2 border-primary/20 bg-white break-all text-charcoal-text">
                    {nftData.transactionHash}
                  </p>
                </div>
              </div>

              {/* Action Links */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-charcoal-text">View Your NFT</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => window.open(nftData.suiExplorerUrl, '_blank', 'noopener,noreferrer')}
                    variant="primary"
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Sui Explorer
                  </Button>
                </div>
              </div>

              {/* Success Message */}
              <div className="rounded-xl p-4 bg-success/10 border-2 border-success/30">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-success" />
                  <div>
                    <p className="font-semibold text-charcoal-text">Verification Complete!</p>
                    <p className="text-sm mt-1 text-charcoal-text/70">
                      Your identity has been successfully verified and stored as an NFT on the Sui blockchain. 
                      This NFT serves as cryptographic proof of your identity verification and can be used 
                      across compatible applications.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t-2 border-primary/20 p-6 flex justify-end gap-3 rounded-b-2xl">
              <Button
                onClick={onClose}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
