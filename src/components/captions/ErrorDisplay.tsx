
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ErrorDisplayProps {
  error: string;
  onTryAgainClick: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onTryAgainClick
}) => {
  const handleTryAgain = () => {
    toast.info("Attempting to generate captions again...");
    onTryAgainClick();
  };

  // Check if the error is CORS related
  const isCorsError = error.toLowerCase().includes('cors') || error.toLowerCase().includes('connection');

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Generation Failed</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">{error}</p>
      
      {isCorsError && (
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            This often happens due to browser security settings. Try using a different browser or refreshing the page.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
        <Button
          onClick={handleTryAgain}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
