import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Eye, Edit3, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { colors } from '@/app/brand';

interface AadhaarData {
  aadhaar_number?: string;
  name?: string;
  dob?: string;
  gender?: string;
  phone_number?: string;
  address?: string;
}

interface PANData {
  pan_number?: string;
  name?: string;
  father_name?: string;
  dob?: string;
}

interface ExtractedDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'aadhaar' | 'pan';
  data: AadhaarData | PANData;
  mode?: 'view' | 'edit';
  onSave?: (editedData: AadhaarData | PANData) => void;
  isLoading?: boolean;
}

export const ExtractedDataModal: React.FC<ExtractedDataModalProps> = ({
  isOpen,
  onClose,
  documentType,
  data,
  mode = 'view',
  onSave,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [editedData, setEditedData] = useState<AadhaarData | PANData>(data);

  // Update editedData when data changes
  useEffect(() => {
    setEditedData(data);
  }, [data]);

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(mode === 'edit');
      setEditedData(data);
    }
  }, [isOpen, mode, data]);

  const handleSave = () => {
    if (onSave) {
      onSave(editedData);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white/95 backdrop-blur-sm rounded-2xl border-[3px] border-primary/30 shadow-[0.2em_0.2em] max-w-2xl w-full max-h-[90vh] overflow-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b-2 border-primary/20 p-6 flex items-center justify-between rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/15 border-2 border-success/30">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-charcoal-text">
                  {documentType === 'aadhaar' ? 'Aadhaar' : 'PAN'} Data Extracted
                </h2>
                <p className="text-sm text-charcoal-text/70 mt-1">
                  {isEditing ? 'Edit the extracted information' : 'Review the extracted information from your document'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mode === 'view' && onSave && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                  title={isEditing ? 'Cancel' : 'Edit'}
                >
                  <Edit3 className="w-5 h-5 text-charcoal-text" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <X className="w-5 h-5 text-charcoal-text" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <form className="space-y-6">
              {documentType === 'aadhaar' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(data as AadhaarData).aadhaar_number && (
                    <div className="md:col-span-2">
                      <label className="block text-left text-sm font-semibold text-charcoal-text mb-2">
                        Aadhaar Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editedData as AadhaarData).aadhaar_number || ''}
                          onChange={(e) => setEditedData({...editedData, aadhaar_number: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border-[3px] border-primary/30 bg-white text-charcoal-text text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0.1em_0.1em]"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                          <span className="text-base font-semibold text-charcoal-text">
                            {(data as AadhaarData).aadhaar_number}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {(data as AadhaarData).name && (
                    <div>
                      <label className="block text-left text-sm font-semibold text-charcoal-text mb-2">
                        Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editedData as AadhaarData).name || ''}
                          onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border-[3px] border-primary/30 bg-white text-charcoal-text text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0.1em_0.1em]"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                          <span className="text-base font-medium text-charcoal-text">
                            {(data as AadhaarData).name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {(data as AadhaarData).dob && (
                    <div>
                      <label className="block text-left text-sm font-semibold text-charcoal-text mb-2">
                        Date of Birth
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={(editedData as AadhaarData).dob ? (editedData as AadhaarData).dob!.split('/').reverse().join('-') : ''}
                          onChange={(e) => {
                            const date = e.target.value;
                            const formattedDate = date ? date.split('-').reverse().join('/') : '';
                            setEditedData({...editedData, dob: formattedDate});
                          }}
                          className="w-full px-4 py-3 rounded-xl border-[3px] border-primary/30 bg-white text-charcoal-text text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0.1em_0.1em]"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                          <span className="text-base font-medium text-charcoal-text">
                            {(data as AadhaarData).dob}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {(data as AadhaarData).phone_number && (
                    <div>
                      <label className="block text-left text-sm font-semibold text-charcoal-text mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editedData as AadhaarData).phone_number || ''}
                          onChange={(e) => setEditedData({...editedData, phone_number: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border-[3px] border-primary/30 bg-white text-charcoal-text text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0.1em_0.1em]"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                          <span className="text-base font-medium text-charcoal-text">
                            {(data as AadhaarData).phone_number}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {(data as AadhaarData).gender && (
                    <div>
                      <label className="block text-left text-sm font-semibold text-charcoal-text mb-2">
                        Gender
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editedData as AadhaarData).gender || ''}
                          onChange={(e) => setEditedData({...editedData, gender: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border-[3px] border-primary/30 bg-white text-charcoal-text text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0.1em_0.1em]"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                          <span className="text-base font-medium text-charcoal-text">
                            {(data as AadhaarData).gender}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {(data as AadhaarData).address && (
                    <div className="md:col-span-2">
                      <label className="block text-left text-sm font-semibold text-charcoal-text mb-2">
                        Address
                      </label>
                      {isEditing ? (
                        <textarea
                          value={(editedData as AadhaarData).address || ''}
                          onChange={(e) => setEditedData({...editedData, address: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border-[3px] border-primary/30 bg-white text-charcoal-text text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0.1em_0.1em] min-h-[100px] resize-none"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                          <span className="text-base font-medium text-charcoal-text">
                            {(data as AadhaarData).address}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(data as PANData).pan_number && (
                    <div>
                      <label className="block text-left text-sm font-semibold text-charcoal-text mb-2">
                        PAN Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editedData as PANData).pan_number || ''}
                          onChange={(e) => setEditedData({...editedData, pan_number: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border-[3px] border-primary/30 bg-white text-charcoal-text text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0.1em_0.1em]"
                          placeholder="Enter PAN number"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                          <span className="text-base font-semibold text-charcoal-text">
                            {(data as PANData).pan_number}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {(data as PANData).name && (
                    <div>
                      <label className="block text-left text-sm font-semibold text-charcoal-text mb-2">
                        Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editedData as PANData).name || ''}
                          onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border-[3px] border-primary/30 bg-white text-charcoal-text text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0.1em_0.1em]"
                          placeholder="Enter full name"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                          <span className="text-base font-medium text-charcoal-text">
                            {(data as PANData).name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {(data as PANData).father_name && (
                    <div>
                      <label className="block text-left text-sm font-semibold text-charcoal-text mb-2">
                        Father&apos;s Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editedData as PANData).father_name || ''}
                          onChange={(e) => setEditedData({...editedData, father_name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border-[3px] border-primary/30 bg-white text-charcoal-text text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0.1em_0.1em]"
                          placeholder="Enter father's name"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                          <span className="text-base font-medium text-charcoal-text">
                            {(data as PANData).father_name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {(data as PANData).dob && (
                    <div>
                      <label className="block text-left text-sm font-semibold text-charcoal-text mb-2">
                        Date of Birth
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={(editedData as PANData).dob ? (editedData as PANData).dob!.split('/').reverse().join('-') : ''}
                          onChange={(e) => {
                            const date = e.target.value;
                            const formattedDate = date ? date.split('-').reverse().join('/') : '';
                            setEditedData({...editedData, dob: formattedDate});
                          }}
                          className="w-full px-4 py-3 rounded-xl border-[3px] border-primary/30 bg-white text-charcoal-text text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-[0.1em_0.1em]"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                          <span className="text-base font-medium text-charcoal-text">
                            {(data as PANData).dob}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Save Button - Only show when editing */}
            {isEditing && onSave && (
              <div className="mt-6 pt-6 border-t-2 border-primary/20">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedData(data);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

