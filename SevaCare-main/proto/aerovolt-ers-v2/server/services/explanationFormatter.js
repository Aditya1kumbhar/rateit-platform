// services/explanationFormatter.js – Groq radio text with template fallback
import axios from "axios";
import { config } from "../config/env.js";

/**
 * Generate pit-wall radio text via Groq LLM.
 * Falls back to a deterministic template if key is missing or call fails.
 */
export async function generateRadioText(decision) {
  if (!config.groqApiKey) {
    return fallbackTemplate(decision);
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: config.groqModel,
        messages: [
          {
            role: "user",
            content: `You are an F1 pit-wall strategist. Give a concise 2-sentence radio call for this decision:\n${JSON.stringify(decision, null, 2)}\nOnly output the radio text, nothing else.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${config.groqApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );
    const content = response?.data?.choices?.[0]?.message?.content?.trim();
    return content || fallbackTemplate(decision);
  } catch (err) {
    console.error("[Groq] Request failed, using fallback:", err.message);
    return fallbackTemplate(decision);
  }
}

function fallbackTemplate(decision) {
  const templates = {
    ATTACK:         "Pit Wall: Push hard, deploy full ERS boost for the overtake.",
    DEFEND:         "Pit Wall: Hold position, manage energy defensively.",
    HOLD:           "Pit Wall: Maintain current pace, monitor rivals.",
    HARVEST:        "Pit Wall: Reduce pace to harvest energy efficiently.",
    WAIT:           "Pit Wall: Wait for a safer window before acting.",
    OVERRIDE:       "Pit Wall: Use override now for a strategic advantage.",
    LIFT_AND_COAST: "Pit Wall: Lift and coast to conserve battery and manage temps.",
  };
  return templates[decision.action] || `Pit Wall: Execute ${decision.action}. ${decision.reason || ""}`;
}
