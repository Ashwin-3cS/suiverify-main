import React, { useState } from 'react';
import { ChevronLeft, Loader2, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { colors } from '@/app/brand';
import { toast } from 'react-toastify';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';

interface AadhaarData {
  name?: string;
  dob?: string;
  gender?: string;
  phone_number?: string;
  address?: string;
  aadhaar_number?: string;
  aadhaar_photo_base64?: string;
}

interface OtpVerificationStepProps {
  onNext: () => void;
  onBack: () => void;
  phoneNumber: string;
  aadhaarData?: AadhaarData;
  verificationType?: string; // 'above18' or 'citizenship'
}

const OtpVerificationStep: React.FC<OtpVerificationStepProps> = ({ onNext, onBack, phoneNumber, aadhaarData, verificationType = 'above18' }) => {
  const [step, setStep] = useState<'generate' | 'verify'>('generate');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const currentAccount = useCurrentAccount(); // Commented out - not used

  // Auto-set DID based on verification type
  const getDid = () => {
    return verificationType === 'above18' ? 0 : 1;
  };

  const handleApiCall = async (url: string, formData: FormData) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const urlWithTimestamp = `${url}?t=${timestamp}`;
      
      const response = await fetch(urlWithTimestamp, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (err) {
      console.error('API call failed:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Network error: Please ensure the backend server is running');
      }
      throw err;
    }
  };

  const generateOtp = async () => {
    // Reset all states to prevent caching issues
    setIsLoading(true);
    setError(null);
    setOtpSent(false);
    setOtp('');

    try {
      const formData = new FormData();
      formData.append('phone', phoneNumber);

      const result = await handleApiCall(buildApiUrl(API_ENDPOINTS.GENERATE_OTP), formData);

      if (result.success) {
        setOtpSent(true);
        setStep('verify');
      } else {
        setError(result.message || 'Failed to generate OTP. Please check the phone number.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate OTP';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Note: Wallet connection check disabled for now
      // if (!currentAccount?.address) {
      //   setError('Please connect your wallet first');
      //   setIsLoading(false);
      //   return;
      // }

      const formData = new FormData();
      formData.append('phone', phoneNumber);
      formData.append('otp', otp);

      // Add placeholder wallet address - update when wallet integration is ready
      formData.append('wallet_address', currentAccount?.address || 'placeholder_address');

      // Auto-set DID based on verification type (0 for above18, 1 for citizenship)
      formData.append('did', getDid().toString());

      console.log(`🔍 Frontend: Sending OTP verification with DID: ${getDid()} for verification type: ${verificationType}`);
      console.log(`🔍 Frontend: Using placeholder wallet address`);

      // Add Aadhaar data if available
      if (aadhaarData) {
        if (aadhaarData.aadhaar_number) formData.append('aadhaar_number', aadhaarData.aadhaar_number);
        if (aadhaarData.dob) formData.append('date_of_birth', aadhaarData.dob);
        if (aadhaarData.name) formData.append('full_name', aadhaarData.name);
        if (aadhaarData.gender) formData.append('gender', aadhaarData.gender);
        formData.append('verification_type', verificationType);
      }

      const result = await handleApiCall(buildApiUrl(API_ENDPOINTS.VERIFY_OTP_ENDPOINT), formData);

      if (result.success) {
        localStorage.setItem('verificationCompleted', 'true');

        // Store user data if saved to database
        if (result.data.user_saved && result.data.wallet_address) {
          localStorage.setItem('userWalletAddress', result.data.wallet_address);
          localStorage.setItem('userData', JSON.stringify(result.data.user_data));

          // Show success toast for database save
          toast.success('Verification completed! Your data has been saved successfully.', {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          // Show success toast for OTP verification only
          toast.success('OTP verified successfully!', {
            position: "bottom-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }

        // Show success message
        console.log('✅ OTP Verification Successful:', result.message);

        onNext();
      } else {
        setError(result.message || 'OTP verification failed. Please check the code and try again.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'OTP verification failed';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      handleOtpVerification();
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
          <h2 className="text-2xl font-bold text-charcoal-text">
            {step === 'generate' ? 'Generate OTP' : 'Verify OTP'}
          </h2>
          <p className="text-sm text-charcoal-text/60 mt-1">
            {step === 'generate' ? 'Send verification code to your phone' : 'Enter the code sent to your phone'}
          </p>
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

        {/* Success Display */}
        {otpSent && (
          <div className="p-4 rounded-lg flex items-center gap-3 bg-success/10 border border-success/30">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-sm text-charcoal-text font-medium">OTP sent successfully to {phoneNumber}</p>
          </div>
        )}

        {step === 'generate' ? (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary/10">
              <Phone className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-charcoal-text">Send OTP</h3>
            <p className="mb-2 text-charcoal-text/70">
              We&apos;ll send a 6-digit verification code to:
            </p>
            <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/30 inline-block">
              <p className="text-lg font-bold text-charcoal-text">{phoneNumber}</p>
            </div>

            <Button
              onClick={generateOtp}
              variant="primary"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" />
                  Send OTP
                </>
              )}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary/10">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-charcoal-text">Enter Verification Code</h3>
              <p className="text-sm mb-2 text-charcoal-text/70">We&apos;ve sent a 6-digit code to</p>
              <p className="text-base font-semibold mb-6 text-charcoal-text">{phoneNumber}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-charcoal-text">
                6-Digit OTP <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-4 rounded-lg text-center text-3xl font-mono tracking-[0.5em] text-charcoal-text placeholder-charcoal-text/30 bg-white border-2 border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            {/* Show verification type info */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-semibold mb-1 text-charcoal-text">
                Verification Type: <span className="text-primary">{verificationType === 'above18' ? 'Above 18 Verification' : 'Citizenship Application'}</span>
              </p>
              <p className="text-xs text-charcoal-text/60">
                DID will be automatically set to {getDid()} for this verification type
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                variant="success"
                disabled={otp.length !== 6 || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Complete'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={generateOtp}
                  disabled={isLoading}
                  className="text-sm font-medium text-primary hover:text-primary-dark disabled:opacity-50 transition-colors"
                >
                  Didn&apos;t receive code? Resend
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OtpVerificationStep;
