import React, { useState } from 'react';
import { ChevronLeft, Loader2, CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { colors } from '@/app/brand';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/app/utils/api-client';

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
  const { address } = useAuth();

  // Auto-set DID based on verification type
  const getDid = () => {
    return verificationType === 'above18' ? 0 : 1;
  };

  const handleProceed = async () => {
    if (!panData || !address) {
      setError('Missing PAN data or wallet connection');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Starting PAN verification process...');

      // Send PAN data to Redis stream for enclave processing
      const verificationPayload = {
        user_address: address,
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
      const result = await apiPost(
        buildApiUrl(API_ENDPOINTS.VERIFY_PAN),
        verificationPayload
      );

      console.log('✅ PAN verification request sent to enclave:', result);
      toast.success('PAN verification initiated! Waiting for blockchain attestation...');
      onNext(); // Move to waiting step
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
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg transition-colors hover:bg-primary/10 bg-primary/5"
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
          <div className="p-4 rounded-lg flex items-center gap-3 bg-error/10 border border-error/30">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
            <p className="text-sm text-charcoal-text">{error}</p>
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
          <div className="p-5 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
              <h4 className="font-bold text-lg text-charcoal-text">PAN Details to Verify</h4>
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
        </Button>
      </div>
    </div>
  );
};

export default PANVerificationStep;