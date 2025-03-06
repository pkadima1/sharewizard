
import { toast } from "sonner";

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

    if (apiKey.startsWith('sk-proj-')) {
      toast.error("You're using a project-level API key. Please use a personal API key instead.");
      console.error("Project-level API key detected. OpenAI requires personal API keys for this endpoint.");
      return null;
    }

    console.log("Generating captions with parameters:", { platform, tone, niche, goal, postIdea });

    const prompt = `
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

    console.log("Sending request to OpenAI API...");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert social media content creator who specializes in crafting engaging captions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      const errorMessage = errorData.error?.message || "Failed to generate captions";
      toast.error(`API Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("OpenAI response received:", data);
    
    let content = data.choices[0].message.content;
    
    // Ensure we get valid JSON by removing any markdown formatting
    if (content.includes("```json")) {
      content = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      content = content.split("```")[1].split("```")[0].trim();
    }
    
    try {
      const parsedContent: CaptionResponse = JSON.parse(content);
      console.log("Successfully parsed response:", parsedContent);
      return parsedContent;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content that failed to parse:", content);
      toast.error("Failed to parse response from OpenAI. Please try again.");
      return null;
    }
  } catch (error) {
    console.error("Error generating captions:", error);
    toast.error("Failed to generate captions. Please try again.");
    return null;
  }
};
