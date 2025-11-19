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
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-light-gray -z-10">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
              {/* Step Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all duration-300
                  ${isCompleted 
                    ? 'bg-success text-white shadow-lg scale-110' 
                    : isCurrent 
                    ? 'bg-primary text-white shadow-lg scale-110 ring-4 ring-primary/20' 
                    : 'bg-light-gray text-charcoal-text/40'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-[120px]">
                <p
                  className={`
                    text-xs font-semibold transition-colors duration-300
                    ${isCompleted || isCurrent 
                      ? 'text-charcoal-text' 
                      : 'text-charcoal-text/40'
                    }
                  `}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p
                    className={`
                      text-[10px] mt-1 transition-colors duration-300
                      ${isCompleted || isCurrent 
                        ? 'text-charcoal-text/60' 
                        : 'text-charcoal-text/30'
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

