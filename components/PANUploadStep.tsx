import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2, ChevronLeft, Edit3, Save, X, CheckCircle } from 'lucide-react';
import { colors } from '@/app/brand';
import { toast } from 'react-toastify';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

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
  onFileUpload: (data: PANData, file?: File) => void;
}

const PANUploadStep: React.FC<PANUploadStepProps> = ({ onNext, onBack, onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panData, setPanData] = useState<PANData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<PANData>({});

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

  const handlePANUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📄 Processing PAN file:', file.name, file.size, 'bytes');
      
      // STEP 1: Convert uploaded file to base64 (full size) - run in parallel with API call
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => {
          const base64String = e.target?.result as string;
          const base64Data = base64String.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          console.log('📊 Full PAN image base64 created:', base64Data.length, 'characters');
          console.log('📊 Full PAN image decoded size:', Math.floor(base64Data.length * 0.75), 'bytes');
          resolve(base64Data);
        };
        reader.readAsDataURL(file);
      });
      
      // STEP 2: Call backend API to extract PAN text data (PAN number, name, DOB, etc.)
      console.log('🔍 Calling backend API to extract PAN data...');
      const formData = new FormData();
      formData.append('file', file);
      const result = await handleApiCall(buildApiUrl(API_ENDPOINTS.EXTRACT_PAN_DATA), formData);
      
      // STEP 3: Wait for full image base64 to complete
      const fullImageBase64 = await base64Promise;
      
      console.log('✅ Backend API returned extracted PAN data');
      console.log('🔄 Replacing backend image with full-size uploaded image');
      
      if (result.data) {
        const data = result.data as PANData;
        
        // Use backend's extracted text data BUT replace with full-size image
        const completeData: PANData = {
          ...data,  // Use real extracted PAN number, name, DOB, father's name from backend
          pan_photo_base64: fullImageBase64  // Replace with full-size image!
        };
        
        console.log('📋 Complete PAN data prepared:', {
          pan_number: completeData.pan_number,
          name: completeData.name,
          father_name: completeData.father_name,
          dob: completeData.dob,
          image_size: `${fullImageBase64.length} chars (${Math.floor(fullImageBase64.length * 0.75)} bytes)`
        });
        
        setPanData(completeData);
        setEditedData(completeData);
        setUploadedFile(file);
        onFileUpload(completeData, file);
        
        // Show success message
        toast.success('PAN card data extracted successfully!');
      } else {
        setError(result.message || 'Failed to process PAN card image.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while processing the PAN card image';
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

  const handleEditSave = async () => {
    if (!editedData || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Call the correction endpoint
      const correctionData = {
        pan_number: editedData.pan_number,
        name: editedData.name,
        father_name: editedData.father_name,
        dob: editedData.dob,
        pan_photo_base64: panData?.pan_photo_base64
      };
      
      console.log('🔧 Sending corrected PAN data to backend...');
      
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CORRECT_PAN_DATA), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(correctionData),
      });
      
      if (response.ok) {
        await response.json();
        setPanData(editedData);
        onFileUpload(editedData, uploadedFile || undefined);
        setIsEditing(false);
        toast.success('PAN data corrected successfully!');
      } else {
        throw new Error('Failed to save corrections');
      }
    } catch (err) {
      console.error('Error saving corrections:', err);
      toast.error('Failed to save corrections. Please try again.');
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
    <form onSubmit={handleSubmit} className="w-full">
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
          Upload PAN Card
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

        {/* Editable PAN Data Display */}
        {panData && !error && (
          <div className="p-4 rounded-2xl" style={{ backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.primary}30` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" style={{ color: colors.primary }} />
                <h4 className="font-semibold" style={{ color: colors.white }}>
                  Review extracted details and edit if necessary
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
              >
                <Edit3 className="w-4 h-4" />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* PAN Number */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                  PAN Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.pan_number || ''}
                    onChange={(e) => setEditedData({...editedData, pan_number: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ 
                      backgroundColor: `${colors.primary}05`, 
                      borderColor: `${colors.primary}30`,
                      color: colors.white
                    }}
                    placeholder="Enter PAN number"
                  />
                ) : (
                  <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: `${colors.primary}05`, color: colors.lightBlue }}>
                    {panData.pan_number || 'Not extracted'}
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.name || ''}
                    onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ 
                      backgroundColor: `${colors.primary}05`, 
                      borderColor: `${colors.primary}30`,
                      color: colors.white
                    }}
                    placeholder="Enter full name"
                  />
                ) : (
                  <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: `${colors.primary}05`, color: colors.lightBlue }}>
                    {panData.name || 'Not extracted'}
                  </div>
                )}
              </div>

              {/* Father's Name */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                  Father&apos;s Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.father_name || ''}
                    onChange={(e) => setEditedData({...editedData, father_name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ 
                      backgroundColor: `${colors.primary}05`, 
                      borderColor: `${colors.primary}30`,
                      color: colors.white
                    }}
                    placeholder="Enter father's name"
                  />
                ) : (
                  <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: `${colors.primary}05`, color: colors.lightBlue }}>
                    {panData.father_name || 'Not extracted'}
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary }}>
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedData.dob ? editedData.dob.split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      const date = e.target.value;
                      const formattedDate = date ? date.split('-').reverse().join('/') : '';
                      setEditedData({...editedData, dob: formattedDate});
                    }}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ 
                      backgroundColor: `${colors.primary}05`, 
                      borderColor: `${colors.primary}30`,
                      color: colors.white
                    }}
                  />
                ) : (
                  <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: `${colors.primary}05`, color: colors.lightBlue }}>
                    {panData.dob || 'Not extracted'}
                  </div>
                )}
              </div>

              {/* Save Changes Button */}
              {isEditing && (
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-all disabled:opacity-50 text-white text-sm"
                  style={{ background: colors.gradients.primary }}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
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
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.white }}>Upload PAN Card</h3>
            <p className="mb-6" style={{ color: colors.lightBlue }}>Choose a clear image of your PAN card (JPG, PNG)</p>
            
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
                alt="PAN card preview"
                className="max-w-full mx-auto max-h-48 rounded-2xl border-2"
                style={{ borderColor: `${colors.primary}40` }}
              />
              <button
                type="button"
                onClick={() => {setPreviewUrl(null); setPanData(null); setError(null); setIsEditing(false);}}
                className="text-sm transition-colors hover:opacity-80 mt-2"
                style={{ color: colors.primary }}
              >
                Upload Different Image
              </button>
            </div>
          </div>
        )}

        {/* Next Button */}
        <button
          type="submit"
          disabled={!panData || isLoading}
          className="w-full py-3 px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{ background: colors.gradients.primary }}
        >
          {isLoading ? "Processing..." : "Next"}
        </button>

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
  );
};

export default PANUploadStep;
