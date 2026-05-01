import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2, ChevronLeft, CheckCircle, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { colors } from '@/app/brand';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/app/utils/api-client';
import { ExtractedDataModal } from '../modals/ExtractedDataModal';

interface AadhaarData {
  name?: string;
  dob?: string;
  gender?: string;
  phone_number?: string;
  address?: string;
  aadhaar_number?: string;
  aadhaar_photo_base64?: string;
}

interface AadhaarUploadStepProps {
  onNext: () => void;
  onBack: () => void;
  onFileUpload: (data: AadhaarData) => void;
}

const AadhaarUploadStep: React.FC<AadhaarUploadStepProps> = ({ onNext, onBack, onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aadhaarData, setAadhaarData] = useState<AadhaarData | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleApiCall = async (url: string, formData: FormData) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const urlWithTimestamp = `${url}?t=${timestamp}`;

      const response = await apiFetch(urlWithTimestamp, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: formData,
      });

      const result = await response.json();

      return result;
    } catch (err) {
      console.error('API call failed:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Network error: Please ensure the backend server is running');
      }
      throw err;
    }
  };

  const handleAadhaarUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(' Processing file:', file.name, file.size, 'bytes');

      // STEP 1: Convert uploaded file to base64 (full size) - run in parallel with API call
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => {
          const base64String = e.target?.result as string;
          const base64Data = base64String.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          console.log(' Full image base64 created:', base64Data.length, 'characters');
          console.log(' Full image decoded size:', Math.floor(base64Data.length * 0.75), 'bytes');
          resolve(base64Data);
        };
        reader.readAsDataURL(file);
      });

      // STEP 2: Call backend API to extract Aadhaar text data (name, DOB, etc.)
      console.log(' Calling backend API to extract Aadhaar data...');
      const formData = new FormData();
      formData.append('file', file);
      const result = await handleApiCall(buildApiUrl(API_ENDPOINTS.EXTRACT_AADHAAR_DATA), formData);

      // STEP 3: Wait for full image base64 to complete
      const fullImageBase64 = await base64Promise;

      console.log(' Backend API returned extracted data');
      console.log(' Replacing backend image with full-size uploaded image');

      if (result.data) {
        const data = result.data as AadhaarData;

        // Use backend's extracted text data BUT replace with full-size image
        const completeData: AadhaarData = {
          ...data,  // Use real extracted name, DOB, address, etc. from backend
          aadhaar_photo_base64: fullImageBase64  // Replace with full-size image!
        };

        console.log(' Complete Aadhaar data prepared:', {
          name: completeData.name,
          dob: completeData.dob,
          phone_number: completeData.phone_number,
          aadhaar_number: completeData.aadhaar_number,
          image_size: `${fullImageBase64.length} chars (${Math.floor(fullImageBase64.length * 0.75)} bytes)`
        });

        setAadhaarData(completeData);
        onFileUpload(completeData);
      } else {
        setError(result.message || 'Failed to process Aadhaar image.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while processing the Aadhaar image';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      handleAadhaarUpload(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarData) {
      onNext();
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="w-full"
      >
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg transition-colors hover:bg-primary/10 bg-primary/5"
          >
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-charcoal-text">Upload Aadhaar Card</h2>
            <p className="text-sm text-charcoal-text/60 mt-1">Upload a clear image of your Aadhaar card</p>
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
          {aadhaarData && !error && (
            <div className="p-5 rounded-lg bg-success/10 border border-success/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <h4 className="font-semibold text-charcoal-text">Aadhaar Data Extracted Successfully</h4>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsViewModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Button>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!previewUrl ? (
            <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${error ? 'border-error/50 bg-error/5' : 'border-primary/30 bg-primary/5 hover:border-primary/50'
              }`}>
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className={`w-10 h-10 ${error ? 'text-error' : 'text-primary'}`} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-charcoal-text">Upload Aadhaar Card</h3>
              <p className="mb-8 text-charcoal-text/70">Choose a clear image of your Aadhaar card (JPG, PNG)</p>

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
                    alt="Aadhaar preview"
                    className="max-w-full mx-auto max-h-64 rounded-lg border-2 border-primary/30 shadow-lg"
                  />
                  <div className="absolute top-2 right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-success font-semibold mb-4"> Aadhaar card uploaded successfully</p>

              <button
                type="button"
                onClick={() => { setPreviewUrl(null); setAadhaarData(null); setError(null); }}
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
              disabled={!aadhaarData || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting data...
                </span>
              ) : (
                'Next: Face Verification'
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Extracted Data Modal */}
      {aadhaarData && (
        <ExtractedDataModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          documentType="aadhaar"
          data={aadhaarData}
        />
      )}
    </>
  );
};

export default AadhaarUploadStep;
