import React, { useRef, useState } from 'react';
import { ChevronLeft, Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { colors } from '@/app/brand';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

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

  const handleApiCall = async (url: string, formData: FormData) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const urlWithTimestamp = `${buildApiUrl(url)}?t=${timestamp}`;
      
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

  const handleAadhaarUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Commented out API call for testing - using mock data instead
      // const formData = new FormData();
      // formData.append('file', file);
      // const result = await handleApiCall('/api/aadhaar/extract-aadhaar-data', formData);
      
      console.log('🚀 Skipping Aadhaar data extraction API call for testing');
      console.log('📄 Using uploaded file directly:', file.name, file.size, 'bytes');
      
      // Convert file to base64 for encryption
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        const base64Data = base64String.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        
        // Create mock Aadhaar data with the uploaded image
        const mockData: AadhaarData = {
          name: 'Test User',
          dob: '01/01/1990',
          gender: 'M',
          phone_number: '9876543210',
          address: 'Test Address, Test City',
          aadhaar_number: '1234 5678 9012',
          aadhaar_photo_base64: base64Data
        };
        
        console.log('📋 Mock Aadhaar data created:', {
          ...mockData,
          aadhaar_photo_base64: `${base64Data.substring(0, 50)}...` // Log only first 50 chars
        });
        
        setAadhaarData(mockData);
        onFileUpload(mockData);
      };
      
      reader.readAsDataURL(file);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    <form
      onSubmit={handleSubmit}
      className="w-full"
    >
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
          Upload Aadhaar Card
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
        {aadhaarData && !error && (
          <div className="p-4 rounded-2xl" style={{ backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.primary}30` }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5" style={{ color: colors.primary }} />
              <h4 className="font-semibold" style={{ color: colors.white }}>Aadhaar Data Extracted</h4>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {aadhaarData.aadhaar_number && (
                <div>
                  <span className="font-medium" style={{ color: colors.primary }}>Aadhaar Number:</span>
                  <span className="ml-2" style={{ color: colors.lightBlue }}>{aadhaarData.aadhaar_number}</span>
                </div>
              )}
              {aadhaarData.phone_number && (
                <div>
                  <span className="font-medium" style={{ color: colors.primary }}>Phone Number:</span>
                  <span className="ml-2" style={{ color: colors.lightBlue }}>{aadhaarData.phone_number}</span>
                </div>
              )}
              {aadhaarData.dob && (
                <div>
                  <span className="font-medium" style={{ color: colors.primary }}>Date of Birth:</span>
                  <span className="ml-2" style={{ color: colors.lightBlue }}>{aadhaarData.dob}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!previewUrl ? (
          <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-colors"
               style={{ 
                 borderColor: error ? '#ef4444' : `${colors.primary}40`,
                 backgroundColor: error ? '#ef444410' : `${colors.primary}05`
               }}>
            <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: error ? '#ef4444' : colors.primary }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.white }}>Upload Aadhaar Card</h3>
            <p className="mb-6" style={{ color: colors.lightBlue }}>Choose a clear image of your Aadhaar card (JPG, PNG)</p>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="inline-flex items-center underline underline-offset-2 gap-2 px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isLoading ? 'Processing...' : 'Choose File'}
            </button>
            
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
            <div className="relative inline-block mx-auto">
              <img
                src={previewUrl}
                alt="Aadhaar preview"
                className="max-w-full mx-auto max-h-48 rounded-2xl border-2"
                style={{ borderColor: `${colors.primary}40` }}
              />
            </div>
            <p className="font-medium mb-2" style={{ color: colors.primary }}></p>
            
            <button
              type="button"
              onClick={() => {setPreviewUrl(null); setAadhaarData(null); setError(null);}}
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: colors.primary }}
            >
              Upload Different Image
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={!aadhaarData || isLoading}
          className="w-full py-3 px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{ background: colors.gradients.primary }}
        >
         {isLoading ? "Extracting  data..." : "Next"}
        </button>
      </div>
    </form>
  );
};

export default AadhaarUploadStep;
