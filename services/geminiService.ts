
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

export const generateCaption = async (imageFile: File): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(imageFile);
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ parts: [imagePart, { text: "Describe this image in a creative and engaging way. What is happening? What emotions does it evoke?" }] }],
        });

        return response.text;
    } catch (error) {
        console.error("Error generating caption:", error);
        throw new Error("Failed to generate caption. Please check your API key and try again.");
    }
};
