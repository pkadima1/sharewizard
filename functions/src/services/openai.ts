
import { onCall } from "firebase-functions/v2/https";
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

export const generateCaptions = onCall(async (request) => {
  try {
    const { systemPrompt, userPrompt } = request.data;

    if (!systemPrompt || !userPrompt) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with systemPrompt and userPrompt arguments.'
      );
    }

    // Get the API key and initialize OpenAI
    const apiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey });

    console.log('Calling OpenAI API with model: gpt-4o-mini');
    
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

    console.log('OpenAI API response received');
    
    return completion.choices[0].message.content;

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
