import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import type {
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  SearchParams,
} from '@/types/api';
import { toast } from 'sonner';

/**
 * Hook to fetch list of jobs with pagination and search
 */
export function useJobs(params?: SearchParams) {
  return useQuery({
    queryKey: queryKeys.jobs.list(params),
    queryFn: () => api.jobs.list(params),
    enabled: true, // Always fetch when component mounts
  });
}

/**
 * Hook to fetch single job detail
 */
export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(jobId!),
    queryFn: () => api.jobs.get(jobId!),
    enabled: !!jobId, // Only fetch if jobId exists
  });
}

/**
 * Hook to fetch job matches (candidates ranked by match score)
 */
export function useJobMatches(jobId: string | undefined, params?: { limit?: number; cursor?: string }) {
  return useQuery({
    queryKey: queryKeys.jobs.matches(jobId!),
    queryFn: () => api.jobs.getMatches(jobId!, params),
    enabled: !!jobId,
  });
}

/**
 * Hook to fetch job candidates rankings
 */
export function useJobCandidates(jobId: string | undefined, params?: { limit?: number; cursor?: string }) {
  return useQuery({
    queryKey: queryKeys.jobs.candidates(jobId!),
    queryFn: () => api.jobs.getCandidates(jobId!, params),
    enabled: !!jobId,
  });
}

/**
 * Hook to create a new job
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobRequest) => api.jobs.create(data),
    onSuccess: (newJob) => {
      // Invalidate jobs list to refetch with new data
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      
      // Optionally add the new job to cache
      queryClient.setQueryData(queryKeys.jobs.detail(newJob.id), newJob);
      
      // Show success toast
      toast.success('Job created successfully', {
        description: `${newJob.title} has been posted`,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to create job', {
        description: error?.message || 'An error occurred while creating the job',
      });
    },
  });
}

/**
 * Hook to update an existing job
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: UpdateJobRequest }) =>
      api.jobs.update(jobId, data),
    onSuccess: (updatedJob, variables) => {
      // Update the specific job in cache
      queryClient.setQueryData(queryKeys.jobs.detail(variables.jobId), updatedJob);
      
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      
      toast.success('Job updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update job', {
        description: error?.message || 'An error occurred',
      });
    },
  });
}

/**
 * Hook to delete a job
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => api.jobs.delete(jobId),
    onSuccess: (_, jobId) => {
      toast.success('Job deleted', {
        description: 'The job posting has been removed',
      });
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
    },
    onError: (error: any) => {
      // Check if it's a 409 Conflict (job has applications)
      if (error?.status === 409) {
        const appCount = error?.applicationCount || 'existing';
        toast.error('Cannot delete job', {
          description: error?.detail || `This job has ${appCount} application(s). Please close the job instead.`,
          duration: 5000, // Longer duration for important message
        });
      } else {
        toast.error('Failed to delete job', {
          description: error?.message || 'Please try again later',
        });
      }
    },
  });
}
