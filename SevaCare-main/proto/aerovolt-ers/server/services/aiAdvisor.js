const { GoogleGenAI } = require('@google/genai');
const Groq = require('groq-sdk');

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generatePitWallDirective(telemetryData) {
    const { action, carSoC, batteryTemp, opponentBeliefSoC, deceptionRisk } = telemetryData;

    const prompt = `
Act strictly as an F1 Pit Wall Strategy Director.
Telemetry Data:
Action: ${action}
Car SoC: ${carSoC} MJ
Battery Temp: ${batteryTemp} C
Opponent Belief SoC: ${opponentBeliefSoC} MJ
Deception Risk (Counter-Harvest Trap): ${deceptionRisk}

Analyze this and provide a tactical directive for the driver over the radio.
Output must be a valid JSON object strictly matching this structure:
{
    "radioMessage": "string (max 2 concise sentences)",
    "confidenceScore": number (0.0 to 1.0),
    "reasonCode": "string (e.g. TRAP_AVOIDANCE, PUSH_NOW, SAVE_ENERGY)",
    "audioScript": "string (short, clean radio transcript optimized for Text-to-Speech)"
}
Return only JSON.`;

    // 1. Try Groq API (Primary - GPT OSS 120B / LLaMA 3.3 70B)
    try {
        let groqModel = 'openai/gpt-oss-120b';
        let groqResponse;

        try {
            groqResponse = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are an F1 Pit Wall Strategy Director. Output strictly valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                model: groqModel,
                temperature: 0.7,
                response_format: { type: "json_object" }
            });
        } catch (modelErr) {
            console.warn("Groq gpt-oss-120b failed, trying llama-3.3-70b-versatile...", modelErr.message);
            groqResponse = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are an F1 Pit Wall Strategy Director. Output strictly valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                response_format: { type: "json_object" }
            });
        }

        const parsed = JSON.parse(groqResponse.choices[0]?.message?.content || '{}');
        return {
            radioMessage: parsed.radioMessage || "Caution on straight. Rival is covert harvesting.",
            confidenceScore: parsed.confidenceScore || 0.92,
            reasonCode: parsed.reasonCode || "TRAP_AVOIDANCE",
            audioScript: parsed.audioScript || parsed.radioMessage || "Caution on straight."
        };
    } catch (groqErr) {
        console.warn("Groq API failed, falling back to Gemini...", groqErr.message);

        // 2. Fallback to Gemini
        try {
            const response = await gemini.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });

            const parsed = JSON.parse(response.text);
            return {
                radioMessage: parsed.radioMessage || parsed.directive || "Maintain pace and manage battery thermal load.",
                confidenceScore: parsed.confidenceScore || 0.88,
                reasonCode: parsed.reasonCode || "STRATEGY_OK",
                audioScript: parsed.audioScript || parsed.radioMessage || "Maintain pace."
            };
        } catch (geminiErr) {
            console.error("Both Groq and Gemini APIs failed:", geminiErr.message);

            return {
                radioMessage: "Maintain energy profile. Deception risk detected on straight sector.",
                confidenceScore: 0.85,
                reasonCode: "LOCAL_FALLBACK",
                audioScript: "Maintain energy profile. Deception risk detected."
            };
        }
    }
}

module.exports = {
    generatePitWallDirective
};
