import { GoogleGenAI } from "@google/genai";
import { GameStats } from "../types";

const apiKey = process.env.API_KEY || ''; // Ensure this handles missing keys gracefully in UI checks

export const generateAdventureLog = async (stats: GameStats): Promise<string> => {
  if (!apiKey) {
    return "The forest spirits are silent (API Key missing). But you had a great run!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      The player has just finished a game called "Mushroom Forest Adventure".
      Here are their stats:
      - Score: ${stats.score}
      - Red Mushrooms: ${stats.normalCount}
      - Golden Mushrooms: ${stats.goldenCount}
      - Poisonous Mushrooms collected: ${stats.poisonCount}

      You are an ancient, whimsical Forest Spirit.
      Write a short, funny, and magical diary entry (max 3 sentences) summarizing their adventure.
      If they collected poison, tease them gently.
      If they got a high score (over 500), praise them as a Master Forager.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "The wind whispers through the trees...";
  } catch (error) {
    console.error("Error generating log:", error);
    return "The ancient scrolls are illegible right now. (AI generation failed)";
  }
};
