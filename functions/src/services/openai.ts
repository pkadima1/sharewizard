
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as functions from 'firebase-functions';
import OpenAI from "openai";
import { getOpenAIKey } from "../config/secrets";

// Type for OpenAI error response
interface OpenAIErrorResponse {
  status?: number;
  response?: {
    status: number;
    data: any;
  };
  message?: string;
}

export interface GeneratedCaption {
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export const generateCaptions = onCall({
  // Set comprehensive CORS configuration with proper validation
  cors: [
    // Local development
    'localhost:3000',
    'localhost:5173',
    'localhost:5174',
    
    // Firebase hosting domains
    /engperfecthlc\.web\.app$/,
    /engperfecthlc\.firebaseapp\.com$/,
    
    // Production domain
    /engageperfect\.com$/,
    /www\.engageperfect\.com$/,
    
    // Lovable preview domains
    /preview--.*\.lovable\.app$/,
    /.*\.lovable\.app$/,
    /.*\.lovableproject\.com$/,
    
    // Allow all origins while debugging CORS issues
    '*'
  ],
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: '256MiB'
}, async (request) => {
  // Log the origin for debugging
  console.log('Request origin:', request.rawRequest?.headers?.origin || 'Unknown origin');
  
  try {
    const { tone, platform, niche, goal, postIdea } = request.data;

    if (!tone || !platform || !niche || !goal) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters: tone, platform, niche, goal'
      );
    }

    // Get the API key and initialize OpenAI
    const apiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey });

    console.log('Calling OpenAI API with model: gpt-4o');
    
    // Create the prompt for OpenAI
    const systemPrompt = `You are the world's best content creator and digital marketing expert. Create 3 engaging ${tone} captions for ${platform} tailored for the ${niche} niche with a goal of ${goal}.`;
    
    const userPrompt = `
      Create 3 engaging ${tone} captions for ${platform} about '${postIdea || niche}'.

      The caption must:
      1. Be concise and tailored to ${platform}'s audience and character limits (e.g., Instagram: 2200 characters, Twitter: 200 characters).
      2. Use 5 hashtags relevant to the ${niche} industry.
      3. Include a call-to-action to drive engagement for the goal: "${goal}"
      4. If the goal is to share knowledge, start with words like 'did you know?', "Insight", "Fact", etc.

      Format as JSON with these fields for each caption:
      - title: A brief, catchy title highlighting main caption theme
      - caption: The main caption text (NO hashtags here)
      - cta: Call-to-action
      - hashtags: Array of 5 relevant hashtags (without # symbol)
    `;
    
    // Make the API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",  // Using gpt-4o for better results
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    console.log('OpenAI API response received');
    
    // Parse the response
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new functions.https.HttpsError('internal', 'Empty response from OpenAI');
    }
    
    try {
      const parsedContent = JSON.parse(content);
      
      // Check if the response has the expected format
      if (!parsedContent.captions || !Array.isArray(parsedContent.captions)) {
        throw new functions.https.HttpsError('internal', 'Invalid response format from OpenAI');
      }
      
      // Return the captions along with a mock count of remaining requests
      return {
        captions: parsedContent.captions,
        requests_remaining: 100  // Replace with actual limit from your user management system
      };
      
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content that failed to parse:", content);
      throw new functions.https.HttpsError('internal', 'Failed to parse response from OpenAI');
    }

  } catch (error: unknown) {
    console.error('Error generating captions:', error);
    
    // Type guard for OpenAI error response
    const openAIError = error as OpenAIErrorResponse;
    
    if (openAIError.response) {
      console.error('OpenAI API Error Response:', {
        status: openAIError.response.status,
        data: openAIError.response.data
      });
    }
    
    // Map OpenAI errors to appropriate Firebase errors
    if (openAIError.status === 401 || (openAIError.response?.status === 401)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Invalid OpenAI API key.'
      );
    } else if (openAIError.status === 429 || (openAIError.response?.status === 429)) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'OpenAI rate limit exceeded. Please try again later.'
      );
    }
    
    // Default error handling with proper type checking
    if (openAIError.message) {
      throw new functions.https.HttpsError('internal', openAIError.message);
    } else {
      throw new functions.https.HttpsError('internal', 'An unknown error occurred');
    }
  }
});
