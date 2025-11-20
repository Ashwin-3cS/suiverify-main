import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Edit3,
  Save,
  X,
  CheckCircle,
  Eye,
} from "lucide-react";
import { colors } from "@/app/brand";
import { toast } from "react-toastify";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";
import { Button } from "@/components/ui/button";
import { ExtractedDataModal } from "./ExtractedDataModal";

interface PANData {
  pan_number?: string;
  name?: string;
  father_name?: string;
  dob?: string;
  pan_photo_base64?: string;
}

interface PANUploadStepProps {
  onNext: () => void;
  onBack: () => void;
  onFileUpload: (data: PANData) => void;
}

const PANUploadStep: React.FC<PANUploadStepProps> = ({
  onNext,
  onBack,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panData, setPanData] = useState<PANData | null>(null);
  const [editedData, setEditedData] = useState<PANData>({});
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleApiCall = async (url: string, formData: FormData) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const urlWithTimestamp = `${url}?t=${timestamp}`;

      const response = await fetch(urlWithTimestamp, {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (err) {
      console.error("API call failed:", err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        throw new Error(
          "Network error: Please ensure the backend server is running"
        );
      }
      throw err;
    }
  };

  const handlePANUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("📄 Processing PAN file:", file.name, file.size, "bytes");

      // STEP 1: Convert uploaded file to base64 (full size) - run in parallel with API call
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => {
          const base64String = e.target?.result as string;
          const base64Data = base64String.split(",")[1]; // Remove data:image/jpeg;base64, prefix
          console.log(
            "📊 Full PAN image base64 created:",
            base64Data.length,
            "characters"
          );
          console.log(
            "📊 Full PAN image decoded size:",
            Math.floor(base64Data.length * 0.75),
            "bytes"
          );
          resolve(base64Data);
        };
        reader.readAsDataURL(file);
      });

      // STEP 2: Call backend API to extract PAN text data (PAN number, name, DOB, etc.)
      console.log("🔍 Calling backend API to extract PAN data...");
      const formData = new FormData();
      formData.append("file", file);
      const result = await handleApiCall(
        buildApiUrl(API_ENDPOINTS.EXTRACT_PAN_DATA),
        formData
      );

      // STEP 3: Wait for full image base64 to complete
      const fullImageBase64 = await base64Promise;

      console.log("✅ Backend API returned extracted PAN data");
      console.log("🔄 Replacing backend image with full-size uploaded image");

      if (result.data) {
        const data = result.data as PANData;

        // Use backend's extracted text data BUT replace with full-size image
        const completeData: PANData = {
          ...data, // Use real extracted PAN number, name, DOB, father's name from backend
          pan_photo_base64: fullImageBase64, // Replace with full-size image!
        };

        console.log("📋 Complete PAN data prepared:", {
          pan_number: completeData.pan_number,
          name: completeData.name,
          father_name: completeData.father_name,
          dob: completeData.dob,
          image_size: `${fullImageBase64.length} chars (${Math.floor(
            fullImageBase64.length * 0.75
          )} bytes)`,
        });

        setPanData(completeData);
        setEditedData(completeData);
        onFileUpload(completeData);

        // Show success message
        toast.success("PAN card data extracted successfully!");
      } else {
        setError(result.message || "Failed to process PAN card image.");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "An error occurred while processing the PAN card image";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      handlePANUpload(file);
    }
  };

  const handleEditSave = async (editedData: PANData) => {
    if (!editedData || isLoading) return;

    try {
      setIsLoading(true);

      // Call the correction endpoint
      const correctionData = {
        pan_number: editedData.pan_number,
        name: editedData.name,
        father_name: editedData.father_name,
        dob: editedData.dob,
        pan_photo_base64: panData?.pan_photo_base64,
      };

      console.log("🔧 Sending corrected PAN data to backend...");

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.CORRECT_PAN_DATA),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(correctionData),
        }
      );

      if (response.ok) {
        await response.json();
        setPanData(editedData);
        setEditedData(editedData);
        onFileUpload(editedData);
        setIsEditModalOpen(false);
        toast.success("PAN data corrected successfully!");
      } else {
        throw new Error("Failed to save corrections");
      }
    } catch (err) {
      console.error("Error saving corrections:", err);
      toast.error("Failed to save corrections. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (panData) {
      onNext();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg transition-colors hover:bg-primary/10 bg-primary/5"
          >
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
          <div className=" flex items-center justify-between w-full">
            <div className="">
              <h2 className="text-2xl font-bold text-charcoal-text">
                Upload PAN Card
              </h2>
              <p className="text-sm text-charcoal-text/60 mt-1">
                Upload a clear image of your PAN card
              </p>
            </div>
            {panData && !error && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsViewModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            )}
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

          {/* Upload Area */}
          {!previewUrl ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                error
                  ? "border-error/50 bg-error/5"
                  : "border-primary/30 bg-primary/5 hover:border-primary/50"
              }`}
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText
                  className={`w-10 h-10 ${
                    error ? "text-error" : "text-primary"
                  }`}
                />
              </div>
              <h3 className="text-xl font-bold mb-2 text-charcoal-text">
                Upload PAN Card
              </h3>
              <p className="mb-8 text-charcoal-text/70">
                Choose a clear image of your PAN card (JPG, PNG)
              </p>

              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="primary"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Choose File
                  </>
                )}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg, image/png"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="relative inline-block mx-auto mb-4">
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="PAN card preview"
                    className="max-w-full mx-auto max-h-64 rounded-lg border-2 border-primary/30 shadow-lg"
                  />
                  <div className="absolute top-2 right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-success font-semibold mb-4">
                ✓ PAN card uploaded successfully
              </p>
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setPanData(null);
                  setError(null);
                }}
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors underline underline-offset-2"
              >
                Upload Different Image
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!panData || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Next: Face Verification"
              )}
            </Button>
          </div>

          {/* OTP Verification Section - COMMENTED OUT */}
          {/* 
        <div className="p-4 rounded-2xl" style={{ backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.primary}30` }}>
          <h4 className="font-semibold mb-3" style={{ color: colors.white }}>OTP Verification</h4>
          <p className="text-sm mb-4" style={{ color: colors.lightBlue }}>
            We'll send an OTP to verify your PAN card details
          </p>
          <button
            type="button"
            className="w-full py-2 px-4 rounded-lg font-medium transition-all text-white text-sm"
            style={{ background: colors.gradients.secondary }}
          >
            Send OTP
          </button>
        </div>
        */}
        </div>
      </form>

    {/* View Data Modal */}
    {panData && (
      <ExtractedDataModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        documentType="pan"
        data={panData}
        mode="view"
      />
    )}

    {/* Edit Data Modal */}
    {panData && (
      <ExtractedDataModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        documentType="pan"
        data={panData}
        mode="edit"
        onSave={handleEditSave}
        isLoading={isLoading}
      />
    )}
    </>
  );
};

export default PANUploadStep;
