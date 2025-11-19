import React, { useRef, useState } from 'react';
import { ChevronLeft, Camera, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { colors } from '@/app/brand';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

interface PANData {
  name?: string;
  dob?: string;
  father_name?: string;
  pan_number?: string;
  pan_photo_base64?: string;
  raw_text?: string;
}

interface FaceVerificationResult {
  verified: boolean;
  confidence: number;
  message: string;
  face_distance?: number;
  verification_status: string;
  threshold?: number;
  validation?: {
    pan_photo: {
      reason: string;
      detection_method: string;
    };
    live_image: {
      reason: string;
      detection_method: string;
    };
  };
}

interface FaceVerificationStepProps {
  onNext: () => void;
  onBack: () => void;
  panData: PANData;
  panCardImage?: File | null;
}

const FaceVerificationStep: React.FC<FaceVerificationStepProps> = ({ onNext, onBack, panData, panCardImage }) => {
  const webcamRef = useRef<Webcam>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceResult, setFaceResult] = useState<FaceVerificationResult | null>(null);

  const handleFaceVerification = async (liveImageBase64: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!panCardImage) {
        setError('PAN card image not found. Please upload PAN card first.');
        return;
      }

      // Create FormData for the API call
      const formData = new FormData();
      formData.append('pan_card_image', panCardImage);
      
      // Convert base64 to blob for live image
      const base64Data = liveImageBase64.includes(',') ? liveImageBase64.split(',')[1] : liveImageBase64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const liveImageBlob = new Blob([byteArray], { type: 'image/jpeg' });
      formData.append('live_image', liveImageBlob, 'live_image.jpg');
      
      const response = await fetch(buildApiUrl(API_ENDPOINTS.VERIFY_PAN_FACE), {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        const errorMessage = result.detail || result.message || `HTTP error! status: ${response.status}`;
        setError(errorMessage);
        return;
      }
      
      if (result.success && result.data) {
        setFaceResult(result.data);
        
        // Auto proceed to next step after successful face verification
        if (result.data.verified && result.data.verification_status === 'SUCCESS') {
          setTimeout(() => {
            onNext();
          }, 2000);
        }
      } else {
        const failureMessage = result.data?.message || result.message || 'Face verification failed.';
        setError(`Face verification failed: ${failureMessage}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Face verification failed';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setFaceImage(imageSrc);
      // Trigger actual face verification
      handleFaceVerification(imageSrc);
    }
  };

  const retakePhoto = () => {
    setFaceImage(null);
    setError(null);
    setFaceResult(null);
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
          Face Verification
        </h2>
      </div>

      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: `${colors.primary}10`, border: `1px solid #ef4444` }}>
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm" style={{ color: colors.white }}>{error}</p>
          </div>
        )}

        {/* Success Display */}
        {faceResult && faceResult.verified && (
          <div className="p-4 rounded-2xl" style={{ backgroundColor: `${colors.primary}10`, border: `1px solid #10b981` }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
              <h4 className="font-semibold" style={{ color: colors.white }}>Face Verification Successful</h4>
            </div>
          </div>
        )}

        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.white }}>Live Face Capture</h3>
          <p className="text-sm mb-6" style={{ color: colors.lightBlue }}>Position your face in the center and take a clear photo</p>
        </div>

        <div className="relative max-w-sm mx-auto mb-6">
          {!faceImage ? (
            <div className="relative">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded-2xl border-2"
                style={{ borderColor: `${colors.primary}40` }}
                videoConstraints={{
                  width: 480,
                  height: 360,
                  facingMode: "user"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-48 border-2 rounded-full opacity-50" style={{ borderColor: colors.primary }}></div>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={faceImage} 
                alt="Captured face" 
                className="w-full rounded-2xl border-2" 
                style={{ 
                  borderColor: faceResult?.verified ? '#10b981' : `${colors.primary}40`,
                  borderWidth: faceResult?.verified ? '3px' : '2px'
                }}
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
                  <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: colors.primary }} />
                    <p className="text-sm">Verifying face...</p>
                  </div>
                </div>
              )}
              {faceResult?.verified && (
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-4">
          {!faceImage ? (
            <button
              onClick={capturePhoto}
              disabled={isLoading}
              className="flex-1 py-3 px-6 rounded-xl font-medium transition-colors text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: colors.gradients.primary }}
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>
          ) : (
            <>
              <button
                onClick={retakePhoto}
                disabled={isLoading}
                className="flex-1 py-3 px-6 rounded-xl font-medium transition-colors text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: colors.darkNavy, border: `1px solid ${colors.primary}40` }}
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </button>
              {faceResult?.verified && (
                <button
                  onClick={onNext}
                  className="flex-1 py-3 px-6 rounded-xl font-medium transition-colors text-white"
                  style={{ background: colors.gradients.primary }}
                >
                  Next: PAN Verification
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceVerificationStep;