// config/env.js – load environment variables with safe defaults
import dotenv from "dotenv";
dotenv.config();

const warn = (key) => {
  if (!process.env[key]) {
    console.warn(`[WARN] ${key} not set — using default.`);
  }
};

["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GROQ_API_KEY", "GROQ_MODEL", "CONFIDENCE_THRESHOLD", "PORT"].forEach(warn);

export const config = {
  supabaseUrl:          process.env.SUPABASE_URL || "",
  supabaseKey:          process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  groqApiKey:           process.env.GROQ_API_KEY || "",
  groqModel:            process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  confidenceThreshold:  parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.6,
  port:                 parseInt(process.env.PORT, 10) || 5000,
};
