
import { onRequest } from "firebase-functions/v2/https";
import { getOpenAIKey } from "./config/secrets";
import { generateCaptions } from "./services/openai";

// Export the test endpoint
export const testOpenAIKey = onRequest({
  cors: true // Enable CORS for this test endpoint
}, async (req, res) => {
  try {
    await getOpenAIKey();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.json({ message: "OpenAI API Key retrieved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve OpenAI API key" });
  }
});

// Export the caption generator
export { generateCaptions };
