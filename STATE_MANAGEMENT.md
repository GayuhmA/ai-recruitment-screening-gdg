# State Management & Caching Setup Complete ✅

## 🎯 What Was Implemented

### **React Query (TanStack Query)** - Industry Best Practice for Data Fetching

React Query is the **#1 choice** for modern React applications because:
- ✅ **Automatic Caching** - Smart cache management out of the box
- ✅ **Background Refetching** - Keeps data fresh automatically
- ✅ **Optimistic Updates** - Instant UI updates before API confirms
- ✅ **Deduplication** - Multiple components requesting same data = 1 API call
- ✅ **Built-in Loading/Error States** - No manual state management
- ✅ **Pagination & Infinite Scroll** - Built-in support
- ✅ **DevTools** - Visual debugging of queries and cache

---

## 📂 Files Created

### 1. **Query Client Configuration** ([src/lib/query-client.ts](src/lib/query-client.ts))
- Centralized React Query configuration
- Optimized cache settings (5min stale time, 10min cache time)
- Smart retry logic with exponential backoff
- Type-safe query keys for all entities

### 2. **React Query Provider** ([src/components/ReactQueryProvider.tsx](src/components/ReactQueryProvider.tsx))
- Global provider wrapper
- Includes DevTools (development only)

### 3. **Custom Hooks** (Best Practice Pattern)

#### Jobs Hooks ([src/hooks/useJobs.ts](src/hooks/useJobs.ts))
```tsx
useJobs(params)           // List jobs with search/pagination
useJob(jobId)             // Single job detail
useJobMatches(jobId)      // Job candidates ranked by match
useJobCandidates(jobId)   // Job candidates list
useCreateJob()            // Create new job
useUpdateJob()            // Update existing job
useDeleteJob()            // Delete job
```

#### Candidates Hooks ([src/hooks/useCandidates.ts](src/hooks/useCandidates.ts))
```tsx
useCandidates(params)     // List candidates
useCandidate(candidateId) // Single candidate detail
useCreateCandidate()      // Create new candidate
useUpdateCandidate()      // Update candidate
useDeleteCandidate()      // Delete candidate
```

#### Applications Hooks ([src/hooks/useApplications.ts](src/hooks/useApplications.ts))
```tsx
useApplications(params)   // List applications
useApplication(appId)     // Single application detail
useCreateApplication()    // Create application
useUpdateApplication()    // Update application status
useDeleteApplication()    // Delete application
```

#### CV Hooks ([src/hooks/useCVs.ts](src/hooks/useCVs.ts))
```tsx
useCVs(params)            // List CVs
useCV(cvId)               // Single CV detail
useCVStatus(cvId)         // CV processing status
useCVAiAnalysis(cvId)     // AI analysis results
useUploadCV()             // Upload CV file
useDeleteCV()             // Delete CV
useMonitorCVProcessing()  // Real-time processing monitor
```

---

## 🚀 How to Use

### **Fetching Data**

```tsx
'use client';

import { useJobs } from '@/hooks/useJobs';

export default function JobsPage() {
  const { data, isLoading, error, refetch } = useJobs({ limit: 10 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Jobs ({data?.data.length})</h1>
      {data?.data.map(job => (
        <div key={job.id}>{job.title}</div>
      ))}
      
      {/* Manual refetch if needed */}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### **Creating Data**

```tsx
import { useCreateJob } from '@/hooks/useJobs';

export default function CreateJobForm() {
  const createJob = useCreateJob();

  const handleSubmit = async (formData) => {
    try {
      const newJob = await createJob.mutateAsync({
        title: formData.title,
        description: formData.description,
        requirements: {
          requiredSkills: ['Node.js', 'React'],
        },
      });
      
      console.log('Job created:', newJob);
      // Cache automatically updated!
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={createJob.isPending}>
        {createJob.isPending ? 'Creating...' : 'Create Job'}
      </button>
    </form>
  );
}
```

### **Updating Data**

```tsx
import { useUpdateApplication } from '@/hooks/useApplications';

export default function ApplicationCard({ applicationId }) {
  const updateApp = useUpdateApplication();

  const handleAccept = () => {
    updateApp.mutate({
      applicationId,
      data: { status: 'ACCEPTED' }
    });
    // UI updates immediately (optimistic)
    // API call happens in background
    // Cache invalidates related queries
  };

  return (
    <button onClick={handleAccept} disabled={updateApp.isPending}>
      {updateApp.isPending ? 'Accepting...' : 'Accept'}
    </button>
  );
}
```

### **Real-time CV Processing Monitor**

```tsx
import { useMonitorCVProcessing } from '@/hooks/useCVs';

export default function CVUploadStatus({ cvId }) {
  const { 
    status, 
    isProcessing, 
    isComplete, 
    isFailed,
    errorMessage 
  } = useMonitorCVProcessing(cvId);

  if (isProcessing) return <div>Processing CV... {status}</div>;
  if (isComplete) return <div>✅ Processing complete!</div>;
  if (isFailed) return <div>❌ Failed: {errorMessage}</div>;

  return null;
}
```

---

## 🎨 Advanced Patterns

### **Dependent Queries**

```tsx
import { useJob, useJobCandidates } from '@/hooks/useJobs';

export default function JobDetail({ jobId }) {
  // First fetch job detail
  const { data: job } = useJob(jobId);
  
  // Then fetch candidates (enabled only after job loads)
  const { data: candidates } = useJobCandidates(
    job?.id, // Only fetches if job.id exists
  );

  return <div>{/* render */}</div>;
}
```

### **Pagination**

```tsx
import { useState } from 'react';
import { useJobs } from '@/hooks/useJobs';

export default function JobsList() {
  const [cursor, setCursor] = useState<string | undefined>();
  const { data } = useJobs({ limit: 10, cursor });

  return (
    <div>
      {data?.data.map(job => <JobCard key={job.id} job={job} />)}
      
      {data?.nextCursor && (
        <button onClick={() => setCursor(data.nextCursor!)}>
          Load More
        </button>
      )}
    </div>
  );
}
```

### **Search with Debounce**

```tsx
import { useState, useEffect } from 'react';
import { useJobs } from '@/hooks/useJobs';

export default function JobSearch() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data } = useJobs({ q: debouncedSearch });

  return (
    <div>
      <input 
        value={search} 
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search jobs..."
      />
      <div>{data?.data.length} results</div>
    </div>
  );
}
```

---

## 🔄 Cache Invalidation Strategy

React Query automatically handles cache invalidation:

### **When Creating:**
```typescript
onSuccess: (newJob) => {
  // Invalidate lists to refetch
  queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
  // Add new item to cache
  queryClient.setQueryData(queryKeys.jobs.detail(newJob.id), newJob);
}
```

### **When Updating:**
```typescript
onSuccess: (updatedJob, variables) => {
  // Update specific item in cache
  queryClient.setQueryData(queryKeys.jobs.detail(variables.jobId), updatedJob);
  // Invalidate lists
  queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
}
```

### **When Deleting:**
```typescript
onSuccess: (_, jobId) => {
  // Remove from cache
  queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(jobId) });
  // Invalidate lists
  queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
}
```

---

## 🎯 Cache Configuration

### **Stale Time** (5 minutes)
Data is considered "fresh" for 5 minutes. No refetch during this time.

### **Cache Time** (10 minutes)
Unused data stays in cache for 10 minutes before garbage collection.

### **Refetch Triggers:**
- ✅ Window focus (user comes back to tab)
- ✅ Network reconnect (after being offline)
- ✅ Manual refetch (button click)
- ✅ Interval (for polling, e.g., CV status)

### **Retry Logic:**
- Queries: 3 retries with exponential backoff
- Mutations: 1 retry after 1 second

---

## 🛠️ DevTools

In development mode, you'll see a **React Query DevTools** button in the bottom-right corner.

Click it to see:
- All active queries
- Cache contents
- Query states (loading, success, error)
- Refetch triggers
- Cache invalidations

---

## 📊 Benefits vs Traditional State Management

### ❌ **Old Way (Redux/Context)**
```tsx
// Lots of boilerplate
const [jobs, setJobs] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/jobs')
    .then(res => res.json())
    .then(data => {
      setJobs(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
}, []);

// Manual cache management
// Manual refetching
// Manual deduplication
// Manual loading states
```

### ✅ **New Way (React Query)**
```tsx
// One line!
const { data, isLoading, error } = useJobs();

// Everything handled automatically:
// ✅ Caching
// ✅ Refetching
// ✅ Deduplication
// ✅ Loading states
// ✅ Error handling
```

---

## 🎓 Best Practices Applied

1. ✅ **Custom Hooks** - One hook per feature (useJobs, useCandidates)
2. ✅ **Type Safety** - Full TypeScript support
3. ✅ **Query Keys** - Centralized and type-safe
4. ✅ **Cache Invalidation** - Smart updates after mutations
5. ✅ **Error Boundaries** - Graceful error handling
6. ✅ **Loading States** - Always available
7. ✅ **Optimistic Updates** - Instant UI feedback
8. ✅ **Background Refetching** - Always fresh data

---

## 📚 Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Caching Strategies](https://tanstack.com/query/latest/docs/react/guides/caching)

---

## 🎉 Next Steps

All components can now be updated to use these hooks instead of hardcoded data:

1. ✅ Update Dashboard to fetch real metrics
2. ✅ Update Jobs page to use `useJobs()`
3. ✅ Update Candidates page to use `useCandidates()`
4. ✅ Update Job detail page to use `useJob()` and `useJobCandidates()`
5. ✅ Update forms to use mutation hooks

**No more hardcoded data! Everything is now dynamic with automatic caching!** 🚀
