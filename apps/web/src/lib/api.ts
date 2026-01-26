/**
 * API Client for AI Recruitment Backend
 * 
 * Features:
 * - Type-safe HTTP requests
 * - Automatic token management
 * - Error handling with user-friendly messages
 * - Request/response interceptors
 */

import type {
  ApiError,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Job,
  JobListResponse,
  CreateJobRequest,
  UpdateJobRequest,
  CandidateProfile,
  CandidateListResponse,
  CreateCandidateRequest,
  UpdateCandidateRequest,
  Application,
  ApplicationListResponse,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  CvDocument,
  CvListResponse,
  CvStatusResponse,
  CvAiAnalysisResponse,
  JobMatchesResponse,
  JobCandidateRankingsResponse,
  SearchParams,
  ApplicationFilterParams,
  CvFilterParams,
} from '@/types/api';

// ===== Configuration =====
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// ===== Token Management =====
export const tokenManager = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getUser(): any {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser(user: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
};

// ===== Custom Error Class =====
export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// ===== HTTP Client =====
class HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getHeaders(includeAuth: boolean = true, hasBody: boolean = true): HeadersInit {
    const headers: Record<string, string> = {};

    // Only set Content-Type if request has body
    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth) {
      const token = tokenManager.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      let errorDetail = '';

      if (isJson) {
        try {
          const text = await response.text();
          if (text) {
            const errorData: ApiError = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
            errorDetail = errorData.error || '';
          }
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText;
        }
      } else {
        errorMessage = response.statusText;
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        tokenManager.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      throw new ApiClientError(response.status, errorMessage, errorDetail);
    }

    // Handle empty responses (e.g., 204 No Content or empty body)
    if (response.status === 204) {
      return {} as T;
    }

    // Check if response has content before parsing JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      return {} as T;
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse JSON response:', text);
      return {} as T;
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    includeAuth: boolean = true
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(includeAuth, false),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(includeAuth, body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(includeAuth, body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(
    endpoint: string,
    includeAuth: boolean = true
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth, false),
    });

    return this.handleResponse<T>(response);
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'cv',
    includeAuth: boolean = true,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const headers: HeadersInit = {};
    if (includeAuth) {
      const token = tokenManager.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    // Don't set Content-Type for multipart/form-data, browser will set it with boundary

    // Use XMLHttpRequest if progress callback is provided (fetch doesn't support upload progress)
    if (onProgress && typeof XMLHttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data as T);
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(errorData);
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', `${this.baseURL}${endpoint}`);
        
        // Set headers
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.send(formData);
      });
    }

    // Fallback to fetch if no progress callback
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// ===== API Client Instance =====
const httpClient = new HttpClient(API_BASE_URL);

// ===== API Methods =====

/**
 * Authentication API
 */
export const authAPI = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/login', data, false);
    tokenManager.setToken(response.accessToken);
    tokenManager.setUser(response.user);
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/register', data, false);
    tokenManager.setToken(response.accessToken);
    tokenManager.setUser(response.user);
    return response;
  },

  logout(): void {
    tokenManager.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  getCurrentUser() {
    return tokenManager.getUser();
  },

  isAuthenticated(): boolean {
    return !!tokenManager.getToken();
  },
};

/**
 * Health Check API
 */
export const healthAPI = {
  async check(): Promise<{ ok: boolean }> {
    return httpClient.get('/health', undefined, false);
  },
};

/**
 * Users API
 */
export const usersAPI = {
  async getCurrentUser(): Promise<User> {
    return httpClient.get('/users/me');
  },
};

/**
 * Jobs API
 */
export const jobsAPI = {
  async list(params?: SearchParams): Promise<JobListResponse> {
    return httpClient.get('/jobs', params as any);
  },

  async get(jobId: string): Promise<Job> {
    return httpClient.get(`/jobs/${jobId}`);
  },

  async create(data: CreateJobRequest): Promise<Job> {
    return httpClient.post('/jobs', data);
  },

  async update(jobId: string, data: UpdateJobRequest): Promise<Job> {
    return httpClient.patch(`/jobs/${jobId}`, data);
  },

  async delete(jobId: string): Promise<{ message: string }> {
    return httpClient.delete(`/jobs/${jobId}`);
  },

  async getMatches(jobId: string, params?: { limit?: number; cursor?: string }): Promise<JobMatchesResponse> {
    return httpClient.get(`/jobs/${jobId}/matches`, params as any);
  },

  async getCandidates(jobId: string, params?: { limit?: number; cursor?: string }): Promise<JobCandidateRankingsResponse> {
    return httpClient.get(`/jobs/${jobId}/candidates`, params as any);
  },
};

/**
 * Candidates API
 */
export const candidatesAPI = {
  async list(params?: SearchParams): Promise<CandidateListResponse> {
    return httpClient.get('/candidates', params as any);
  },

  async get(candidateId: string): Promise<CandidateProfile> {
    return httpClient.get(`/candidates/${candidateId}`);
  },

  async create(data: CreateCandidateRequest): Promise<CandidateProfile> {
    return httpClient.post('/candidates', data);
  },

  async update(candidateId: string, data: UpdateCandidateRequest): Promise<CandidateProfile> {
    return httpClient.patch(`/candidates/${candidateId}`, data);
  },

  async delete(candidateId: string): Promise<{ message: string }> {
    return httpClient.delete(`/candidates/${candidateId}`);
  },
};

/**
 * Applications API
 */
export const applicationsAPI = {
  async list(params?: ApplicationFilterParams): Promise<ApplicationListResponse> {
    return httpClient.get('/applications', params as any);
  },

  async get(applicationId: string): Promise<Application> {
    return httpClient.get(`/applications/${applicationId}`);
  },

  async create(jobId: string, data: CreateApplicationRequest): Promise<Application> {
    return httpClient.post(`/jobs/${jobId}/applications`, data);
  },

  async update(applicationId: string, data: UpdateApplicationRequest): Promise<Application> {
    return httpClient.patch(`/applications/${applicationId}`, data);
  },

  async delete(applicationId: string): Promise<{ message: string }> {
    return httpClient.delete(`/applications/${applicationId}`);
  },
};

/**
 * CV Documents API
 */
export const cvsAPI = {
  async list(params?: CvFilterParams): Promise<CvListResponse> {
    return httpClient.get('/cvs', params as any);
  },

  async get(cvId: string): Promise<CvDocument> {
    return httpClient.get(`/cvs/${cvId}`);
  },

  async getStatus(cvId: string): Promise<CvStatusResponse> {
    return httpClient.get(`/cvs/${cvId}/status`);
  },

  async getAiAnalysis(cvId: string): Promise<CvAiAnalysisResponse> {
    return httpClient.get(`/cvs/${cvId}/ai`);
  },

  async upload(
    applicationId: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<CvDocument> {
    return httpClient.uploadFile(`/applications/${applicationId}/cv`, file, 'cv', true, onProgress);
  },

  async delete(cvId: string): Promise<{ message: string }> {
    return httpClient.delete(`/cvs/${cvId}`);
  },

  async getPreviewUrl(cvId: string): Promise<{ url: string; expiresIn: number }> {
    return httpClient.get(`/cvs/${cvId}/preview-url`);
  },

  async getDownloadUrl(cvId: string): Promise<{ url: string; expiresIn: number }> {
    return httpClient.get(`/cvs/${cvId}/download-url`);
  },

  async download(cvId: string): Promise<void> {
    try {
      const { url } = await this.getDownloadUrl(cvId);
      
      // Simply navigate to the signed URL - browser will handle download
      window.location.href = url;
    } catch (error) {
      console.error('Failed to download CV:', error);
      throw error;
    }
  },
};

/**
 * Main API Client Export
 */
export const api = {
  auth: authAPI,
  health: healthAPI,
  users: usersAPI,
  jobs: jobsAPI,
  candidates: candidatesAPI,
  applications: applicationsAPI,
  cvs: cvsAPI,
};

export default api;
