/**
 * AeroVolt ERS - Groq / Gemini Radio Explanation Service
 * Groq Explains: Low-latency natural language translation of Node.js decision.
 */

import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateRadioText = async (decisionData) => {
  const { action, reason, carSoC, rival_belief_state, is_trap_detected } = decisionData;

  // Fallback template if API fails or key is missing
  const fallbackRadioText = `Pit Wall Order: Execute ${action}. ${reason}`;

  if (!ai) {
    console.warn('⚠️ AI API Key missing. Using deterministic fallback radio text.');
    return fallbackRadioText;
  }

  try {
    const prompt = `
You are an F1 Pit Wall Strategy Director communicating over radio to the driver.
Given this exact engine decision:
- Action: ${action}
- Engine Reason: ${reason}
- Car SoC: ${carSoC}%
- Rival Belief State: ${rival_belief_state}
- Trap Flag: ${is_trap_detected}

Task: Write a concise, urgent, authoritative 2-sentence F1 pit wall radio instruction for the driver.
Rules: Do NOT change the action (${action}). Do NOT add markdown formatting. Keep it under 25 words.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || fallbackRadioText;
  } catch (error) {
    console.error('AI Radio Generation Error:', error.message);
    return fallbackRadioText;
  }
};
