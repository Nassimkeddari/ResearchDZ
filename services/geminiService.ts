
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { GeminiResponse } from "../types";

let chatSession: Chat | null = null;

// Fix: Escaped backticks inside the template literal to avoid premature termination of the string and subsequent syntax errors.
const SYSTEM_INSTRUCTION = `You are ScholarSync, a world-class academic research assistant specialized in bibliometric analysis, methodology critique, and theoretical framework mapping.
Your primary goal is to help researchers conduct systematic literature reviews and identify research gaps.

When summarizing articles:
1. Focus on high-impact studies indexed in Scopus or Web of Science.
2. Strictly adhere to user-specified constraints regarding Journal Quartiles (Q1, Q2, Q3, Q4) or Impact Factors.
3. Provide Title, Authors, Year, and a concise summary highlighting the Research Problem, Method, and Key Finding.
4. If asked for a "Map Design" or diagram, use Mermaid.js syntax inside a \`\`\`mermaid block.
5. For Bibliometric Analysis (trends or keywords):
   - Provide structured Markdown tables.
   - ALSO provide an interactive chart by using a \`\`\`json-chart code block with this format:
     {
       "type": "bar" | "line",
       "title": "Clear Title",
       "xAxisLabel": "Label",
       "yAxisLabel": "Label",
       "data": [
         { "label": "2020", "value": 45 },
         { "label": "2021", "value": 52 }
       ]
     }
6. Always maintain an objective, formal academic tone.
7. Use citations where appropriate (Author, Year).`;

// Fix: Simplified initialization to follow Google GenAI SDK naming conventions and direct environment variable usage.
export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const resetChat = () => {
  chatSession = null;
};

export const sendMessageToGemini = async (prompt: string): Promise<GeminiResponse> => {
  // Fix: Instantiate the client immediately before the call to ensure the most current configuration is used.
  const ai = getGeminiClient();
  
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
      },
    });
  }

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({ message: prompt });
    const text = response.text || "I'm sorry, I couldn't generate a response.";
    
    const sources: string[] = [];
    const urlMatches = text.match(/https?:\/\/[^\s)]+/g);
    if (urlMatches) {
      const uniqueMatches = Array.from(new Set(urlMatches)) as string[];
      sources.push(...uniqueMatches);
    }

    return {
      text,
      sources: sources.length > 0 ? sources : undefined
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
