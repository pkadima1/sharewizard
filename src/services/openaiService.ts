
import { toast } from "sonner";
import { getFunctions, httpsCallable } from "firebase/functions";

export interface GeneratedCaption {
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export interface CaptionResponse {
  captions: GeneratedCaption[];
  requests_remaining: number;
}

export const generateCaptions = async (
  platform: string,
  tone: string,
  niche: string,
  goal: string,
  postIdea?: string
): Promise<CaptionResponse | null> => {
  try {
    console.log("Generating captions with parameters:", { platform, tone, niche, goal, postIdea });
    
    // Initialize Firebase Functions with region explicitly specified
    const functions = getFunctions(undefined, 'us-central1');
    const generateCaptionsFunction = httpsCallable(functions, 'generateCaptions');

    // Prepare data for the function call
    const functionData = {
      tone,
      platform,
      postIdea: postIdea || niche, // Use postIdea if provided, otherwise fall back to niche
      niche,
      goal
    };
    
    console.log("Calling Firebase Function with data:", functionData);
    
    // Make the API call via Firebase Function
    const result = await generateCaptionsFunction(functionData);
    
    console.log("Firebase Function response received:", result.data);
    
    // Extract and validate the content
    const data = result.data as CaptionResponse;
    
    if (!data || !data.captions) {
      console.error("Invalid response format from function");
      toast.error("Invalid response from caption generator. Please try again.");
      return null;
    }
    
    // Transform tags string to hashtags array if needed
    const processedCaptions = data.captions.map(caption => {
      // If caption has tags as string but not hashtags array, convert it
      if ('tags' in caption && !Array.isArray(caption.hashtags)) {
        const tags = (caption as any).tags || '';
        return {
          ...caption,
          hashtags: tags.split(/\s+/).filter((tag: string) => tag.trim() !== '')
        };
      }
      return caption;
    });
    
    return {
      captions: processedCaptions as GeneratedCaption[],
      requests_remaining: data.requests_remaining
    };
  } catch (error: any) {
    // Enhanced error logging
    console.error("Error generating captions:", error);
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      stack: error?.stack
    });
    
    // Handle CORS errors specifically and thoroughly
    if (
      error?.code === 'functions/cors-error' || 
      error?.message?.includes('CORS') || 
      error?.message?.includes('blocked by CORS policy') ||
      error?.code === 'unavailable' || // Often means network/CORS issues
      error?.code === 'internal' // Sometimes Firebase wraps CORS errors as internal
    ) {
      console.error("CORS or network error detected:", error);
      
      // Show a more detailed error message to help users troubleshoot
      toast.error(
        "Connection blocked by browser security. Please try: 1) Refreshing the page, 2) Using a different browser, or 3) Contacting support with error code: CORS-ERROR"
      );
      
      // Attempt to log additional details that might help debugging
      try {
        const origin = window.location.origin;
        const host = window.location.host;
        console.error("Request origin info:", { origin, host });
      } catch (e) {
        console.error("Failed to log origin info:", e);
      }
    } else if (error?.code === 'unauthenticated') {
      toast.error("You must be logged in to generate captions.");
    } else if (error?.code === 'resource-exhausted' || (error?.message && error.message.includes('limit_reached'))) {
      toast.error("You've reached your plan limit. Please upgrade or buy a Flex pack.");
    } else if (error?.code === 'internal') {
      toast.error("Caption generation service error. Please try again later.");
    } else if (error?.message) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.error("Failed to generate captions. Please try again.");
    }
    
    return null;
  }
};
