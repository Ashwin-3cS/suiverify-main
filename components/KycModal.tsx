import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Check,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";
import { apiFetch } from "@/app/utils/api-client";
import { Button } from "@/components/ui/button";
import { LivenessWebcam } from "./features/kyc/LivenessWebcam";

type KycStep = "document" | "liveness" | "verifying" | "complete";

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationType: string;
}

const KycModal: React.FC<KycModalProps> = ({
  isOpen,
  onClose,
  verificationType,
}) => {
  const [step, setStep] = useState<KycStep>("document");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentFaceValid, setDocumentFaceValid] = useState(false);
  const [liveImage, setLiveImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    confidence: number;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setStep("document");
    setDocumentFile(null);
    setPreviewUrl(null);
    setDocumentFaceValid(false);
    setLiveImage(null);
    setIsLoading(false);
    setError(null);
    setVerifyResult(null);
    onClose();
  };

  const handleDocumentUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setDocumentFaceValid(false);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setDocumentFile(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiFetch(
        buildApiUrl(API_ENDPOINTS.VALIDATE_DOCUMENT_FACE),
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        const msg =
          result.detail ||
          "No face detected in this document. Please upload a clearer image where your face is clearly visible.";
        setError(msg);
        setPreviewUrl(null);
        setDocumentFile(null);
        toast.error("Invalid document — no face detected");
        return;
      }

      setDocumentFaceValid(true);
      toast.success("Document accepted! Face detected successfully.");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not validate your document. Please try again.";
      setError(msg);
      setPreviewUrl(null);
      setDocumentFile(null);
      toast.error("Validation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLivenessVerified = (capturedImage: string) => {
    setLiveImage(capturedImage);
    setStep("verifying");
    runFaceComparison(capturedImage);
  };

  const runFaceComparison = async (capturedImage: string) => {
    if (!documentFile) {
      setError("Document file is missing. Please go back and re-upload.");
      setStep("document");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const b64 = capturedImage.includes(",")
        ? capturedImage.split(",")[1]
        : capturedImage;
      const byteChars = atob(b64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNums[i] = byteChars.charCodeAt(i);
      }
      const liveBlob = new Blob([new Uint8Array(byteNums)], {
        type: "image/jpeg",
      });
      const liveFile = new File([liveBlob], "live.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("pan_card_image", documentFile);
      formData.append("live_image", liveFile);

      const response = await apiFetch(
        buildApiUrl(API_ENDPOINTS.VERIFY_PAN_FACE),
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        const msg =
          result.detail ||
          "Face verification failed. Please try again with a clearer photo.";
        setError(msg);
        toast.error("Face verification failed");
        setStep("liveness");
        return;
      }

      const data = result.data || {};
      const isVerified = data.verified === true;

      setVerifyResult({
        verified: isVerified,
        confidence: data.confidence ?? 0,
        message: data.message ?? result.message ?? "",
      });

      if (isVerified) {
        toast.success("Identity verified successfully!");
        localStorage.setItem("verificationCompleted", "true");
        setStep("complete");
        setTimeout(() => {
          handleClose();
          window.location.reload();
        }, 2500);
      } else {
        setError(
          `Identity could not be confirmed. Confidence: ${(data.confidence ?? 0).toFixed(1)}%. Please try again with better lighting.`,
        );
        toast.error("Face does not match the document");
        setStep("liveness");
      }
    } catch {
      setError(
        "Verification request failed. Please ensure the backend is running.",
      );
      toast.error("Verification failed");
      setStep("liveness");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      handleDocumentUpload(file);
    } else if (file) {
      setError("Please upload a JPEG or PNG image.");
    }
  };

  const stepNumber = (s: KycStep) => {
    const map: Record<KycStep, number> = {
      document: 1,
      liveness: 2,
      verifying: 3,
      complete: 3,
    };
    return map[s];
  };

  const stepDone = (n: number) => stepNumber(step) > n;
  const stepActive = (n: number) => stepNumber(step) === n;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-primary/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F8FAFC] rounded-2xl md:p-8 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border-[3px] border-primary outfit">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-charcoal-text">
              {verificationType}
            </h2>
            <p className="text-sm text-charcoal-text/70">
              Complete your identity verification
            </p>
          </div>
          <button
            onClick={handleClose}
            className="absolute md:top-4 top-2 right-4 text-charcoal-text/60 hover:text-charcoal-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 mb-6 bg-primary/10 rounded-xl">
          <div className="flex items-center justify-center gap-2">
            {[
              { n: 1, label: "Upload" },
              { n: 2, label: "Liveness" },
              { n: 3, label: "Verify" },
            ].map(({ n, label }, idx, arr) => (
              <React.Fragment key={n}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all ${
                      stepDone(n)
                        ? "bg-success"
                        : stepActive(n)
                          ? "bg-primary"
                          : "bg-light-gray"
                    }`}
                  >
                    {stepDone(n) ? "✓" : n}
                  </div>
                  <span className="text-xs text-charcoal-text/60">{label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div
                    className={`w-12 h-1 mb-4 rounded ${stepDone(n) ? "bg-success" : "bg-light-gray"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div>
              <p className="text-charcoal-text text-sm font-medium">{error}</p>
              {step === "document" && (
                <p className="text-charcoal-text/60 text-xs mt-1">
                  Tips: ensure the document photo area is clearly visible,
                  well-lit, and not blurry.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 1: Upload Document ── */}
        {step === "document" && (
          <div>
            <h3 className="text-lg font-semibold text-charcoal-text mb-1">
              Upload Document
            </h3>
            <p className="text-sm text-charcoal-text/60 mb-4">
              Upload your PAN card or government-issued ID. The document must
              have a clear photo of your face.
            </p>

            {!previewUrl || isLoading ? (
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-charcoal-text/70 text-sm font-medium">
                      Scanning document for face...
                    </p>
                  </div>
                ) : (
                  <>
                    <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-charcoal-text mb-2">
                      Upload PAN / ID Card
                    </h4>
                    <p className="text-charcoal-text/70 mb-6 text-sm">
                      Choose a clear JPEG or PNG image
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="primary"
                    >
                      <Upload className="w-5 h-5" />
                      Choose File
                    </Button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="max-w-full max-h-64 rounded-lg border border-gray-300"
                  />
                  {documentFaceValid && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {documentFaceValid && (
                  <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    <p className="text-charcoal-text">
                      Face detected in document ✓
                    </p>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => {
                      setPreviewUrl(null);
                      setDocumentFile(null);
                      setDocumentFaceValid(false);
                      setError(null);
                      fileInputRef.current?.click();
                    }}
                    variant="outline"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Re-upload
                  </Button>
                  {documentFaceValid && (
                    <Button
                      onClick={() => setStep("liveness")}
                      variant="success"
                    >
                      Continue to Liveness →
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Liveness Challenge ── */}
        {step === "liveness" && (
          <div>
            <h3 className="text-lg font-semibold text-charcoal-text mb-1">
              Liveness Check
            </h3>
            <p className="text-sm text-charcoal-text/60 mb-4">
              We need to confirm you are a real person. Complete the challenges
              shown below.
            </p>

            <LivenessWebcam
              onVerified={(image) => {
                setLiveImage(image);
                handleLivenessVerified(image);
              }}
              onError={(err) => {
                setError(err);
                toast.error(err);
              }}
            />

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setStep("document");
                  setError(null);
                }}
                className="text-sm text-charcoal-text/50 hover:text-charcoal-text"
              >
                ← Back to document upload
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Verifying (auto) ── */}
        {step === "verifying" && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-charcoal-text mb-2">
              Verifying Identity...
            </h3>
            <p className="text-charcoal-text/60 text-sm">
              Comparing your live photo with the document. This takes a few
              seconds.
            </p>
          </div>
        )}

        {/* ── Step 4: Complete ── */}
        {step === "complete" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-charcoal-text mb-2">
              Identity Verified!
            </h3>
            {verifyResult && (
              <p className="text-charcoal-text/70 text-sm mb-2">
                Confidence: {verifyResult.confidence.toFixed(1)}%
              </p>
            )}
            <p className="text-charcoal-text/60 text-sm mb-4">
              Your credential NFT has been minted and added to your dashboard.
            </p>
            <div className="animate-pulse text-primary text-sm">
              Updating dashboard...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KycModal;
