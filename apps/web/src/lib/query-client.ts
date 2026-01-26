import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Optimized for production use with smart defaults
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      
      // Cache time: How long unused data stays in cache (10 minutes)
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests (3 attempts with exponential backoff)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (good for keeping data fresh)
      refetchOnWindowFocus: true,
      
      // Refetch on reconnect (good for offline scenarios)
      refetchOnReconnect: true,
      
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Query Keys - Centralized for type safety and easy invalidation
 */
export const queryKeys = {
  // Health check
  health: ['health'] as const,
  
  // Jobs
  jobs: {
    all: ['jobs'] as const,
    lists: () => [...queryKeys.jobs.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.jobs.lists(), params] as const,
    details: () => [...queryKeys.jobs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
    matches: (id: string) => [...queryKeys.jobs.detail(id), 'matches'] as const,
    candidates: (id: string) => [...queryKeys.jobs.detail(id), 'candidates'] as const,
  },
  
  // Candidates
  candidates: {
    all: ['candidates'] as const,
    lists: () => [...queryKeys.candidates.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.candidates.lists(), params] as const,
    details: () => [...queryKeys.candidates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.candidates.details(), id] as const,
  },
  
  // Applications
  applications: {
    all: ['applications'] as const,
    lists: () => [...queryKeys.applications.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.applications.lists(), params] as const,
    details: () => [...queryKeys.applications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.applications.details(), id] as const,
  },
  
  // CVs
  cvs: {
    all: ['cvs'] as const,
    lists: () => [...queryKeys.cvs.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.cvs.lists(), params] as const,
    details: () => [...queryKeys.cvs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cvs.details(), id] as const,
    status: (id: string) => [...queryKeys.cvs.detail(id), 'status'] as const,
    aiAnalysis: (id: string) => [...queryKeys.cvs.detail(id), 'ai-analysis'] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
  },
} as const;
