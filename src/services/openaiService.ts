
import { toast } from "sonner";
import OpenAI from "openai";

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
    
    // Initialize the OpenAI client with explicit configuration
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    // Prepare the content for generation
    const contentToGenerate = postIdea || niche;
    
    // Create a more structured prompt
    const systemPrompt = "You are an expert social media content creator specializing in crafting engaging captions.";
    
    const userPrompt = `
      Create 3 highly engaging ${tone} captions for ${platform} about '${contentToGenerate}'.

      Each caption must have:
      - title: A concise, catchy title highlighting the main idea.
      - caption: Engaging, concise caption text without hashtags.
      - cta: A clear call-to-action for the goal "${goal}".
      - hashtags: Exactly 5 relevant hashtags for the niche "${niche}" (without # symbol).

      Additional Instructions:
      ${goal === "Share Knowledge" ? "Start captions with phrases like 'Did you know?', 'Insight:', or 'Fact:'." : ""}
      Keep captions concise and natural-sounding.
      DO NOT include hashtags within the caption text.
    `;

    console.log("Calling OpenAI API with model: gpt-4o-mini");
    
    // Make the API call with correct parameters
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    console.log("OpenAI API response received:", completion);
    
    // Extract the content
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
    // Detailed error handling
    console.error("Error generating captions:", error);
    
    // Handle specific OpenAI API errors
    if (error?.status === 401) {
      toast.error("Invalid API key. Please check your OpenAI API key.");
    } else if (error?.status === 429) {
      toast.error("Rate limit exceeded. Please try again later.");
    } else if (error?.status === 500) {
      toast.error("OpenAI server error. Please try again later.");
    } else if (error.message) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.error("Failed to generate captions. Please try again.");
    }
    
    return null;
  }
};
