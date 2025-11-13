
import { GoogleGenAI } from "@google/genai";

// Helper function to convert a File object to a base64 string
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generateCaptionStream = async (imageFile: File) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(imageFile);
        
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, { text: "Describe this image in a creative and engaging way. What is happening? What emotions does it evoke?" }] },
        });

        return responseStream;
    } catch (error) {
        console.error("Error generating caption stream:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to start caption generation. Please check your API key and try again.");
    }
};

export const analyzeError = async (error: Error): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Analyze the following JavaScript error from a Gemini API call and explain it to a non-technical user in a friendly and helpful tone. Provide a simple, actionable step they can take to resolve it. If the error mentions "API key", tell them to double-check that their API_KEY is correctly set up in their deployment environment (like Netlify). Keep the explanation concise. Error: "${error.message}"`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (analysisError) {
        console.error("Error while analyzing error:", analysisError);
        // Fallback to a clear, actionable message if analysis fails
        return `An error occurred: ${error.message}. This might be due to a missing or invalid API key. Please ensure your API key is correctly configured in your environment settings and try again.`;
    }
}
