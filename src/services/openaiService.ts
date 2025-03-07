
import { toast } from "sonner";
import OpenAI from "openai";
import { useAuth } from "@/contexts/AuthContext";

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
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      toast.error("OpenAI API key is missing. Please check your environment variables.");
      console.error("OpenAI API key is missing");
      return null;
    }
    
    console.log("Generating captions with parameters:", { platform, tone, niche, goal, postIdea });
    
    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });

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

    console.log("Calling OpenAI API with model: gpt-4o-mini");
    
    // Make the API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    console.log("OpenAI API response received");
    
    // Extract and validate the content
    const content = completion.choices[0].message.content;
    
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
    
    if (error?.response?.status === 401) {
      toast.error("Invalid OpenAI API key. Please check your API key.");
    } else if (error?.response?.status === 429) {
      toast.error("OpenAI rate limit exceeded. Please try again later.");
    } else if (error?.response?.status === 500) {
      toast.error("OpenAI server error. Please try again later.");
    } else if (error.message) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.error("Failed to generate captions. Please try again.");
    }
    
    return null;
  }
};
