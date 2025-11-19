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
          className="p-2 rounded-lg transition-colors hover:bg-primary/10 bg-primary/5"
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-charcoal-text">Select Document Type</h2>
          <p className="text-sm text-charcoal-text/60 mt-1">Choose the document you want to verify</p>
        </div>
      </div>

      <div className="space-y-6 mt-8">
        {/* Country Header */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
          <span className="text-2xl">{country.flag}</span>
          <div>
            <h3 className="font-semibold text-charcoal-text">
              {country.name}
            </h3>
            <p className="text-sm text-charcoal-text/70">
              Select document type for verification
            </p>
          </div>
        </div>

        {/* Document Type Cards */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-charcoal-text">
            Valid government issued documents:
          </h4>
          
          {documentTypes.map((docType) => (
            <motion.div
              key={docType.id}
              whileHover={{ scale: docType.available ? 1.01 : 1, y: docType.available ? -2 : 0 }}
              whileTap={{ scale: docType.available ? 0.99 : 1 }}
              className={`p-5 rounded-lg border-2 transition-all cursor-pointer ${
                selectedDocument?.id === docType.id 
                  ? 'border-primary shadow-[0.1em_0.1em_0_0_rgb(124_58_237)] bg-primary/10' 
                  : 'border-primary/30 bg-white hover:border-primary/50'
              } ${
                !docType.available 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
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
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedDocument?.id === docType.id ? 'border-primary' : 'border-primary/50'
                    }`}
                  >
                    {selectedDocument?.id === docType.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                </div>

                {/* Document Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-primary">
                      {docType.icon}
                    </div>
                    <h5 className="font-semibold text-charcoal-text">
                      {docType.name}
                      {!docType.available && (
                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-charcoal-text/20 text-charcoal-text/60">
                          Coming Soon
                        </span>
                      )}
                    </h5>
                  </div>
                  
                  <p className="text-sm mb-3 text-charcoal-text/70">
                    {docType.description}
                  </p>
                  
                  <div className="space-y-1.5">
                    {docType.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                        <span className="text-xs text-charcoal-text/70">
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
          className="w-full py-3.5 px-6 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary border-[3px] border-primary shadow-[0.1em_0.1em_0_0_rgb(0_0_0)] hover:shadow-[0.15em_0.15em_0_0_rgb(0_0_0)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] active:translate-x-[0.05em] active:translate-y-[0.05em] active:shadow-[0.05em_0.05em_0_0_rgb(0_0_0)]"
        >
          {selectedDocument && !selectedDocument.available 
            ? 'Coming Soon' 
            : 'Continue with Selected Document'
          }
        </button>

        {/* Info Note */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-charcoal-text/70 leading-relaxed">
            💡 More document types will be added soon. Currently supporting {country.name} documents with government API integration.
          </p>
        </div>
      </div>
    </form>
  );
};

export default DocumentTypeSelectionStep;
