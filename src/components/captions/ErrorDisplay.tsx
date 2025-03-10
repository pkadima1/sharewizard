
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onTryAgainClick: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onTryAgainClick
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Generation Failed</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{error}</p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Start Over
        </Button>
        <Button
          onClick={onTryAgainClick}
        >
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
