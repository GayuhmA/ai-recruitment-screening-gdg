import { SchemaType, type Schema } from '@google/generative-ai';
import { gemini, GEMINI_MODEL } from '../lib/gemini.js';
import { PROMPTS, fillPromptTemplate } from './prompts.js';

/**
 * Comprehensive CV Profile (Phase 1 output)
 */
export type CvProfile = {
  personalInfo: {
    fullName: string;
    email: string | null;
    phone: string | null;
    location: string | null;
  };
  professionalSummary: string;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  experience: {
    totalYears: number;
    roles: Array<{
      title: string;
      company: string;
      duration: string;
      keyResponsibilities: string[];
    }>;
  };
  education: Array<{
    degree: string;
    institution: string;
    year: string | null;
    field: string;
  }>;
  certifications: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
};

/**
 * JSON Schema for comprehensive CV parsing
 */
const cvProfileSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    personalInfo: {
      type: SchemaType.OBJECT,
      properties: {
        fullName: { type: SchemaType.STRING },
        email: { type: SchemaType.STRING, nullable: true },
        phone: { type: SchemaType.STRING, nullable: true },
        location: { type: SchemaType.STRING, nullable: true },
      },
      required: ['fullName'],
    },
    professionalSummary: { type: SchemaType.STRING },
    skills: {
      type: SchemaType.OBJECT,
      properties: {
        technical: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        soft: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        languages: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      required: ['technical', 'soft', 'languages'],
    },
    experience: {
      type: SchemaType.OBJECT,
      properties: {
        totalYears: { type: SchemaType.NUMBER },
        roles: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              company: { type: SchemaType.STRING },
              duration: { type: SchemaType.STRING },
              keyResponsibilities: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ['title', 'company', 'duration', 'keyResponsibilities'],
          },
        },
      },
      required: ['totalYears', 'roles'],
    },
    education: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          degree: { type: SchemaType.STRING },
          institution: { type: SchemaType.STRING },
          year: { type: SchemaType.STRING, nullable: true },
          field: { type: SchemaType.STRING },
        },
        required: ['degree', 'institution', 'field'],
      },
    },
    certifications: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          technologies: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ['name', 'description', 'technologies'],
      },
    },
  },
  required: [
    'personalInfo',
    'professionalSummary',
    'skills',
    'experience',
    'education',
    'certifications',
    'projects',
  ],
};

/**
 * Redact PII for security (minimal - email/phone only)
 */
function redactPII(input: string): string {
  return input
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '<EMAIL_HIDDEN>')
    .replace(/\b(\+?\d[\d\s().-]{7,}\d)\b/g, '<PHONE_HIDDEN>');
}

/**
 * Parse CV with AI - Extract comprehensive profile
 *
 * This is Phase 1 of the improved AI implementation.
 * Returns full candidate profile with ALL relevant information.
 *
 * @param extractedText - Raw text extracted from PDF CV
 * @returns CvProfile with comprehensive candidate information
 * @throws Error if AI extraction fails after retries
 */
export async function parseCvWithAI(extractedText: string): Promise<CvProfile> {
  const safeText = redactPII(extractedText).slice(0, 25000); // Focused limit for robust parsing

  const prompt = fillPromptTemplate(PROMPTS.CV_PARSING, {
    cv_text: safeText,
  });

  // Retry logic (2 attempts) for transient errors
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const model = gemini.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: cvProfileSchema,
          temperature: 0, // Maximum determinism
          maxOutputTokens: 8000,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text().trim();

      // Robust JSON extraction: Handle markdown blocks if Gemini accidentally includes them
      if (text.startsWith('```json')) {
        text = text
          .replace(/^```json/, '')
          .replace(/```$/, '')
          .trim();
      } else if (text.startsWith('```')) {
        text = text.replace(/^```/, '').replace(/```$/, '').trim();
      }

      let profile: CvProfile;
      try {
        profile = JSON.parse(text) as CvProfile;
      } catch (parseError) {
        console.error(
          '[(AI-ERROR)] JSON Parse Failed:',
          parseError instanceof Error ? parseError.message : String(parseError),
        );
        throw parseError;
      }

      // Validation: Ensure at least some data was extracted
      if (
        !profile.personalInfo?.fullName &&
        profile.skills.technical.length === 0
      ) {
        throw new Error(
          'AI returned empty profile - CV might be unreadable or in unsupported format',
        );
      }

      return profile;
    } catch (e) {
      if (attempt === 1) {
        throw new Error(
          `AI CV parsing failed after 2 attempts: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
      // Backoff before retry
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw new Error('AI CV parsing failed');
}

/**
 * Fallback parser when AI quota is exceeded
 * Uses keyword matching and regex patterns
 *
 * @param extractedText - Raw text from CV
 * @returns Minimal CvProfile based on keyword extraction
 */
export function parseCvFallback(extractedText: string): CvProfile {
  const text = extractedText.toLowerCase();

  // Extract skills using keyword matching
  const technicalSkills = PROMPTS.FALLBACK_EXTRACTION.skillKeywords.filter(
    (skill) => text.includes(skill.toLowerCase()),
  );

  // Try to extract name (first line often contains name)
  const lines = extractedText.split('\n').filter((l) => l.trim().length > 0);
  const possibleName = lines[0]?.trim() || 'Unknown Candidate';

  // Try to extract years of experience
  let totalYears = 0;
  for (const pattern of PROMPTS.FALLBACK_EXTRACTION.experiencePatterns) {
    const match = extractedText.match(pattern);
    if (match) {
      totalYears = parseInt(match[1], 10);
      break;
    }
  }

  // Generate minimal summary
  const summary =
    technicalSkills.length > 0
      ? `Candidate with experience in ${technicalSkills.slice(0, 3).join(', ')}${totalYears > 0 ? ` with approximately ${totalYears} years of experience` : ''}.`
      : 'Candidate profile (AI extraction unavailable - fallback mode)';

  return {
    personalInfo: {
      fullName: possibleName,
      email: null,
      phone: null,
      location: null,
    },
    professionalSummary: summary,
    skills: {
      technical: technicalSkills,
      soft: [],
      languages: [],
    },
    experience: {
      totalYears,
      roles: [],
    },
    education: [],
    certifications: [],
    projects: [],
  };
}
