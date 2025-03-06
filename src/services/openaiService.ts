
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
    
    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Allow client-side usage
    });

    // Prepare system and user prompts
    const systemPrompt = "You are an expert social media content creator who specializes in crafting engaging captions.";
    
    const userPrompt = `
      You are the world's best content creator and digital, Social Media marketing, and sales expert with over 20 years of hands-on experience. Create 3 highly engaging ${tone} captions for ${platform} about '${postIdea || niche}'.

      Each caption must adhere strictly to the following structure:

      - title: A concise, catchy title highlighting the caption's main idea.
      - caption: Engaging, concise, and platform-optimized caption (Do not include hashtags here).
      - cta: Include a clear, compelling Call-to-Action relevant to the goal "${goal}".
      - hashtags: Exactly 5 relevant hashtags related to the niche "${niche}" (provide without '#' symbol).

      Additional Instructions:
      1. If the goal is "Share Knowledge," start captions with phrases like "Did you know?", "Insight:", or "Fact:".
      2. Incorporate current platform trends and specific format language where applicable.
      3. Captions should be concise and natural-sounding, avoiding generic phrases.
      4. Do NOT include hashtags within the caption text; hashtags must be listed separately.

      Output Format:
      {
        "captions": [
          {
            "title": "Catchy title highlighting main caption theme",
            "caption": "Concise, engaging caption text without hashtags.",
            "cta": "Relevant and clear call-to-action phrase",
            "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
          },
          {
            "title": "Another engaging title idea",
            "caption": "Another concise and engaging caption.",
            "cta": "Compelling call-to-action",
            "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
          },
          {
            "title": "Third compelling caption title",
            "caption": "Engaging caption tailored to platform and tone.",
            "cta": "Clear, actionable call-to-action",
            "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
          }
        ]
      }
    `;

    console.log("Calling OpenAI API...");
    
    // Make the API call using the OpenAI client
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
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    console.log("OpenAI API response received:", completion);
    
    // Extract and parse the content
    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error("No content received from OpenAI");
    }
    
    try {
      const parsedContent: CaptionResponse = JSON.parse(content);
      console.log("Successfully parsed response:", parsedContent);
      
      if (!parsedContent.captions || !Array.isArray(parsedContent.captions)) {
        throw new Error("Invalid response format: missing captions array");
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content that failed to parse:", content);
      toast.error("Failed to parse response from OpenAI. Please try again.");
      return null;
    }
  } catch (error) {
    // Detailed error handling
    console.error("Error generating captions:", error);
    
    if (error instanceof Error) {
      // Check for common OpenAI API errors
      if (error.message.includes("API key")) {
        toast.error("Invalid OpenAI API key. Please check your environment variables.");
      } else if (error.message.includes("rate limit")) {
        toast.error("OpenAI API rate limit exceeded. Please try again later.");
      } else if (error.message.includes("billing")) {
        toast.error("OpenAI API billing issue. Please check your OpenAI account.");
      } else {
        toast.error(`Error: ${error.message}`);
      }
    } else {
      toast.error("Failed to generate captions. Please try again.");
    }
    
    return null;
  }
};
