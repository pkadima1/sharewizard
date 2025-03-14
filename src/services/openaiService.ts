
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
    
    // Initialize Firebase Functions
    const functions = getFunctions();
    const generateCaptionsFunction = httpsCallable(functions, 'generateCaptions');

    // Prepare the content for generation
    const contentToGenerate = postIdea || niche;
    
    // Create system and user prompts
    const systemPrompt = `You are a social media caption generator specializing in creating engaging content for ${platform}. Always respond with exactly 3 captions in JSON format.`;
    
    const userPrompt = `
      Create 3 engaging ${tone} captions for ${platform} about '${contentToGenerate}'.

      The caption must:
      1. Be concise and tailored to ${platform}'s audience and character limits (e.g., Instagram: 2200 characters, Twitter: 200 characters).
      2. Use hashtags relevant to the ${niche} industry.
      3. Include an optional call-to-action to drive engagement (e.g., "Comment below," "Tag a friend," "Share your thoughts" etc).
      4. If the goal is to share knowledge, start with words like 'did you know? "Insight", "Fact", etc…
      5. Reflect current trends or platform-specific language where applicable. And post format and size.

      Format as JSON with these fields for each caption:
      - title: A brief, catchy title highlighting main caption theme
      - caption: The main caption text in a ${tone} tone (NO hashtags here)
      - cta: Call-to-action for "${goal}"
      - hashtags: Array of 5 relevant hashtags for "${niche}" (without # symbol)
      ${goal === "Share Knowledge" ? "Start captions with phrases like 'Did you know?', 'Insight:', or 'Fact:'." : ""}
      Output Format:
      {
        "captions": [
          {
            "title": "Catchy title highlighting main caption theme",
            "caption": "Write a 1-2 sentence caption in a ${tone} tone without hashtags.",
            "cta": "Provide a specific CTA to encourage engagement",
            "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
          },
          {
            "title": "Another engaging title for a unique post idea",
            "caption": "Write an attention-grabbing caption without hashtags.",
            "cta": "Include a CTA to drive user interaction",
            "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
          },
          {
            "title": "Third compelling caption title",
            "caption": "Provide a brief but engaging caption tailored to platform and tone.",
            "cta": "Suggest a CTA to encourage likes, shares, or comments",
            "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
          }
        ]
      }
    `;

    console.log("Calling Firebase Function to generate captions");
    
    // Make the API call via Firebase Function
    const result = await generateCaptionsFunction({
      systemPrompt,
      userPrompt
    });
    
    console.log("Firebase Function response received");
    
    // Extract and validate the content
    const content = result.data as string;
    
    if (!content) {
      console.error("No content received from OpenAI");
      toast.error("No content received from OpenAI. Please try again.");
      return null;
    }
    
    try {
      // Parse the JSON response
      const parsedContent = JSON.parse(content);
      console.log("Successfully parsed response:", parsedContent);
      
      // Validate the response format
      if (!parsedContent.captions || !Array.isArray(parsedContent.captions)) {
        console.error("Invalid response format:", parsedContent);
        toast.error("Invalid response format from OpenAI. Please try again.");
        return null;
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content that failed to parse:", content);
      toast.error("Failed to parse response from OpenAI. Please try again.");
      return null;
    }
  } catch (error: any) {
    // Handle specific error types
    console.error("Error generating captions:", error);
    
    if (error?.code === 'unauthenticated') {
      toast.error("You must be logged in to generate captions.");
    } else if (error?.code === 'resource-exhausted') {
      toast.error("API rate limit exceeded. Please try again later.");
    } else if (error?.code === 'internal') {
      toast.error("OpenAI service error. Please try again later.");
    } else if (error.message) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.error("Failed to generate captions. Please try again.");
    }
    
    return null;
  }
};
