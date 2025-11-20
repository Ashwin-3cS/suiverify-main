import React, { useRef, useState } from 'react';
import { ChevronLeft, Camera, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { colors } from '@/app/brand';
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

interface FaceMatchResult {
  match: boolean;
  confidence: number;
  message: string;
  face_distance?: number;
}

interface FaceVerificationStepProps {
  onNext: () => void;
  onBack: () => void;
  aadhaarData: AadhaarData;
  documentType?: 'aadhaar' | 'pan';
}

const FaceVerificationStep: React.FC<FaceVerificationStepProps> = ({ onNext, onBack, documentType = 'aadhaar' }) => {
  const webcamRef = useRef<Webcam>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceResult, setFaceResult] = useState<FaceMatchResult | null>(null);

  // const API_BASE = 'http://localhost:8000';

  // const handleFaceVerification = async () => {
  //   setIsLoading(true);
  //   setError(null);
    
  //   try {
  //     if (!aadhaarData?.aadhaar_photo_base64) {
  //       setError('Aadhaar photo not found. Please upload Aadhaar card first.');
  //       return;
  //     }

  //     if (!aadhaarData?.phone_number) {
  //       setError('Phone number not found in Aadhaar data. Cannot proceed with verification.');
  //       return;
  //     }
      
  //     const base64Image = capturedImage.includes(',') ? capturedImage.split(',')[1] : capturedImage;
      
  //     const response = await fetch(`${API_BASE}/api/face/verify-face`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         aadhaar_photo_base64: aadhaarData.aadhaar_photo_base64,
  //         live_photo_base64: base64Image,
  //         phone_number: aadhaarData.phone_number
  //       }),
  //     });
      
  //     const result = await response.json();
      
  //     if (!response.ok) {
  //       const errorMessage = result.detail || result.message || `HTTP error! status: ${response.status}`;
  //       setError(errorMessage);
  //       return;
  //     }
      
  //     if (result.success) {
  //       if (result.data && result.data.match) {
  //         setFaceResult(result.data);
  //         // Auto proceed to next step after successful face match
  //         setTimeout(() => {
  //           onNext();
  //         }, 2000);
  //       } else {
  //         // Handle face mismatch case
  //         const failureMessage = result.data?.message || result.message || 'Face verification failed. The faces do not match with sufficient confidence.';
  //         setError(`Face verification failed: ${failureMessage}`);
  //       }
  //     } else {
  //       setError(result.message || 'Face comparison failed. Please try again.');
  //     }
  //   } catch (err) {
  //     const errorMsg = err instanceof Error ? err.message : 'Face verification failed';
  //     setError(errorMsg);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setFaceImage(imageSrc);
      // Simulate successful face verification
      setIsLoading(true);
      setTimeout(() => {
        setFaceResult({
          match: true,
          confidence: 95.5,
          message: 'Face verification successful',
          face_distance: 0.25
        });
        setIsLoading(false);
      }, 1500);
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

        {/* Success Display */}
        {faceResult && faceResult.match && (
          <div className="p-5 rounded-lg bg-success/10 border border-success/30">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-success" />
              <h4 className="font-bold text-lg text-charcoal-text">Face Verification Successful</h4>
            </div>
            <div className="pl-9 space-y-1 text-sm">
              <p className="text-charcoal-text/70">
                <span className="font-semibold">Confidence:</span> {faceResult.confidence.toFixed(1)}%
              </p>
              {faceResult.face_distance && (
                <p className="text-charcoal-text/70">
                  <span className="font-semibold">Face Distance:</span> {faceResult.face_distance.toFixed(3)}
                </p>
              )}
            </div>
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
                className={`w-full rounded-lg border-2 shadow-lg ${
                  faceResult?.match ? 'border-success' : 'border-primary/30'
                }`}
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg backdrop-blur-sm">
                  <div className="text-center text-white">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-base font-medium">Verifying face...</p>
                  </div>
                </div>
              )}
              {faceResult?.match && (
                <div className="absolute top-3 right-3 w-10 h-10 bg-success rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
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
              {faceResult?.match && (
                <Button
                  onClick={onNext}
                  variant="success"
                  className="flex-1"
                >
                  {documentType === 'pan' ? 'Next: PAN Verification' : 'Next: OTP Verification'}
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