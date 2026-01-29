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
export function useCVStatus(
  cvId: string | undefined, 
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: queryKeys.cvs.status(cvId!),
    queryFn: () => api.cvs.getStatus(cvId!),
    enabled: options?.enabled ?? !!cvId,
    refetchInterval: options?.refetchInterval ?? false,
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
      
      // Invalidate ALL CV lists
      queryClient.invalidateQueries({ queryKey: queryKeys.cvs.all });
      
      // Invalidate application detail (now has CV)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.applications.detail(newCV.applicationId) 
      });
      
      // Invalidate ALL application lists
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      
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
        { 
      enabled: !!cvId,
      refetchInterval: 3000 // Poll every 3 seconds for real-time updates
    }
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

/**
 * Hook to download a CV document
 * Returns a mutation with loading state
 */
export function useDownloadCV() {
  return useMutation({
    mutationFn: (cvId: string) => api.cvs.download(cvId),
    onSuccess: () => {
      toast.success('CV download started', {
        description: 'Your file will be downloaded shortly',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to download CV', {
        description: error?.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to fetch presigned preview URL for CV (inline display)
 * Only fetches when CV fileStatus is READY
 */
export function useCVPreviewUrl(
  cvId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['cvs', 'preview-url', cvId],
    queryFn: () => api.cvs.getPreviewUrl(cvId!),
    enabled: options?.enabled ?? !!cvId,
    staleTime: 4 * 60 * 1000, // 4 minutes (URL expires in 5 min)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch presigned download URL for CV (attachment)
 * Useful for download button
 */
export function useCVDownloadUrl(
  cvId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<{ url: string; expiresIn: number }>({
    queryKey: ['cvs', 'download-url', cvId],
    queryFn: () => api.cvs.getDownloadUrl(cvId!),
    enabled: options?.enabled ?? !!cvId,
    staleTime: 50 * 60 * 1000, // 50 minutes (URL expires in 1 hour)
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
