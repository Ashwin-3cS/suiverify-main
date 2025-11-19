import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  className?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, className = '' }) => {
  const currentIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-start justify-between relative px-2">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-8 right-8 h-[2px] bg-light-gray/50 -z-10 rounded-full">
          {/* Progress Line Fill */}
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary to-secondary transition-all duration-700 ease-out rounded-full relative overflow-hidden"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          >
            {/* Shimmer effect on progress line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
              {/* Step Circle Container */}
              <div className="relative">
                {/* Outer ring for current step */}
                {isCurrent && (
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" style={{ transform: 'scale(1.5)' }}></div>
                )}
                
                {/* Step Circle */}
                <div
                  className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                    transition-all duration-500 ease-out
                    ${isCompleted 
                      ? 'bg-success text-white shadow-lg shadow-success/30 scale-100 border-2 border-success' 
                      : isCurrent 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110 border-2 border-primary ring-4 ring-primary/15' 
                      : 'bg-white text-charcoal-text/40 border-2 border-light-gray scale-100'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 stroke-[3]" />
                  ) : (
                    <span className="text-base">{index + 1}</span>
                  )}
                  
                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                  )}
                </div>
              </div>

              {/* Step Label */}
              <div className="mt-4 text-center max-w-[140px]">
                <p
                  className={`
                    text-sm font-bold transition-all duration-300
                    ${isCompleted 
                      ? 'text-success' 
                      : isCurrent 
                      ? 'text-primary' 
                      : 'text-charcoal-text/40'
                    }
                  `}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p
                    className={`
                      text-xs mt-1.5 transition-all duration-300 leading-tight
                      ${isCompleted 
                        ? 'text-charcoal-text/70' 
                        : isCurrent 
                        ? 'text-charcoal-text/70 font-medium' 
                        : 'text-charcoal-text/40'
                      }
                    `}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;

