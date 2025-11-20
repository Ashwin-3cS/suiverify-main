import React, { useRef, useState } from 'react';
import { ChevronLeft, Camera, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { colors } from '@/app/brand';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';
import { Button } from '@/components/ui/button';

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
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg transition-colors hover:bg-primary/10 bg-primary/5"
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-charcoal-text">Face Verification</h2>
          <p className="text-sm text-charcoal-text/60 mt-1">Verify your identity with a live photo</p>
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

        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-charcoal-text">Live Face Capture</h3>
          <p className="text-sm text-charcoal-text/70">Position your face in the center and take a clear photo</p>
        </div>

        <div className="relative max-w-md mx-auto mb-8">
          {!faceImage ? (
            <div className="relative">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded-lg border-2 border-primary/30 shadow-lg"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-60 border-2 border-primary rounded-full opacity-50"></div>
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
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg backdrop-blur-sm">
                  <div className="text-center text-white">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-base font-medium">Verifying face...</p>
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
            <Button
              onClick={capturePhoto}
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </Button>
          ) : (
            <>
              <Button
                onClick={retakePhoto}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </Button>
              {faceResult?.verified && (
                <Button
                  onClick={onNext}
                  variant="success"
                  className="flex-1"
                >
                  Next: PAN Verification
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceVerificationStep;