# Real-time Updates & File Upload Implementation - Complete ✅

## Overview
Implemented complete real-time CV processing monitoring and proper multipart/form-data file upload with progress tracking.

---

## 6. ✅ Real-time Updates

### **CV Processing Status Monitoring**

**Implementation**: Polling-based real-time updates using React Query

**Location**: `src/app/jobs/[id]/page.tsx`

**Features**:
1. **Automatic Polling**: 
   - Polls CV status every 3 seconds when CV is processing
   - Stops polling when status is COMPLETE or FAILED
   - Configured in `useCVStatus()` hook

2. **Processing States**:
   ```typescript
   UPLOADED → TEXT_EXTRACTED → AI_DONE (or FAILED)
   ```

3. **UI Components**:
   - **Processing Banner**: Shows count of CVs being processed
   - **Status Indicators**: Per-CV processing status with spinner
   - **Auto-refresh**: Candidates list updates when processing completes

4. **CVProcessingStatus Component**:
   ```typescript
   const { status, isProcessing, isComplete, isFailed } = useMonitorCVProcessing(cvId);
   
   // Displays:
   // - "AI is analyzing CV..." with spinner (yellow) when processing
   // - "Processing failed" with alert icon (red) on failure  
   // - Auto-removes from queue when complete
   // - Auto-refreshes candidate list on completion
   ```

**Hook Configuration** (`src/hooks/useCVs.ts`):
```typescript
export function useCVStatus(cvId: string | undefined, enablePolling = false) {
  return useQuery({
    queryKey: queryKeys.cvs.status(cvId!),
    queryFn: () => api.cvs.getStatus(cvId!),
    enabled: !!cvId,
    refetchInterval: enablePolling ? 3000 : false, // Poll every 3s
  });
}
```

**Visual Indicators**:
- 🟡 Yellow banner: "Processing X CV(s) with AI..."
- 🔄 Spinning loader: Real-time processing status
- ✅ Auto-dismiss: Removes from queue when complete
- 🔄 Auto-refresh: Updates candidate list with new data

---

## 7. ✅ File Upload Handler

### **Multipart/Form-Data Upload**

**Implementation**: Enhanced HTTP client with XMLHttpRequest for progress tracking

**Location**: `src/lib/api.ts`

**Features**:

1. **Multipart/Form-Data**:
   - Proper FormData construction
   - Automatic Content-Type with boundary
   - Authorization header injection
   - File field naming ("cv")

2. **Progress Tracking**:
   - Real-time upload progress (0-100%)
   - XMLHttpRequest for progress events
   - Fallback to fetch if no progress needed
   - Per-file progress tracking

3. **Enhanced uploadFile Method**:
   ```typescript
   async uploadFile<T>(
     endpoint: string,
     file: File,
     fieldName: string = 'cv',
     includeAuth: boolean = true,
     onProgress?: (progress: number) => void  // NEW!
   ): Promise<T>
   ```

**Upload Flow**:
```typescript
// 1. User selects files
const files = Array.from(e.target.files);

// 2. For each file:
const cvDoc = await uploadCVMutation.mutateAsync({
  applicationId: application.id,
  file: file,
  onProgress: (progress) => {
    setUploadProgress(prev => new Map(prev).set(file.name, progress));
  },
});

// 3. Progress tracked via XMLHttpRequest
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentComplete = (e.loaded / e.total) * 100;
    onProgress(Math.round(percentComplete));
  }
});
```

### **Upload Progress Indicator**

**Visual Features**:
1. **File List Display**:
   - File name with size (KB)
   - Status icon (spinner or checkmark)
   - Progress bar during upload
   - Percentage display

2. **Progress Bar**:
   ```tsx
   <div className="w-full h-1.5 rounded-full bg-zinc-700">
     <div
       className="h-full bg-gradient-to-r from-violet-500 to-indigo-600"
       style={{ width: `${progress}%` }}
     />
   </div>
   ```

3. **States**:
   - ⏳ Uploading: Spinner + progress bar + percentage
   - ✅ Complete: Green checkmark
   - ❌ Failed: Red alert icon

**Example UI**:
```
┌─────────────────────────────────────┐
│ 📄 john-doe-resume.pdf    125.5 KB │
│ ⟳ Uploading...              73%    │
│ ████████████████░░░░░░░░            │
└─────────────────────────────────────┘
```

---

## Technical Implementation Details

### **State Management**

```typescript
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
const [uploadingFiles, setUploadingFiles] = useState<Map<string, boolean>>(new Map());
const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
const [processingCVs, setProcessingCVs] = useState<Set<string>>(new Set());
```

### **Upload Process**

```typescript
const handleProcessCVs = async () => {
  for (const file of selectedFiles) {
    // 1. Track upload state
    setUploadingFiles(prev => new Map(prev).set(file.name, true));
    setUploadProgress(prev => new Map(prev).set(file.name, 0));
    
    // 2. Create application
    const application = await api.applications.create(jobData.id, {...});
    
    // 3. Upload CV with progress tracking
    const cvDoc = await uploadCVMutation.mutateAsync({
      applicationId: application.id,
      file: file,
      onProgress: (progress) => {
        setUploadProgress(prev => new Map(prev).set(file.name, progress));
      },
    });
    
    // 4. Add to processing queue for monitoring
    setProcessingCVs(prev => new Set(prev).add(cvDoc.id));
    
    // 5. Clear upload state
    setUploadingFiles(prev => new Map(prev).set(file.name, false));
  }
  
  // 6. Refresh candidates list
  queryClient.invalidateQueries({ queryKey: queryKeys.jobs.candidates(id) });
};
```

### **Monitoring Process**

```typescript
const CVProcessingStatus = ({ cvId }: { cvId: string }) => {
  // Automatically polls every 3 seconds
  const { status, isProcessing, isComplete, isFailed } = useMonitorCVProcessing(cvId);

  if (isComplete) {
    // Remove from processing queue
    setProcessingCVs(prev => {
      const next = new Set(prev);
      next.delete(cvId);
      return next;
    });
    // Refresh candidates to show updated data
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs.candidates(id) });
    return null;
  }

  if (isFailed) {
    return <ErrorDisplay />;
  }

  if (isProcessing) {
    return <ProcessingDisplay />;
  }

  return null;
};
```

---

## API Integration

### **Endpoints Used**

| Operation | Method | Endpoint | Purpose |
|-----------|--------|----------|---------|
| Upload CV | POST | `/applications/:id/cv` | Upload PDF with multipart/form-data |
| Get CV Status | GET | `/cvs/:id/status` | Poll for processing status |
| Get CV Analysis | GET | `/cvs/:id/ai` | Retrieve AI analysis results |

### **Expected Backend Response**

**Upload Response**:
```json
{
  "id": "cv_123",
  "applicationId": "app_456",
  "status": "UPLOADED",
  "s3Key": "cvs/cv_123.pdf",
  "mimeType": "application/pdf",
  "createdAt": "2026-01-16T10:30:00Z"
}
```

**Status Response** (Polling):
```json
{
  "id": "cv_123",
  "status": "TEXT_EXTRACTED",  // or "AI_DONE", "FAILED"
  "errorMessage": null,
  "failReason": null
}
```

---

## User Experience Flow

### **Upload & Processing Flow**

1. **User uploads PDF files**
   - Drag & drop or file picker
   - Multiple file support
   - PDF validation

2. **Upload with progress**
   - Progress bar per file
   - Percentage display
   - Real-time updates

3. **Processing notification**
   - Yellow banner appears
   - "Processing X CVs with AI..."
   - Shows processing status per CV

4. **Real-time monitoring**
   - Auto-polls every 3 seconds
   - Updates status dynamically
   - Shows spinner during processing

5. **Completion**
   - Banner auto-dismisses
   - Candidates list refreshes
   - New candidates appear with scores

### **Error Handling**

- Upload failures show error message
- Processing failures display alert icon
- Network errors caught and logged
- User-friendly error messages

---

## Benefits

✅ **Real-time Feedback**: Users see processing status in real-time
✅ **Upload Progress**: Visual progress bars show upload status  
✅ **Automatic Updates**: No manual refresh needed
✅ **Error Visibility**: Clear error states and messages
✅ **Efficient Polling**: Only polls when needed, stops when complete
✅ **Smooth UX**: Auto-dismissing notifications, seamless updates

---

## Configuration

### **Polling Interval**

```typescript
// src/hooks/useCVs.ts
refetchInterval: enablePolling ? 3000 : false // 3 seconds
```

Adjust this value to:
- Increase: Less server load, slower updates (e.g., 5000ms)
- Decrease: More server load, faster updates (e.g., 2000ms)

### **Progress Update Frequency**

Progress updates fire on every XMLHttpRequest progress event (typically every few KB uploaded).

---

## Testing Checklist

### Upload & Progress
- [ ] Select PDF file(s)
- [ ] Verify progress bar appears
- [ ] Verify percentage increases 0% → 100%
- [ ] Verify multiple files upload sequentially
- [ ] Verify error handling for failed uploads

### Real-time Monitoring
- [ ] Upload CV successfully
- [ ] Verify "Processing" banner appears
- [ ] Verify status updates automatically
- [ ] Verify banner disappears when complete
- [ ] Verify candidate appears in table
- [ ] Verify no manual refresh needed

### Edge Cases
- [ ] Test with large files (>5MB)
- [ ] Test with multiple files simultaneously
- [ ] Test network interruption during upload
- [ ] Test backend processing failure
- [ ] Test closing dialog during upload

---

## Future Enhancements (Optional)

1. **WebSocket Support**:
   - Replace polling with WebSocket for instant updates
   - Lower server load
   - True real-time communication

2. **Concurrent Uploads**:
   - Upload multiple files in parallel
   - Faster batch processing
   - Promise.all() for parallel execution

3. **Upload Resumption**:
   - Resume failed uploads
   - Chunked upload for large files
   - Better reliability

4. **Enhanced Notifications**:
   - Toast notifications on completion
   - Sound/desktop notifications
   - Email notifications

---

## Summary

✅ **Real-time CV processing monitoring** with 3-second polling
✅ **Automatic UI updates** when processing completes
✅ **Multipart/form-data upload** with proper headers
✅ **Upload progress indicators** with visual progress bars
✅ **Processing status banner** showing active CV analyses
✅ **Error handling** for upload and processing failures
✅ **Automatic refresh** of candidate list on completion

Frontend is now fully equipped with real-time updates and professional file upload handling! 🚀
