import React, { useState } from 'react';
import { ChevronLeft, Loader2, CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { colors } from '@/app/brand';
import { toast } from 'react-toastify';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

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
  const currentAccount = useCurrentAccount();

  // Auto-set DID based on verification type
  const getDid = () => {
    return verificationType === 'above18' ? 0 : 1;
  };

  const handleProceed = async () => {
    if (!panData || !currentAccount?.address) {
      setError('Missing PAN data or wallet connection');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Starting PAN verification process...');
      
      // Send PAN data to Redis stream for enclave processing
      const verificationPayload = {
        user_address: currentAccount.address,
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
          <ChevronLeft className="w-5 h-5" style={{ color: colors.primary }} />
        </button>
        <h2 className="text-xl font-semibold" style={{ color: colors.white }}>
          PAN Verification
        </h2>
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
          <CreditCard className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.white }}>
            Ready for Government Verification
          </h3>
          <p className="text-sm" style={{ color: colors.lightBlue }}>
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
            <div className="space-y-2 text-sm">
              {panData.pan_number && (
                <div className="flex justify-between">
                  <span style={{ color: colors.primary }}>PAN Number:</span>
                  <span style={{ color: colors.lightBlue }}>{panData.pan_number}</span>
                </div>
              )}
              {panData.name && (
                <div className="flex justify-between">
                  <span style={{ color: colors.primary }}>Name:</span>
                  <span style={{ color: colors.lightBlue }}>{panData.name}</span>
                </div>
              )}
              {panData.father_name && (
                <div className="flex justify-between">
                  <span style={{ color: colors.primary }}>Father's Name:</span>
                  <span style={{ color: colors.lightBlue }}>{panData.father_name}</span>
                </div>
              )}
              {panData.dob && (
                <div className="flex justify-between">
                  <span style={{ color: colors.primary }}>Date of Birth:</span>
                  <span style={{ color: colors.lightBlue }}>{panData.dob}</span>
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
        <button
          onClick={handleProceed}
          disabled={isLoading || !panData}
          className="w-full py-3 px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{ background: colors.gradients.primary }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
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
