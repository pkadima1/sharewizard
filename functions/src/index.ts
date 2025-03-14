
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

admin.initializeApp();

// Set up OpenAI with environment variables for security
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This will be set in the Firebase console
});

export const generateCaptions = functions.https.onCall(async (data, context) => {
  // Verify if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to generate captions.'
    );
  }

  try {
    const { systemPrompt, userPrompt } = data;

    if (!systemPrompt || !userPrompt) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with systemPrompt and userPrompt arguments.'
      );
    }

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
    
    // Extract and return content
    const content = completion.choices[0].message.content;
    return content;

  } catch (error: any) {
    console.error('Error generating captions:', error);
    
    // Map OpenAI errors to appropriate Firebase errors
    if (error?.status === 401) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Invalid OpenAI API key.'
      );
    } else if (error?.status === 429) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'OpenAI rate limit exceeded. Please try again later.'
      );
    } else if (error?.status === 500) {
      throw new functions.https.HttpsError(
        'internal',
        'OpenAI server error. Please try again later.'
      );
    } else {
      throw new functions.https.HttpsError(
        'unknown',
        error.message || 'An unknown error occurred'
      );
    }
  }
});
