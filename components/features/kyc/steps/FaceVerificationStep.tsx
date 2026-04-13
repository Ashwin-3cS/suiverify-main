import React, { useState } from "react";
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/app/utils/api-client";
import { LivenessWebcam } from "@/components/features/kyc/LivenessWebcam";

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
}

interface FaceVerificationStepProps {
  onNext: () => void;
  onBack: () => void;
  panData: PANData;
  panCardImage?: File | null;
}

const FaceVerificationStep: React.FC<FaceVerificationStepProps> = ({
  onNext,
  onBack,
  panData,
  panCardImage,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceResult, setFaceResult] = useState<FaceVerificationResult | null>(
    null,
  );
  const [liveImage, setLiveImage] = useState<string | null>(null);

  const handleLivenessVerified = async (capturedImage: string) => {
    setLiveImage(capturedImage);
    setIsLoading(true);
    setError(null);

    try {
      if (!panCardImage) {
        setError(
          "PAN card image not found. Please go back and re-upload your PAN card.",
        );
        setIsLoading(false);
        return;
      }

      // MOCK: skip API call
      /*
      const formData = new FormData();
      formData.append("pan_card_image", panCardImage);

      const base64Data = capturedImage.includes(",")
        ? capturedImage.split(",")[1]
        : capturedImage;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const liveImageBlob = new Blob([new Uint8Array(byteNumbers)], {
        type: "image/jpeg",
      });
      formData.append("live_image", liveImageBlob, "live_image.jpg");

      const response = await apiFetch(
        buildApiUrl(API_ENDPOINTS.VERIFY_PAN_FACE),
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();
      */

      const result: { success: boolean, data?: FaceVerificationResult, detail?: string, message?: string } = {
        success: true,
        data: {
          verified: true,
          confidence: 99.9,
          message: "Mock face verification successful",
          face_distance: 0.1,
          verification_status: "SUCCESS",
          threshold: 50.0
        } as FaceVerificationResult
      };

      if (result.success && result.data) {
        setFaceResult(result.data);
        if (result.data.verified) {
          setTimeout(() => onNext(), 1500);
        } else {
          setError(
            `Face does not match. Confidence: ${result.data.confidence?.toFixed(1) ?? 0}%. ` +
              `Please ensure good lighting and try again.`,
          );
        }
      } else {
        const failureMessage =
          result.detail ||
          result.message ||
          "Face verification failed. Please try again.";
        setError(failureMessage);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Face verification failed";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setLiveImage(null);
    setFaceResult(null);
    setError(null);
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
            Liveness Verification
          </h2>
          <p className="text-sm text-charcoal-text/60 mt-1">
            Complete the challenges to confirm you are a real person
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg flex items-start gap-3 bg-error/10 border border-error/30">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-charcoal-text font-medium">{error}</p>
              {liveImage && (
                <button
                  onClick={handleRetry}
                  className="text-xs text-primary underline mt-1"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {faceResult?.verified && (
          <div className="p-4 rounded-lg flex items-center gap-3 bg-success/10 border border-success/30">
            <CheckCircle className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-sm text-charcoal-text font-medium">
                Identity verified — {faceResult.confidence.toFixed(1)}%
                confidence
              </p>
              <p className="text-xs text-charcoal-text/60">
                Proceeding to next step...
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
            <p className="text-charcoal-text/70 font-medium">
              Comparing face with document...
            </p>
            <p className="text-xs text-charcoal-text/40 mt-1">
              This takes a few seconds
            </p>
          </div>
        )}

        {!isLoading && !faceResult?.verified && (
          <div className="relative max-w-md mx-auto">
            {liveImage && error ? (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={liveImage}
                  alt="Captured face"
                  className="w-full rounded-lg border-2 border-error/40 mb-4"
                />
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Liveness Check
                </Button>
              </div>
            ) : (
              <LivenessWebcam
                onVerified={handleLivenessVerified}
                onError={(err) => {
                  setError(err);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceVerificationStep;
