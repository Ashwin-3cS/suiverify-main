import React from 'react';
import { X, CheckCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AadhaarData {
  aadhaar_number?: string;
  name?: string;
  dob?: string;
  gender?: string;
  phone_number?: string;
  address?: string;
}

interface PANData {
  pan_number?: string;
  name?: string;
  father_name?: string;
  dob?: string;
}

interface ExtractedDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'aadhaar' | 'pan';
  data: AadhaarData | PANData;
}

export const ExtractedDataModal: React.FC<ExtractedDataModalProps> = ({
  isOpen,
  onClose,
  documentType,
  data
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white/95 backdrop-blur-sm rounded-2xl border-[3px] border-primary/30 shadow-[0.2em_0.2em] max-w-2xl w-full max-h-[90vh] overflow-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b-2 border-primary/20 p-6 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/15 border-2 border-success/30">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-charcoal-text">
                  {documentType === 'aadhaar' ? 'Aadhaar' : 'PAN'} Data Extracted
                </h2>
                <p className="text-sm text-charcoal-text/70 mt-1">
                  Review the extracted information from your document
                </p>
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
          <div className="p-6">
            {documentType === 'aadhaar' ? (
              <div className="space-y-4">
                {(data as AadhaarData).aadhaar_number && (
                  <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                    <span className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider block mb-2">
                      Aadhaar Number
                    </span>
                    <span className="text-lg font-bold text-charcoal-text">
                      {(data as AadhaarData).aadhaar_number}
                    </span>
                  </div>
                )}
                {(data as AadhaarData).name && (
                  <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                    <span className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider block mb-2">
                      Name
                    </span>
                    <span className="text-lg font-semibold text-charcoal-text">
                      {(data as AadhaarData).name}
                    </span>
                  </div>
                )}
                {(data as AadhaarData).dob && (
                  <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                    <span className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider block mb-2">
                      Date of Birth
                    </span>
                    <span className="text-lg font-semibold text-charcoal-text">
                      {(data as AadhaarData).dob}
                    </span>
                  </div>
                )}
                {(data as AadhaarData).phone_number && (
                  <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                    <span className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider block mb-2">
                      Phone Number
                    </span>
                    <span className="text-lg font-semibold text-charcoal-text">
                      {(data as AadhaarData).phone_number}
                    </span>
                  </div>
                )}
                {(data as AadhaarData).gender && (
                  <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                    <span className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider block mb-2">
                      Gender
                    </span>
                    <span className="text-lg font-semibold text-charcoal-text">
                      {(data as AadhaarData).gender}
                    </span>
                  </div>
                )}
                {(data as AadhaarData).address && (
                  <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                    <span className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider block mb-2">
                      Address
                    </span>
                    <span className="text-base font-medium text-charcoal-text">
                      {(data as AadhaarData).address}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {(data as PANData).pan_number && (
                  <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                    <span className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider block mb-2">
                      PAN Number
                    </span>
                    <span className="text-lg font-bold text-charcoal-text">
                      {(data as PANData).pan_number}
                    </span>
                  </div>
                )}
                {(data as PANData).name && (
                  <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                    <span className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider block mb-2">
                      Name
                    </span>
                    <span className="text-lg font-semibold text-charcoal-text">
                      {(data as PANData).name}
                    </span>
                  </div>
                )}
                {(data as PANData).father_name && (
                  <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                    <span className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider block mb-2">
                      Father&apos;s Name
                    </span>
                    <span className="text-lg font-semibold text-charcoal-text">
                      {(data as PANData).father_name}
                    </span>
                  </div>
                )}
                {(data as PANData).dob && (
                  <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                    <span className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider block mb-2">
                      Date of Birth
                    </span>
                    <span className="text-lg font-semibold text-charcoal-text">
                      {(data as PANData).dob}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

