
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateFitRecipe = async (prompt: string): Promise<Recipe> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie uma receita saudável e 'fit' detalhada para: ${prompt}. Busque as melhores versões nutricionais em sites de referência.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nome atrativo do prato" },
          description: { type: Type.STRING, description: "Breve descrição do prato e por que é fit" },
          ingredients: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Lista de ingredientes com quantidades"
          },
          instructions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Passo a passo detalhado"
          },
          macros: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.STRING },
              protein: { type: Type.STRING },
              carbs: { type: Type.STRING },
              fat: { type: Type.STRING }
            },
            required: ["calories", "protein", "carbs", "fat"]
          },
          tips: { type: Type.STRING, description: "Dica de ouro do chef para o prato" }
        },
        required: ["name", "description", "ingredients", "instructions", "macros", "tips"]
      }
    },
  });

  return JSON.parse(response.text) as Recipe;
};

export const generateRecipeImage = async (recipeName: string): Promise<string | undefined> => {
  const imagePrompt = `A stunning professional food photography shot of ${recipeName}, high-end restaurant plating, fit and healthy aesthetic, natural daylight, soft bokeh background, 4k resolution, appetizing colors.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: imagePrompt }
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return undefined;
};
