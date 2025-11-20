import React, { useState } from 'react';
import { ChevronLeft, Loader2, CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { colors } from '@/app/brand';
import { toast } from 'react-toastify';
// Commented out EOA wallet import - using zkLogin instead
// import { useCurrentAccount } from '@mysten/dapp-kit';
import { useAuth } from '@/hooks/useAuth';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';
import { Button } from '@/components/ui/button';

interface PANData {
  pan_number?: string;
  name?: string;
  father_name?: string;
  dob?: string;
  pan_photo_base64?: string;
}

interface PANVerificationStepProps {
  onNext: () => void;
  onBack: () => void;
  panData?: PANData;
  verificationType?: string; // 'above18' or 'citizenship'
}

const PANVerificationStep: React.FC<PANVerificationStepProps> = ({
  onNext,
  onBack,
  panData,
  verificationType = 'above18'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use zkLogin address instead of EOA wallet
  const { address: zkLoginAddress } = useAuth();

  // Auto-set DID based on verification type
  const getDid = () => {
    return verificationType === 'above18' ? 0 : 1;
  };

  const handleProceed = async () => {
    if (!panData || !zkLoginAddress) {
      setError('Missing PAN data or zkLogin address');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Starting PAN verification process...');

      // Send PAN data to Redis stream for enclave processing
      const verificationPayload = {
        user_address: zkLoginAddress,
        document_type: 'pan',
        did_type: getDid(),
        pan_data: {
          pan_number: panData.pan_number,
          name: panData.name,
          father_name: panData.father_name,
          dob: panData.dob
        },
        timestamp: Date.now()
      };

      console.log('📤 Sending PAN verification to Redis stream:', verificationPayload);

      // Call the verification endpoint that sends to Redis
      const response = await fetch(buildApiUrl(API_ENDPOINTS.VERIFY_PAN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationPayload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ PAN verification request sent to enclave:', result);
        toast.success('PAN verification initiated! Waiting for blockchain attestation...');
        onNext(); // Move to waiting step
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate PAN verification');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during PAN verification';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('❌ PAN verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full transition-colors"
          style={{ backgroundColor: `${colors.primary}20` }}
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-charcoal-text">PAN Verification</h2>
          <p className="text-sm text-charcoal-text/60 mt-1">Verify your PAN with government databases</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-2xl flex items-center gap-3"
            style={{ backgroundColor: `${colors.primary}10`, border: `1px solid #ef4444` }}>
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm" style={{ color: colors.white }}>{error}</p>
          </div>
        )}

        {/* PAN Verification Info */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <CreditCard className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-charcoal-text">
            Ready for Government Verification
          </h3>
          <p className="text-sm text-charcoal-text/70">
            Your PAN details will be verified with government databases through our secure enclave
          </p>
        </div>

        {/* PAN Data Summary */}
        {panData && (
          <div className="p-4 rounded-xl"
            style={{ backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.primary}30` }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5" style={{ color: colors.primary }} />
              <h4 className="font-semibold" style={{ color: colors.white }}>PAN Details to Verify</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {panData.pan_number && (
                <div className="p-3 rounded-lg bg-white/50">
                  <span className="text-xs font-semibold text-charcoal-text/70 block mb-1">PAN Number</span>
                  <span className="text-sm font-bold text-charcoal-text">{panData.pan_number}</span>
                </div>
              )}
              {panData.name && (
                <div className="p-3 rounded-lg bg-white/50">
                  <span className="text-xs font-semibold text-charcoal-text/70 block mb-1">Name</span>
                  <span className="text-sm font-bold text-charcoal-text">{panData.name}</span>
                </div>
              )}
              {panData.father_name && (
                <div className="p-3 rounded-lg bg-white/50">
                  <span className="text-xs font-semibold text-charcoal-text/70 block mb-1">Father&apos;s Name</span>
                  <span className="text-sm font-bold text-charcoal-text">{panData.father_name}</span>
                </div>
              )}
              {panData.dob && (
                <div className="p-3 rounded-lg bg-white/50">
                  <span className="text-xs font-semibold text-charcoal-text/70 block mb-1">Date of Birth</span>
                  <span className="text-sm font-bold text-charcoal-text">{panData.dob}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Process Info */}
        <div className="p-4 rounded-xl"
          style={{ backgroundColor: `${colors.primary}05`, border: `1px solid ${colors.primary}20` }}>
          <h4 className="font-semibold mb-2" style={{ color: colors.white }}>Verification Process:</h4>
          <div className="space-y-2 text-sm" style={{ color: colors.lightBlue }}>
            <p>🔐 Secure enclave processes your data</p>
            <p>🏛️ Government database verification</p>
            <p>⛓️ Blockchain attestation recording</p>
            <p>🎯 DID NFT ready for claiming</p>
          </div>
        </div>

        {/* Proceed Button */}
        <Button
          onClick={handleProceed}
          variant="primary"
          disabled={isLoading || !panData}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Initiating Verification...
            </div>
          ) : (
            'Proceed with Government Verification'
          )}
        </button>

        {/* Info Note */}
        <div className="p-3 rounded-xl text-center"
          style={{ backgroundColor: `${colors.primary}05`, border: `1px solid ${colors.primary}20` }}>
          <p className="text-xs" style={{ color: colors.lightBlue }}>
            💡 No OTP required for PAN verification. Government database verification happens automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PANVerificationStep;
