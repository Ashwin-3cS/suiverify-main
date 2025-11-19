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
          className="p-2 rounded-lg transition-colors hover:bg-primary/10 bg-primary/5"
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-charcoal-text">Select Your Country</h2>
          <p className="text-sm text-charcoal-text/60 mt-1">Choose where your document was issued</p>
        </div>
      </div>

      <div className="space-y-6 mt-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Globe className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-charcoal-text">
            Choose your document issuing country
          </h3>
          <p className="text-sm text-charcoal-text/70">
            Select the country that issued your government documents
          </p>
        </div>

        {/* Country Dropdown */}
        <div className="relative">
          <label className="block text-sm font-semibold mb-3 text-charcoal-text">
            Country
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3.5 rounded-lg border-2 border-primary/30 bg-white text-left flex items-center justify-between transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <div className="flex items-center gap-3">
              {selectedCountry ? (
                <>
                  <span className="text-2xl">{selectedCountry.flag}</span>
                  <span className="text-charcoal-text font-medium">{selectedCountry.name}</span>
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5 text-charcoal-text/40" />
                  <span className="text-charcoal-text/60">Select a country</span>
                </>
              )}
            </div>
            <ChevronDown 
              className={`w-5 h-5 transition-transform text-primary ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-lg border-2 border-primary/20 bg-white shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    selectedCountry?.code === country.code 
                      ? 'bg-primary/10 text-charcoal-text font-medium' 
                      : 'text-charcoal-text hover:bg-ghost-white'
                  }`}
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
            className="p-4 rounded-lg bg-primary/10 border border-primary/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedCountry.flag}</span>
              <div>
                <h4 className="font-semibold text-charcoal-text">
                  {selectedCountry.name}
                </h4>
                <p className="text-sm text-charcoal-text/70">
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
          className="w-full py-3.5 px-6 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary border-[3px] border-primary shadow-[0.1em_0.1em_0_0_rgb(0_0_0)] hover:shadow-[0.15em_0.15em_0_0_rgb(0_0_0)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] active:translate-x-[0.05em] active:translate-y-[0.05em] active:shadow-[0.05em_0.05em_0_0_rgb(0_0_0)]"
        >
          Continue
        </button>
      </div>
    </form>
  );
};

export default CountrySelectionStep;
