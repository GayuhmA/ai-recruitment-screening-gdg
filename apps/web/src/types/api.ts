// API Response Types based on Prisma schema and API documentation

// ===== Base Types =====
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ===== Enums =====
export enum CvStatus {
  UPLOADED = "UPLOADED",
  TEXT_EXTRACTED = "TEXT_EXTRACTED",
  AI_DONE = "AI_DONE",
  FAILED = "FAILED",
}

export enum CvFailReason {
  S3_UPLOAD_FAILED = "S3_UPLOAD_FAILED",
  PDF_PARSE_FAILED = "PDF_PARSE_FAILED",
  PDF_TEXT_EMPTY = "PDF_TEXT_EMPTY",
  AI_QUOTA_EXCEEDED = "AI_QUOTA_EXCEEDED",
  AI_RATE_LIMITED = "AI_RATE_LIMITED",
  AI_AUTH_FAILED = "AI_AUTH_FAILED",
  AI_TIMEOUT = "AI_TIMEOUT",
  AI_FAILED = "AI_FAILED",
  DB_FAILED = "DB_FAILED",
  UNKNOWN = "UNKNOWN",
}

export enum ApplicationStatus {
  APPLIED = "APPLIED",
  IN_REVIEW = "IN_REVIEW",
  SHORTLISTED = "SHORTLISTED",
  INTERVIEW = "INTERVIEW",
  OFFERED = "OFFERED",
  HIRED = "HIRED",
  REJECTED = "REJECTED",
}

export enum AiOutputType {
  SUMMARY = "SUMMARY",
  SKILLS = "SKILLS",
}

// ===== Entity Types =====
export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Job {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  department: string;
  status: JobStatus;
  requiredSkills: string[];
  requirements?: {
    requiredSkills?: string[];
    experienceYears?: number;
    education?: string;
    location?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    applications?: number;
    hired?: number;
  };
}

export enum JobStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export interface CandidateProfile {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string | null;
  skills: string[];
  experience?: string;
  education?: string;
  createdAt: string;
  updatedAt: string;
  applications: Application[];
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  matchScore: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  createdAt: string;
  updatedAt: string;
  job?: Job;
  candidate?: CandidateProfile;
  cv?: CvDocument;
}

export interface CvDocument {
  id: string;
  applicationId: string;
  s3Key: string;
  mimeType: string;
  status: CvStatus;
  errorMessage: string | null;
  failReason: CvFailReason | null;
  createdAt: string;
  updatedAt: string;
  application?: Application;
}

export interface AiOutput {
  id: string;
  cvDocumentId: string;
  outputType: AiOutputType;
  data: {
    summary?: string;
    skills?: string[];
    experience?: string;
    education?: string;
  };
  createdAt: string;
}

export interface JobCandidateMatch {
  id: string;
  jobId: string;
  candidateProfileId: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  createdAt: string;
}

// ===== Request Types =====
export interface CreateJobRequest {
  title: string;
  description: string;
  department: string;
  status: JobStatus;
  requiredSkills: string[];
  requirements?: {
    experienceYears?: number;
    education?: string;
    location?: string;
  };
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  requirements?: {
    requiredSkills?: string[];
    experienceYears?: number;
    education?: string;
    location?: string;
  };
}

export interface CreateCandidateRequest {
  fullName: string;
  email?: string;
  phone?: string;
}

export interface UpdateCandidateRequest {
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface CreateApplicationRequest {
  candidateProfileId: string;
}

export interface UpdateApplicationRequest {
  status: ApplicationStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  organizationName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ===== Response Types =====
export interface JobListResponse extends PaginatedResponse<Job> {}

export interface CandidateListResponse extends PaginatedResponse<CandidateProfile> {}

export interface ApplicationListResponse extends PaginatedResponse<Application> {}

export interface CvListResponse extends PaginatedResponse<CvDocument> {}

export interface CvStatusResponse {
  id: string;
  status: CvStatus;
  errorMessage: string | null;
  failReason: CvFailReason | null;
  updatedAt: string;
}

export interface CvAiAnalysisResponse {
  aiOutputs: AiOutput[];
}

export interface JobMatchResponse {
  candidateId: string;
  candidateName: string;
  candidateEmail: string | null;
  applicationId: string;
  applicationStatus: ApplicationStatus;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface JobMatchesResponse extends PaginatedResponse<JobMatchResponse> {}

export interface JobCandidateRanking {
  candidate: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  application: {
    id: string;
    status: ApplicationStatus;
    createdAt: string;
  };
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  aiExplanation: string | null;
  cvStatus?: CvStatus;
}

export interface JobCandidateRankingsResponse extends PaginatedResponse<JobCandidateRanking> {}

// ===== Query Parameters =====
export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface SearchParams extends PaginationParams {
  q?: string;
}

export interface ApplicationFilterParams extends PaginationParams {
  jobId?: string;
  candidateId?: string;
}

export interface CvFilterParams extends PaginationParams {
  applicationId?: string;
  status?: CvStatus;
}
