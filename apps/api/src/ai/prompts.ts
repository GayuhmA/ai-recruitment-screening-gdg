/**
 * AI Prompts untuk CV Analysis & Job Matching
 * 
 * Dipisahkan dari logic untuk memudahkan maintenance dan A/B testing
 */

export const PROMPTS = {
  /**
   * Phase 1: Comprehensive CV Parsing
   * Extract FULL candidate profile, not just skills
   */
  CV_PARSING: `
You are an expert CV/Resume analyzer. Extract comprehensive information from this CV.

Return ONLY valid JSON matching this structure:
{
  "personalInfo": {
    "fullName": "string (candidate's full name)",
    "email": "string or null (if available)",
    "phone": "string or null (if available)",
    "location": "string or null (city/country)"
  },
  "professionalSummary": "string (2-3 sentences about candidate's overall profile and experience level)",
  "skills": {
    "technical": ["array of technical skills (lowercase, deduplicated)"],
    "soft": ["array of soft skills like communication, leadership, teamwork"],
    "languages": ["programming/spoken languages"]
  },
  "experience": {
    "totalYears": number (estimated years of professional experience),
    "roles": [
      {
        "title": "string",
        "company": "string",
        "duration": "string (e.g., '2 years', '6 months')",
        "keyResponsibilities": ["array of 2-3 main responsibilities"]
      }
    ]
  },
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string or null",
      "field": "string (major/field of study)"
    }
  ],
  "certifications": ["array of professional certifications"],
  "projects": [
    {
      "name": "string",
      "description": "string (brief)",
      "technologies": ["array of tech used"]
    }
  ]
}

EXTRACTION RULES:
1. Use ONLY information explicitly stated in the CV - do NOT guess or infer
2. For skills: extract ALL mentioned technologies, frameworks, tools (lowercase)
3. For experience: calculate total years from work history dates
4. If a field is not found, use null or empty array []
5. Deduplicate skills and normalize names (e.g., "nodejs" → "node.js")
6. Focus on FACTUAL data, avoid subjective interpretations

CV TEXT:
"""
{cv_text}
"""
`.trim(),

  /**
   * Phase 2: Context-Aware Summary Generation
   * Generate summary specifically tailored to job requirements
   */
  CONTEXT_SUMMARY: `
You are a recruitment AI assistant. Generate a concise, job-focused summary for this candidate.

CANDIDATE PROFILE:
"""
{candidate_profile}
"""

JOB REQUIREMENTS:
"""
Title: {job_title}
Department: {job_department}
Required Skills: {job_required_skills}
Description: {job_description}
"""

Generate a professional summary (2-3 sentences) that:
1. Highlights candidate's RELEVANT experience for THIS specific job
2. Mentions matching skills from job requirements
3. Emphasizes years of experience if applicable
4. Notes any unique qualifications or certifications relevant to the role
5. Be FACTUAL - only mention what's in the candidate profile

Return ONLY JSON:
{
  "contextualSummary": "string (2-3 sentences focused on job fit)",
  "keyHighlights": ["array of 3-5 bullet points showing best matches with job"],
  "relevanceScore": number (0-100, how well candidate fits this specific role based on skills/experience overlap)
}
`.trim(),

  /**
   * Phase 3: Intelligent Skill Matching with Explanations
   * AI understands similar/related technologies
   */
  SMART_MATCHING: `
You are an expert technical recruiter. Analyze skill matching between candidate and job requirements.

CANDIDATE SKILLS:
{candidate_skills}

JOB REQUIRED SKILLS:
{job_required_skills}

Perform SMART matching that understands:
- Similar technologies (e.g., "postgresql" matches "postgres", "mysql")
- Framework relationships (e.g., "react" implies "javascript")
- Tool ecosystems (e.g., "docker" complements "kubernetes")
- Version variations (e.g., "vue.js" matches "vue")

Return ONLY JSON:
{
  "exactMatches": ["skills that match exactly"],
  "similarMatches": [
    {
      "candidateSkill": "string",
      "jobSkill": "string", 
      "reasoning": "string (why they are similar)"
    }
  ],
  "missingCritical": ["job required skills candidate doesn't have"],
  "additionalStrengths": ["candidate skills not required but valuable for the role"],
  "overallMatchScore": number (0-100),
  "matchExplanation": "string (1-2 sentences explaining the match quality)"
}

MATCHING RULES:
1. Be strict on exactMatches (must be same technology)
2. Be reasonable on similarMatches (truly related technologies only)
3. Consider skill depth: having "react" is more valuable than just "javascript"
4. Weight critical skills higher (backend roles need backend skills)
`.trim(),

  /**
   * Fallback: Simple extraction when AI quota is exceeded
   */
  FALLBACK_EXTRACTION: {
    skillKeywords: [
      // Programming Languages
      "javascript", "typescript", "python", "java", "kotlin", "swift", "dart", "flutter",
      "c++", "c#", "ruby", "go", "golang", "rust", "php", "scala", "sql",
      
      // Frontend
      "html", "css", "react", "vue", "angular", "next.js", "nuxt", "svelte",
      "redux", "tailwind", "bootstrap", "sass", "webpack", "vite",
      
      // Backend
      "node.js", "express", "fastify", "nest.js", "django", "flask", "fastapi",
      "spring", "springboot", "laravel", "rails", ".net", "asp.net",
      
      // Databases
      "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "cassandra",
      "dynamodb", "oracle", "mssql", "elasticsearch",
      
      // DevOps & Cloud
      "docker", "kubernetes", "k8s", "jenkins", "github actions", "gitlab ci",
      "aws", "azure", "gcp", "terraform", "ansible", "ci/cd", "linux",
      
      // Mobile
      "android", "ios", "react native", "flutter", "swift", "kotlin",
      
      // Other
      "api", "rest", "graphql", "microservices", "websocket", "grpc",
      "git", "github", "agile", "scrum", "jira", "figma"
    ],
    
    experiencePatterns: [
      /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
      /experience:?\s*(\d+)\+?\s*years?/i,
      /(\d+)\+?\s*years?\s+(?:working|developing)/i
    ]
  }
} as const;

/**
 * Template helper to inject variables into prompts
 */
export function fillPromptTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}
