
import React, { ReactNode } from 'react';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';

export interface WizardStep {
  title: string;
  description: string;
  isCompleted: boolean;
}

interface WizardLayoutProps {
  children: ReactNode;
  currentStep: number;
  steps: WizardStep[];
  onNext?: () => void;
  onPrev?: () => void;
  isNextDisabled?: boolean;
  isGenerating?: boolean;
  hideNextButton?: boolean;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({
  children,
  currentStep,
  steps,
  onNext,
  onPrev,
  isNextDisabled = false,
  isGenerating = false,
  hideNextButton = false
}: WizardLayoutProps) => {
  return (
    <div className="flex flex-col h-full wizard-card">
      {/* Progress Steps */}
      <div className="px-4 sm:px-6 md:px-8 py-6 border-b border-gray-200 dark:border-gray-700">
        <div className="hidden md:flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center ${
                index !== steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div className="relative flex flex-col items-center group">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200
                    ${
                      index < currentStep
                        ? 'bg-primary border-primary text-white dark:text-gray-900'
                        : index === currentStep
                        ? 'border-primary text-primary dark:text-primary/80 dark:border-primary/80'
                        : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                    }`}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span 
                  className={`absolute -bottom-6 text-xs font-medium whitespace-nowrap transition-colors duration-200
                    ${index <= currentStep 
                      ? 'text-primary dark:text-primary/80' 
                      : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {step.title}
                </span>
                
                {/* Tooltip on hover */}
                <div className="absolute -bottom-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-top z-10">
                  <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-md">
                    {step.description}
                  </div>
                  <div className="w-2 h-2 bg-gray-800 dark:bg-gray-700 transform rotate-45 mx-auto -mt-1"></div>
                </div>
              </div>
              
              {index !== steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-colors duration-200 ${
                    index < currentStep
                      ? 'bg-primary dark:bg-primary/80'
                      : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Mobile Steps Indicator */}
        <div className="md:hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-primary dark:text-primary/80">
              {steps[currentStep].title}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-primary dark:bg-primary/80 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          {/* Mobile step description */}
          <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
            {steps[currentStep].description}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="px-4 sm:px-6 md:px-8 py-5 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <button
          onClick={onPrev}
          disabled={currentStep === 0 || isGenerating}
          className={`
            px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            flex items-center gap-2
            ${
              currentStep === 0 || isGenerating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        
        {!hideNextButton && (
          <button
            onClick={onNext}
            disabled={isNextDisabled || isGenerating}
            className={`
              relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              flex items-center gap-2 overflow-hidden
              ${
                isNextDisabled || isGenerating
                  ? 'bg-primary/60 dark:bg-primary/40 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 dark:bg-primary/80 dark:hover:bg-primary/70 shadow-sm hover:shadow-md'
              }`}
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                <span className="text-white">Generating...</span>
              </>
            ) : (
              <>
                <span className="text-white">
                  {currentStep === steps.length - 1 
                    ? 'Download' 
                    : currentStep === steps.length - 2 
                    ? 'Generate' 
                    : 'Next'}
                </span>
                {currentStep !== steps.length - 1 && <ArrowRight className="w-4 h-4 text-white" />}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
