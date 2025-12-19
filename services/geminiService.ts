import { GoogleGenAI } from "@google/genai";
import { City } from '../types';

const getAiClient = () => {
  try {
    // @ts-ignore: Prevent TS error for process in browser
    if (typeof process !== 'undefined' && process && process.env) {
      const apiKey = process.env.API_KEY;
      if (apiKey) {
        return new GoogleGenAI({ apiKey });
      }
    }
  } catch (e) {
    // console.debug("Gemini API Key not found or process undefined");
  }
  return null;
};

export const generateSchedulingAdvice = async (cities: City[], date: Date, durationMinutes: number): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Please configure your API Key to use the Smart Assistant.";

  const cityList = cities.map(c => {
    try {
      const time = new Date(date).toLocaleTimeString('en-US', { timeZone: c.timezone, hour: '2-digit', minute: '2-digit', hour12: true });
      return `${c.name} (${time})`;
    } catch (e) {
      return `${c.name} (Timezone Error)`;
    }
  }).join(', ');

  const prompt = `
    I am planning a ${durationMinutes}-minute meeting involving these locations: ${cityList}.
    Reference UTC time: ${date.toISOString()}.
    
    Briefly analyze:
    1. Is this time convenient for the full ${durationMinutes} minutes?
    2. Suggest a meeting structure for this duration.
    3. Provide one cultural etiquette tip relevant to the participants.
    
    Keep it concise and formatted with Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No advice generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Service unavailable. Please check your connection.";
  }
};