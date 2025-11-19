import React, { useState } from 'react';
import { ChevronLeft, FileText, CreditCard, BookOpen, Car, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { colors } from '@/app/brand';
import { Button } from '@/components/ui/button';

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
     
        {/* Document Type Cards */}
        <div className="space-y-4">
      
          {documentTypes.map((docType) => (
            <motion.div
              key={docType.id}
              whileHover={{ scale: docType.available ? 1.01 : 1, y: docType.available ? -2 : 0 }}
              whileTap={{ scale: docType.available ? 0.99 : 1 }}
              className={`p-5 rounded-lg border-2 transition-all cursor-pointer ${
                selectedDocument?.id === docType.id 
                  ? 'border-secondary bg-secondary/10' 
                  : 'border-secondary/30 bg-white hover:border-secondary/50'
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
                      selectedDocument?.id === docType.id ? 'border-secondary' : 'border-secondary/50'
                    }`}
                  >
                    {selectedDocument?.id === docType.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    )}
                  </div>
                </div>

                {/* Document Info */}
                <div className="">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-secondary">
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
        <Button
          type="submit"
          variant="secondary"
          disabled={!selectedDocument || !selectedDocument.available}
          className="w-full"
          size="lg"
        >
          {selectedDocument && !selectedDocument.available 
            ? 'Coming Soon' 
            : 'Continue with Selected Document'
          }
        </Button>
      </div>
    </form>
  );
};

export default DocumentTypeSelectionStep;
