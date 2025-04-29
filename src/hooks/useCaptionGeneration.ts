
import { useState, useEffect } from 'react';
import { GeneratedCaption, CaptionResponse, generateCaptions } from '@/services/openaiService';
import { useAuth } from '@/contexts/AuthContext';

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
  const { checkRequestAvailability } = useAuth();

  useEffect(() => {
    const fetchCaptions = async () => {
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
        
        // Add retry mechanism for potential network/CORS issues
        let attempts = 0;
        const maxAttempts = 2;
        let captionResponse = null;
        
        while (attempts < maxAttempts && !captionResponse) {
          try {
            console.log(`Caption generation attempt ${attempts + 1} of ${maxAttempts}`);
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
          } catch (err) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw err;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (captionResponse && captionResponse.captions) {
          setCaptions(captionResponse.captions);
          setSelectedCaption(0);
          setRequestsRemaining(captionResponse.requests_remaining);
          console.log("Captions generated successfully:", captionResponse);
        } else {
          setError("Failed to generate captions. Please try again.");
          console.error("Error fetching captions - empty response");
        }
      } catch (err: any) {
        console.error("Error fetching captions:", err);
        
        // Provide more specific error messages for different error types
        if (err?.message?.includes('CORS') || err?.message?.includes('blocked by CORS policy')) {
          setError("Server connection issue. Please contact support with reference: CORS-ERROR");
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsGenerating(false);
      }
    };

    fetchCaptions();
  }, [isGenerating, selectedPlatform, selectedTone, selectedNiche, selectedGoal, postIdea, setIsGenerating, checkRequestAvailability]);

  return {
    captions,
    setCaptions,
    selectedCaption,
    setSelectedCaption,
    error,
    setError,
    requestsRemaining
  };
};
