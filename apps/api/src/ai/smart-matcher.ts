import { SchemaType, type Schema } from "@google/generative-ai";
import { gemini, GEMINI_MODEL } from "../lib/gemini.js";
import { PROMPTS, fillPromptTemplate } from "./prompts.js";
import type { CvProfile } from "./cv-parser.js";

/**
 * Context-aware summary (Phase 2 output)
 */
export type ContextualSummary = {
  contextualSummary: string;
  keyHighlights: string[];
  relevanceScore: number;
};

/**
 * Smart matching result (Phase 3 output)
 */
export type SmartMatchResult = {
  exactMatches: string[];
  similarMatches: Array<{
    candidateSkill: string;
    jobSkill: string;
    reasoning: string;
  }>;
  missingCritical: string[];
  additionalStrengths: string[];
  overallMatchScore: number;
  matchExplanation: string;
};

/**
 * JSON Schema for contextual summary
 */
const contextSummarySchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    contextualSummary: { type: SchemaType.STRING },
    keyHighlights: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    relevanceScore: { type: SchemaType.NUMBER },
  },
  required: ["contextualSummary", "keyHighlights", "relevanceScore"],
};

/**
 * JSON Schema for smart matching
 */
const smartMatchSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    exactMatches: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    similarMatches: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          candidateSkill: { type: SchemaType.STRING },
          jobSkill: { type: SchemaType.STRING },
          reasoning: { type: SchemaType.STRING },
        },
        required: ["candidateSkill", "jobSkill", "reasoning"],
      },
    },
    missingCritical: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    additionalStrengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    overallMatchScore: { type: SchemaType.NUMBER },
    matchExplanation: { type: SchemaType.STRING },
  },
  required: ["exactMatches", "similarMatches", "missingCritical", "additionalStrengths", "overallMatchScore", "matchExplanation"],
};

/**
 * Generate context-aware summary based on job requirements
 * 
 * Phase 2 of improved AI implementation.
 * Creates a tailored summary highlighting relevant experience for THIS specific job.
 * 
 * @param profile - Candidate's CV profile from Phase 1
 * @param jobDetails - Job title, department, required skills, description
 * @returns Contextual summary and relevance score
 */
export async function generateContextualSummary(
  profile: CvProfile,
  jobDetails: {
    title: string;
    department: string;
    requiredSkills: string[];
    description: string;
  }
): Promise<ContextualSummary> {
  const prompt = fillPromptTemplate(PROMPTS.CONTEXT_SUMMARY, {
    candidate_profile: JSON.stringify(profile, null, 2),
    job_title: jobDetails.title,
    job_department: jobDetails.department,
    job_required_skills: jobDetails.requiredSkills.join(", "),
    job_description: jobDetails.description.slice(0, 1000), // Truncate long descriptions
  });

  try {
    const model = gemini.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: contextSummarySchema,
        temperature: 0.3, // Slightly more creative for summary generation
        maxOutputTokens: 800,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as ContextualSummary;
  } catch (e) {
    // Fallback: generic summary if AI fails
    return {
      contextualSummary: profile.professionalSummary,
      keyHighlights: profile.skills.technical.slice(0, 5),
      relevanceScore: 50, // Neutral score
    };
  }
}

/**
 * Perform intelligent skill matching with AI understanding
 * 
 * Phase 3 of improved AI implementation.
 * AI understands similar technologies and provides detailed matching explanation.
 * 
 * @param candidateSkills - All technical skills from candidate
 * @param jobRequiredSkills - Required skills for the job
 * @returns Smart match result with explanations
 */
export async function performSmartMatching(
  candidateSkills: string[],
  jobRequiredSkills: string[]
): Promise<SmartMatchResult> {
  const prompt = fillPromptTemplate(PROMPTS.SMART_MATCHING, {
    candidate_skills: candidateSkills.join(", "),
    job_required_skills: jobRequiredSkills.join(", "),
  });

  try {
    const model = gemini.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: smartMatchSchema,
        temperature: 0.2, // Balance between strict and flexible matching
        maxOutputTokens: 1500,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as SmartMatchResult;
  } catch (e) {
    // Fallback: basic exact matching
    return performBasicMatching(candidateSkills, jobRequiredSkills);
  }
}

/**
 * Fallback matching without AI (exact match only)
 */
function performBasicMatching(
  candidateSkills: string[],
  jobRequiredSkills: string[]
): SmartMatchResult {
  const normalizedCandidate = new Set(candidateSkills.map(s => s.toLowerCase().trim()));
  const normalizedJob = jobRequiredSkills.map(s => s.toLowerCase().trim());

  const exactMatches = normalizedJob.filter(skill => normalizedCandidate.has(skill));
  const missingCritical = normalizedJob.filter(skill => !normalizedCandidate.has(skill));
  
  const matchScore = normalizedJob.length > 0 
    ? Math.round((exactMatches.length / normalizedJob.length) * 100)
    : 0;

  return {
    exactMatches,
    similarMatches: [],
    missingCritical,
    additionalStrengths: [],
    overallMatchScore: matchScore,
    matchExplanation: `Candidate matches ${exactMatches.length} out of ${normalizedJob.length} required skills.`,
  };
}
