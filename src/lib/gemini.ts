import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is missing from environment variables.");
}

export const genAI = new GoogleGenerativeAI(apiKey || "dummy-key-to-prevent-crash");

export async function askGemini(prompt: string, modelType: string = "gemini-1.5-pro") {
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

export async function generateQuoteFromBrief(brief: string) {
    const prompt = `
Tu es un expert en facturation pour freelances. L'utilisateur te fournit un brief décrivant les prestations qu'il doit facturer à son client.
Tu dois renvoyer UNIQUEMENT un tableau JSON structuré contenant les lignes du devis, basé sur ce brief.
Aucun autre texte, ni blocs de code markdown. Juste le JSON brut.

Interface de retour attendue (Array of objects):
[
  {
    "name": "string (Titre court de la prestation)",
    "description": "string (Description détaillée si disponible)",
    "quantity": number (Quantité, 1 par défaut),
    "unitPrice": number (Prix unitaire, déduis-le logiquement du brief, ou un prix au hasard réaliste),
    "tvaRate": number (Taux de tva en nombre: souvent 20 ou 21),
    "unit": "heure" | "forfait" | "pièce" | "jour"
  }
]

Brief de l'utilisateur :
"${brief}"
`;

    try {
        const response = await askGemini(prompt, "gemini-1.5-pro");
        // Clean markdown blocks if Gemini stubbornly returns them
        const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Failed to parse Quote from Gemini:", error);
        throw new Error("L'IA n'a pas pu structurer ce devis proprement.");
    }
}
