
import { useState, useEffect, useCallback } from 'react';
import { GeneratedCaption, CaptionResponse, generateCaptions } from '@/services/openaiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

interface UseCaptionGenerationProps {
  selectedNiche: string;
  selectedPlatform: string;
  selectedGoal: string;
  selectedTone: string;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  postIdea?: string;
}

export const useCaptionGeneration = ({
  selectedNiche,
  selectedPlatform,
  selectedGoal,
  selectedTone,
  isGenerating,
  setIsGenerating,
  postIdea
}: UseCaptionGenerationProps) => {
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [requestsRemaining, setRequestsRemaining] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { checkRequestAvailability } = useAuth();

  // Maximum number of automatic retries
  const MAX_RETRIES = 3;
  
  // Exponential backoff delay calculation
  const getRetryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000);

  // Function to handle caption generation with retry logic
  const fetchCaptionsWithRetry = useCallback(async () => {
    if (!isGenerating) return;
    
    try {
      setError(null);
      
      // Check if user has available requests
      const availability = await checkRequestAvailability();
      
      if (!availability.canMakeRequest) {
        setIsGenerating(false);
        setError(availability.message);
        return;
      }

      // Reset retry count at the beginning of a new generation attempt
      setRetryCount(0);
      
      // Try to generate captions with built-in retry mechanism
      let captionResponse = null;
      let currentRetry = 0;
      
      while (currentRetry <= MAX_RETRIES && !captionResponse) {
        if (currentRetry > 0) {
          // Only show toast for retry attempts after the first one
          const delay = getRetryDelay(currentRetry);
          toast.info(`Retrying caption generation (attempt ${currentRetry + 1}/${MAX_RETRIES + 1})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        try {
          console.log(`Caption generation attempt ${currentRetry + 1} of ${MAX_RETRIES + 1}`);
          
          captionResponse = await generateCaptions(
            selectedPlatform,
            selectedTone,
            selectedNiche,
            selectedGoal,
            postIdea
          );
          
          if (!captionResponse) {
            throw new Error("Empty response received");
          }
        } catch (err: any) {
          console.error(`Attempt ${currentRetry + 1} failed:`, err);
          
          // Check if this is an error we should retry
          const isRetryableError = 
            err?.code === 'unavailable' || 
            err?.code === 'internal' ||
            err?.message?.includes('CORS') ||
            err?.message?.includes('network');
          
          currentRetry++;
          
          // If we've exhausted our retries or this isn't a retryable error, throw
          if (currentRetry > MAX_RETRIES || !isRetryableError) {
            throw err;
          }
          
          // Update the retry count state for UI feedback
          setRetryCount(currentRetry);
        }
      }

      if (captionResponse && captionResponse.captions) {
        setCaptions(captionResponse.captions);
        setSelectedCaption(0);
        setRequestsRemaining(captionResponse.requests_remaining);
        console.log("Captions generated successfully:", captionResponse);
        toast.success("Captions generated successfully!");
      } else {
        setError("Failed to generate captions. Please try again.");
        console.error("Error fetching captions - empty response");
      }
    } catch (err: any) {
      console.error("Error fetching captions after retries:", err);
      
      // Provide more specific error messages for different error types
      if (err?.message?.includes('CORS') || err?.message?.includes('blocked by CORS policy')) {
        setError("Server connection issue. This is often temporary. Please try again or contact support with reference: CORS-ERROR");
      } else if (err?.code === 'unauthenticated') {
        setError("Authentication required. Please log in again.");
      } else if (err?.code === 'resource-exhausted') {
        setError("You've reached your plan limit. Please upgrade to continue.");
      } else if (err?.code === 'internal') {
        setError("Our servers encountered an issue. Please try again later.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [
    isGenerating, 
    selectedPlatform, 
    selectedTone, 
    selectedNiche, 
    selectedGoal, 
    postIdea, 
    setIsGenerating, 
    checkRequestAvailability
  ]);

  useEffect(() => {
    fetchCaptionsWithRetry();
  }, [fetchCaptionsWithRetry]);

  // Provide a manual retry function that users can call
  const retryGeneration = () => {
    setIsGenerating(true);
  };

  return {
    captions,
    setCaptions,
    selectedCaption,
    setSelectedCaption,
    error,
    setError,
    requestsRemaining,
    retryCount,
    retryGeneration
  };
};
