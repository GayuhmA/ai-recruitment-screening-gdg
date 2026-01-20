import { GoogleGenerativeAI } from "@google/generative-ai";
import { mustEnv } from "./env.js";

export const gemini = new GoogleGenerativeAI(mustEnv("GEMINI_API_KEY"));
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
