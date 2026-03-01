import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is missing from environment variables.");
}

export const genAI = new GoogleGenerativeAI(apiKey || "");

export async function askGemini(prompt: string, modelType: "gemini-3.1-pro-preview" | "gemini-3.0-flash" = "gemini-3.1-pro-preview") {
    try {
        const model = genAI.getGenerativeModel({ model: modelType });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}
