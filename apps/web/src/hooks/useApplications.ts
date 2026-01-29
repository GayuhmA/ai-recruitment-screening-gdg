import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationFilterParams,
} from '@/types/api';

/**
 * Hook to fetch list of applications with filters
 */
export function useApplications(params?: ApplicationFilterParams) {
  return useQuery({
    queryKey: queryKeys.applications.list(params),
    queryFn: () => api.applications.list(params),
    enabled: true,
  });
}

/**
 * Hook to fetch single application detail
 */
export function useApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.detail(applicationId!),
    queryFn: () => api.applications.get(applicationId!),
    enabled: !!applicationId,
  });
}

/**
 * Hook to create a new application
 */
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      data,
    }: {
      jobId: string;
      data: CreateApplicationRequest;
    }) => api.applications.create(jobId, data),
    onSuccess: (newApplication, variables) => {
      toast.success('Application submitted', {
        description: `Application for ${newApplication.candidate?.name || 'candidate'} has been created`,
      });

      // Invalidate ALL applications (paling aman untuk memastikan data konsisten)
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });

      // Invalidate job-specific data (matches and candidates)
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs.matches(newApplication.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs.candidates(newApplication.jobId),
      });

      // Invalidate candidates (application affects candidate data)
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all });

      // Cache the new application
      queryClient.setQueryData(
        queryKeys.applications.detail(newApplication.id),
        newApplication,
      );
    },
    onError: (error: any) => {
      toast.error('Failed to create application', {
        description: error?.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to update application status
 */
export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      data,
    }: {
      applicationId: string;
      data: UpdateApplicationRequest;
    }) => api.applications.update(applicationId, data),
    onSuccess: (updatedApplication, variables) => {
      toast.success('Application updated', {
        description: 'Application status has been changed',
      });

      // Update cache
      queryClient.setQueryData(
        queryKeys.applications.detail(variables.applicationId),
        updatedApplication,
      );

      // Invalidate ALL applications
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });

      // Invalidate job matches/candidates (status change affects ranking)
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs.matches(updatedApplication.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs.candidates(updatedApplication.jobId),
      });

      // Invalidate candidates (application status affects candidate data)
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all });
    },
    onError: (error: any) => {
      toast.error('Failed to update application', {
        description: error?.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to delete an application
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) =>
      api.applications.delete(applicationId),
    onSuccess: (_, applicationId) => {
      toast.success('Application deleted', {
        description: 'The application has been removed',
      });

      queryClient.removeQueries({
        queryKey: queryKeys.applications.detail(applicationId),
      });

      // Invalidate ALL applications
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });

      // Invalidate candidates (deleting application affects candidate data)
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all });
    },
    onError: (error: any) => {
      toast.error('Failed to delete application', {
        description: error?.message || 'Please try again later',
      });
    },
  });
}
