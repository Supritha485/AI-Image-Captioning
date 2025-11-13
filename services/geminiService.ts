
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { decode } from './audioHelpers';

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

const commonErrorHandler = (error: unknown, context: string): never => {
    console.error(`Error in ${context}:`, error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(`An unknown error occurred during ${context}. Please check your API key and try again.`);
}

export const generateFastCaptionStream = async (imageFile: File) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(imageFile);
        
        return await ai.models.generateContentStream({
          model: 'gemini-2.5-flash-lite',
          contents: { parts: [imagePart, { text: "Describe this image in a creative and engaging way." }] },
        });
    } catch (error) {
        commonErrorHandler(error, 'fast caption generation');
    }
};

export const generateFactualCaption = async (imageFile: File): Promise<GenerateContentResponse> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(imageFile);
        
        return await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, { text: "Describe this image factually. What can be identified in it? Use Google Search to provide accurate information if needed." }] },
          config: {
              tools: [{googleSearch: {}}]
          }
        });
    } catch (error) {
        commonErrorHandler(error, 'factual caption generation');
    }
};

export const generateDeepCaptionStream = async (imageFile: File) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(imageFile);
        
        return await ai.models.generateContentStream({
          model: 'gemini-2.5-pro',
          contents: { parts: [imagePart, { text: "Provide a deep, symbolic analysis of this image. What themes, emotions, and potential narratives are present?" }] },
          config: {
              thinkingConfig: { thinkingBudget: 32768 }
          }
        });
    } catch (error) {
        commonErrorHandler(error, 'deep caption generation');
    }
};


export const generateSpeech = async (textToSpeak: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch(error) {
        commonErrorHandler(error, 'speech generation');
    }
}


export const analyzeError = async (error: Error): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Analyze the following JavaScript error from a Gemini API call and explain it to a non-technical user in a friendly and helpful tone. Provide a simple, actionable step they can take to resolve it. If the error mentions "API key", "400", or "permission", tell them to double-check that their API_KEY is correctly set up in their deployment environment (e.g., Netlify, Vercel). Explain that they need to set it as an environment variable. Keep the explanation concise. Error: "${error.message}"`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (analysisError) {
        console.error("Error while analyzing error:", analysisError);
        // Fallback to a clear, actionable message if analysis fails
        return `An error occurred: "${error.message}". This is often due to a missing or invalid API key. Please go to your deployment settings (e.g., Netlify) and ensure the environment variable named 'API_KEY' is set correctly.`;
    }
}
