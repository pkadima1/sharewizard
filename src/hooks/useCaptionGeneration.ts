
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
        
        const availability = await checkRequestAvailability();
        
        if (!availability.canMakeRequest) {
          setIsGenerating(false);
          setError(availability.message);
          return;
        }
        
        const captionResponse = await generateCaptions(
          selectedPlatform,
          selectedTone,
          selectedNiche,
          selectedGoal,
          postIdea
        );

        if (captionResponse && captionResponse.captions) {
          setCaptions(captionResponse.captions);
          setSelectedCaption(0);
          setRequestsRemaining(captionResponse.requests_remaining);
          console.log("Captions generated successfully:", captionResponse);
        } else {
          setError("Failed to generate captions. Please try again.");
          console.error("Error fetching captions - empty response");
        }
      } catch (err) {
        console.error("Error fetching captions:", err);
        setError("An unexpected error occurred. Please try again.");
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
