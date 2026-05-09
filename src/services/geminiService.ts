import { GoogleGenAI } from "@google/genai";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

let aiInstance: GoogleGenAI | null = null;

/**
 * Recupère l'instance Gemini en allant chercher la clé API dans Firestore.
 * Cache l'instance pour les appels futurs.
 */
async function getAIInstance(customApiKey?: string) {
  if (customApiKey) return new GoogleGenAI({ apiKey: customApiKey });
  if (aiInstance) return aiInstance;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey) return new GoogleGenAI({ apiKey });
  
  const path = 'settings/config';
  try {
    const configDoc = await getDoc(doc(db, path));
    
    if (!configDoc.exists()) {
      throw new Error("La configuration Gemini n'est pas initialisée dans Firestore (settings/config).");
    }

    const data = configDoc.data();
    const apiKey = data.geminiApiKey;

    if (!apiKey) {
      throw new Error("Clé API Gemini introuvable dans settings/config.");
    }

    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}

export async function generateProductDescription(productName: string, attributes: any, apiKey?: string) {
  const ai = await getAIInstance(apiKey);
  const prompt = `Agis en tant qu'expert concepteur-rédacteur e-commerce. Génère une description de produit à haute conversion et optimisée pour le SEO pour un produit nommé "${productName}". 
  Attributs : ${JSON.stringify(attributes)}. 
  Inclus un titre percutant, les avantages clés et un appel à l'action. Formate avec des balises HTML comme <h2>, <p>, <ul>. 
  LE TEXTE DOIT ÊTRE EN FRANÇAIS.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  
  return response.text;
}

export async function optimizeSEO(content: string, apiKey?: string) {
  const ai = await getAIInstance(apiKey);
  const prompt = `Analyse ce contenu de produit et fournis : 
  1. Un méta-titre optimisé (max 60 caractères)
  2. Une méta-description (max 160 caractères)
  3. 5 mots-clés principaux.
  RESTE EN FRANÇAIS.
  Renvoie UNIQUEMENT un objet JSON : { "title": "...", "description": "...", "keywords": [] }. 
  Contenu : ${content}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  const text = response.text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}
