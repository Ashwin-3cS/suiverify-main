import React, { useState } from 'react';
import { ChevronLeft, Globe, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { colors } from '@/app/brand';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface CountrySelectionStepProps {
  onNext: (country: Country) => void;
  onBack: () => void;
}

const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
];

const CountrySelectionStep: React.FC<CountrySelectionStepProps> = ({ onNext, onBack }) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCountry) {
      onNext(selectedCountry);
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
          Select Your Country
        </h2>
      </div>

      <div className="space-y-6">
        <div className="text-center mb-8">
          <Globe className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.white }}>
            Choose your document issuing country
          </h3>
          <p className="text-sm" style={{ color: colors.lightBlue }}>
            Select the country that issued your government documents
          </p>
        </div>

        {/* Country Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
            Country
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-colors"
            style={{ 
              backgroundColor: `${colors.primary}05`, 
              borderColor: `${colors.primary}30`,
              color: colors.white
            }}
          >
            <div className="flex items-center gap-3">
              {selectedCountry ? (
                <>
                  <span className="text-2xl">{selectedCountry.flag}</span>
                  <span>{selectedCountry.name}</span>
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5" style={{ color: colors.lightBlue }} />
                  <span style={{ color: colors.lightBlue }}>Select a country</span>
                </>
              )}
            </div>
            <ChevronDown 
              className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: colors.primary }}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-lg z-50 max-h-60 overflow-y-auto"
              style={{ 
                backgroundColor: colors.darkNavy, 
                borderColor: `${colors.primary}30`
              }}
            >
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:opacity-80 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  style={{ 
                    backgroundColor: selectedCountry?.code === country.code ? `${colors.primary}20` : 'transparent',
                    color: colors.white
                  }}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span>{country.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Selected Country Preview */}
        {selectedCountry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl"
            style={{ backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.primary}30` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedCountry.flag}</span>
              <div>
                <h4 className="font-semibold" style={{ color: colors.white }}>
                  {selectedCountry.name}
                </h4>
                <p className="text-sm" style={{ color: colors.lightBlue }}>
                  Documents from this country will be verified
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Continue Button */}
        <button
          type="submit"
          disabled={!selectedCountry}
          className="w-full py-3 px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{ background: colors.gradients.primary }}
        >
          Continue
        </button>
      </div>
    </form>
  );
};

export default CountrySelectionStep;
