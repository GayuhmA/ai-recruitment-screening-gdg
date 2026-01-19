import { SchemaType, type Schema } from "@google/generative-ai";
import { gemini, GEMINI_MODEL } from "../lib/gemini.js";

export type CvAiResult = {
  skills: string[];
  summary: string;
};

const schema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    skills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Lowercase deduplicated tech skills (max 30 items)",
    },
    summary: {
      type: SchemaType.STRING,
      description: "1-2 factual sentences summarizing candidate background",
    },
  },
  required: ["skills", "summary"],
};

// Redact PII minimal (email/phone) before sending to AI
function redactPII(input: string): string {
  return input
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email]")
    .replace(/\b(\+?\d[\d\s().-]{7,}\d)\b/g, "[phone]");
}

export async function extractCvInsights(extractedText: string): Promise<CvAiResult> {
  const safeText = redactPII(extractedText).slice(0, 20000);

  const prompt = `
Extract structured data from a resume.
Return ONLY JSON matching the schema.

Rules:
- skills: lowercase, deduplicated, max 30 items. Use common tech tags (e.g., "node.js", "postgresql", "docker").
- summary: 1-2 factual sentences. No guessing.

CV TEXT:
"""
${safeText}
"""
`.trim();

  // Simple retry (2 attempts) for transient errors - faster fail for better UX
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const model = gemini.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1, // More deterministic
          maxOutputTokens: 1000, // Limit response size for speed
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return JSON.parse(text) as CvAiResult;
    } catch (e) {
      if (attempt === 1) {
        throw new Error(`Gemini extraction failed after 2 attempts: ${e instanceof Error ? e.message : String(e)}`);
      }
      // Short backoff for faster retry
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }

  // Unreachable but TypeScript needs it
  throw new Error("Gemini extraction failed");
}
