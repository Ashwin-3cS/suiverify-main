import React, { useState } from 'react';
import { ChevronLeft, FileText, CreditCard, BookOpen, Car, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { colors } from '@/app/brand';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  available: boolean;
}

interface DocumentTypeSelectionStepProps {
  country: Country;
  onNext: (documentType: DocumentType) => void;
  onBack: () => void;
}

const getDocumentTypesForCountry = (countryCode: string): DocumentType[] => {
  switch (countryCode) {
    case 'IN':
      return [
        {
          id: 'aadhaar',
          name: 'National ID (Aadhaar)',
          description: 'Biometric identity document issued by UIDAI',
          icon: <FileText className="w-6 h-6" />,
          features: ['Biometric verification', 'Residence proof', 'Government database linkage'],
          available: true
        },
        {
          id: 'pan',
          name: 'PAN Card',
          description: 'Permanent Account Number for tax identification',
          icon: <CreditCard className="w-6 h-6" />,
          features: ['Tax ID verification', 'Age verification', 'Income tax compliance'],
          available: true
        },
        {
          id: 'passport',
          name: 'Passport',
          description: 'International travel document',
          icon: <BookOpen className="w-6 h-6" />,
          features: ['International identity', 'Citizenship proof', 'Travel authorization'],
          available: false
        },
        {
          id: 'driving_license',
          name: "Driver's License",
          description: 'State-issued driving permit',
          icon: <Car className="w-6 h-6" />,
          features: ['Age verification', 'Address proof', 'Driving authorization'],
          available: false
        }
      ];
    default:
      return [
        {
          id: 'passport',
          name: 'Passport',
          description: 'International travel document',
          icon: <BookOpen className="w-6 h-6" />,
          features: ['International identity', 'Citizenship proof', 'Travel authorization'],
          available: false
        },
        {
          id: 'driving_license',
          name: "Driver's License",
          description: 'Government-issued driving permit',
          icon: <Car className="w-6 h-6" />,
          features: ['Age verification', 'Address proof', 'Driving authorization'],
          available: false
        },
        {
          id: 'national_id',
          name: 'National ID',
          description: 'Government-issued identity document',
          icon: <FileText className="w-6 h-6" />,
          features: ['Identity verification', 'Citizenship proof', 'Government database linkage'],
          available: false
        }
      ];
  }
};

const DocumentTypeSelectionStep: React.FC<DocumentTypeSelectionStepProps> = ({ 
  country, 
  onNext, 
  onBack 
}) => {
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const documentTypes = getDocumentTypesForCountry(country.code);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocument && selectedDocument.available) {
      onNext(selectedDocument);
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
          Select Document Type
        </h2>
      </div>

      <div className="space-y-6">
        {/* Country Header */}
        <div className="flex items-center gap-3 p-3 rounded-xl" 
             style={{ backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.primary}30` }}>
          <span className="text-2xl">{country.flag}</span>
          <div>
            <h3 className="font-semibold" style={{ color: colors.white }}>
              {country.name}
            </h3>
            <p className="text-sm" style={{ color: colors.lightBlue }}>
              Select document type for verification
            </p>
          </div>
        </div>

        {/* Document Type Cards */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold" style={{ color: colors.white }}>
            Valid government issued documents:
          </h4>
          
          {documentTypes.map((docType) => (
            <motion.div
              key={docType.id}
              whileHover={{ scale: docType.available ? 1.02 : 1 }}
              whileTap={{ scale: docType.available ? 0.98 : 1 }}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedDocument?.id === docType.id 
                  ? 'border-opacity-100' 
                  : 'border-opacity-30'
              } ${
                !docType.available 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:border-opacity-60'
              }`}
              style={{ 
                backgroundColor: selectedDocument?.id === docType.id 
                  ? `${colors.primary}15` 
                  : `${colors.primary}05`,
                borderColor: selectedDocument?.id === docType.id 
                  ? colors.primary 
                  : `${colors.primary}30`
              }}
              onClick={() => {
                if (docType.available) {
                  setSelectedDocument(docType);
                }
              }}
            >
              <div className="flex items-start gap-4">
                {/* Radio Button */}
                <div className="flex-shrink-0 mt-1">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedDocument?.id === docType.id ? 'border-opacity-100' : 'border-opacity-50'
                    }`}
                    style={{ borderColor: colors.primary }}
                  >
                    {selectedDocument?.id === docType.id && (
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      />
                    )}
                  </div>
                </div>

                {/* Document Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div style={{ color: colors.primary }}>
                      {docType.icon}
                    </div>
                    <h5 className="font-semibold" style={{ color: colors.white }}>
                      {docType.name}
                      {!docType.available && (
                        <span className="ml-2 text-xs px-2 py-1 rounded-full" 
                              style={{ backgroundColor: '#6b7280', color: colors.white }}>
                          Coming Soon
                        </span>
                      )}
                    </h5>
                  </div>
                  
                  <p className="text-sm mb-3" style={{ color: colors.lightBlue }}>
                    {docType.description}
                  </p>
                  
                  <div className="space-y-1">
                    {docType.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-3 h-3" style={{ color: colors.primary }} />
                        <span className="text-xs" style={{ color: colors.lightBlue }}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <button
          type="submit"
          disabled={!selectedDocument || !selectedDocument.available}
          className="w-full py-3 px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{ background: colors.gradients.primary }}
        >
          {selectedDocument && !selectedDocument.available 
            ? 'Coming Soon' 
            : 'Continue with Selected Document'
          }
        </button>

        {/* Info Note */}
        <div className="p-3 rounded-xl" 
             style={{ backgroundColor: `${colors.primary}05`, border: `1px solid ${colors.primary}20` }}>
          <p className="text-xs" style={{ color: colors.lightBlue }}>
            💡 More document types will be added soon. Currently supporting {country.name} documents with government API integration.
          </p>
        </div>
      </div>
    </form>
  );
};

export default DocumentTypeSelectionStep;
