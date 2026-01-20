import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import type { CvDocument, CvFilterParams } from '@/types/api';

/**
 * Hook to fetch list of CV documents with filters
 */
export function useCVs(params?: CvFilterParams) {
  return useQuery({
    queryKey: queryKeys.cvs.list(params),
    queryFn: () => api.cvs.list(params),
    enabled: true,
  });
}

/**
 * Hook to fetch single CV document detail
 */
export function useCV(cvId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cvs.detail(cvId!),
    queryFn: () => api.cvs.get(cvId!),
    enabled: !!cvId,
  });
}

/**
 * Hook to fetch CV processing status
 * Useful for polling during CV processing
 */
export function useCVStatus(cvId: string | undefined, enablePolling = false) {
  return useQuery({
    queryKey: queryKeys.cvs.status(cvId!),
    queryFn: () => api.cvs.getStatus(cvId!),
    enabled: !!cvId,
    // Poll every 2 seconds when enabled (faster response time)
    refetchInterval: enablePolling ? 2000 : false,
    staleTime: 0, // Always fetch fresh data
  });
}

/**
 * Hook to fetch CV AI analysis results
 */
export function useCVAiAnalysis(cvId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cvs.aiAnalysis(cvId!),
    queryFn: () => api.cvs.getAiAnalysis(cvId!),
    enabled: !!cvId,
  });
}

/**
 * Hook to upload a CV file with progress tracking
 */
export function useUploadCV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      applicationId, 
      file, 
      onProgress 
    }: { 
      applicationId: string; 
      file: File; 
      onProgress?: (progress: number) => void 
    }) =>
      api.cvs.upload(applicationId, file, onProgress),
    onSuccess: (newCV) => {
      toast.success('CV uploaded successfully', {
        description: 'Your CV is now being processed',
      });
      
      // Invalidate CV lists
      queryClient.invalidateQueries({ queryKey: queryKeys.cvs.lists() });
      
      // Invalidate application detail (now has CV)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.applications.detail(newCV.applicationId) 
      });
      
      // Cache the new CV
      queryClient.setQueryData(queryKeys.cvs.detail(newCV.id), newCV);
      
      // Start monitoring this CV
      queryClient.invalidateQueries({ queryKey: queryKeys.cvs.status(newCV.id) });
    },
    onError: (error: any) => {
      toast.error('Failed to upload CV', {
        description: error?.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to delete a CV document
 */
export function useDeleteCV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cvId: string) => api.cvs.delete(cvId),
    onSuccess: (_, cvId) => {
      toast.success('CV deleted', {
        description: 'The CV document has been removed',
      });
      
      queryClient.removeQueries({ queryKey: queryKeys.cvs.detail(cvId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cvs.lists() });
    },
    onError: (error: any) => {
      toast.error('Failed to delete CV', {
        description: error?.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to monitor CV processing with real-time updates
 * Returns status and automatically refetches until processing is complete
 */
export function useMonitorCVProcessing(cvId: string | undefined) {
  const { data, isLoading, error } = useCVStatus(
    cvId,
    // Enable polling only if CV exists and is still processing
    !!cvId
  );

  const isProcessing = data?.status === 'UPLOADED' || data?.status === 'TEXT_EXTRACTED';
  const isComplete = data?.status === 'AI_DONE';
  const isFailed = data?.status === 'FAILED';

  return {
    status: data?.status,
    isProcessing,
    isComplete,
    isFailed,
    errorMessage: data?.errorMessage,
    failReason: data?.failReason,
    isLoading,
    error,
  };
}
