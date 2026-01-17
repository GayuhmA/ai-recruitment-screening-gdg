# Testing Guide - Frontend Integration

## Prerequisites
- Backend server running on http://localhost:3001
- PostgreSQL database connected
- Redis running for BullMQ
- Google Gemini API key configured

## Quick Start Test

### 1. Start the Application
```bash
# Terminal 1 - Start backend
cd backend
npm run start:dev

# Terminal 2 - Start frontend
cd frontend
npm run dev
```

Visit: http://localhost:3000

### 2. Authentication Test
**Objective:** Verify login and session management

1. Navigate to http://localhost:3000/login
2. Try Google OAuth login OR credentials login
3. **Expected:** 
   - ✅ Redirect to /dashboard on success
   - ✅ Toast notification: "Login successful"
   - ✅ User data in session

**Test Navigation:**
- Access protected route without login → should redirect to /login
- Login → should set JWT token in session
- Refresh page → session should persist

### 3. Job Management Test
**Objective:** Test CRUD operations with toast notifications

#### Create Job
1. Go to `/jobs`
2. Click "Create Job" button
3. Fill form:
   - Title: "Senior Software Engineer"
   - Department: "Engineering"
   - Location: "Remote"
   - Employment Type: "FULL_TIME"
   - Required Skills: ["TypeScript", "React", "Node.js"]
4. Submit form
5. **Expected:**
   - ✅ Toast: "Job created successfully - Senior Software Engineer has been posted"
   - ✅ Job appears in list
   - ✅ Redirect to job detail page

#### Update Job
1. Open job detail page
2. Click "Edit" button
3. Change title to "Senior Full Stack Engineer"
4. Save changes
5. **Expected:**
   - ✅ Toast: "Job updated successfully"
   - ✅ Title updated in UI

#### Delete Job
1. Click "Delete" button
2. Confirm deletion
3. **Expected:**
   - ✅ Toast: "Job deleted - The job posting has been removed"
   - ✅ Redirected to jobs list
   - ✅ Job removed from list

### 4. CV Upload & Processing Test
**Objective:** Test file upload with progress and real-time monitoring

1. Create a test job
2. Open job detail page
3. Prepare a test PDF CV file
4. Upload CV:
   - Click "Upload CV" button
   - Select PDF file
   - Enter candidate name and email
5. **Expected:**
   - ✅ Progress bar shows upload percentage (0-100%)
   - ✅ Toast: "CV uploaded successfully - Your CV is now being processed"
   - ✅ Processing banner appears: "⏳ 1 CV currently processing..."
   - ✅ CV status updates every 3 seconds
   - ✅ Status progression: UPLOADED → TEXT_EXTRACTED → AI_DONE
   - ✅ Processing banner disappears when complete
   - ✅ Match score appears in candidate table

**Watch for:**
- Upload progress updates smoothly (check network tab)
- Polling starts automatically
- Data refreshes on completion

### 5. Application Status Update Test
**Objective:** Test status changes with notifications

1. On job detail page, find uploaded candidate
2. Click status dropdown
3. Change status to "SHORTLISTED"
4. **Expected:**
   - ✅ Toast: "Application updated - Application status has been changed"
   - ✅ Status badge updates
   - ✅ Candidate list refreshes

### 6. Error Handling Test
**Objective:** Verify error states and fallbacks

#### Test Network Error
1. Stop backend server
2. Try creating a job
3. **Expected:**
   - ✅ Toast: "Failed to create job - Please try again later"
   - ✅ Form stays open
   - ✅ No crash

#### Test Invalid File Upload
1. Try uploading non-PDF file (e.g., .txt)
2. **Expected:**
   - ✅ Toast: "Failed to upload CV" with error message
   - ✅ Progress bar resets

#### Test Expired Session
1. Clear session/cookies
2. Try accessing protected route
3. **Expected:**
   - ✅ Redirect to /login
   - ✅ No error thrown

### 7. Real-time Updates Test
**Objective:** Verify polling and auto-refresh

1. Upload multiple CVs (3-5)
2. **Watch:**
   - ✅ Processing count updates
   - ✅ Individual CV statuses update
   - ✅ Polling stops when all complete
   - ✅ Candidate table refreshes automatically

3. Open Network tab
4. **Verify:**
   - Polling requests every 3 seconds
   - Requests stop after processing completes
   - No memory leaks (check React DevTools)

### 8. Data Consistency Test
**Objective:** Verify cache invalidation

1. Create a job (Job A)
2. Open Job A in new tab
3. In first tab, update Job A
4. Switch to second tab
5. **Expected:**
   - ✅ Job A auto-updates (refetch on focus)
   - ✅ Data consistent across tabs

### 9. Loading States Test
**Objective:** Check all loading indicators

1. **Dashboard:**
   - Refresh page
   - ✅ Loading states visible
   - ✅ Skeleton loaders (if implemented)

2. **Job Detail:**
   - Navigate to job
   - ✅ Loading spinner before data
   - ✅ Smooth transition to content

3. **Mutations:**
   - Click submit buttons
   - ✅ Button shows loading state
   - ✅ Disabled during request

### 10. Performance Test
**Objective:** Check app responsiveness

1. Create 20+ jobs
2. Navigate between pages
3. **Check:**
   - ✅ No lag in navigation
   - ✅ Data loads quickly (< 2s)
   - ✅ Cache working (instant on revisit)

4. Upload large CV (5MB+)
5. **Check:**
   - ✅ Progress updates smoothly
   - ✅ No UI freeze
   - ✅ Upload completes successfully

## Manual Testing Checklist

### Authentication ✅
- [ ] Google OAuth works
- [ ] Credentials login works
- [ ] Token persists across refreshes
- [ ] Logout clears session
- [ ] Protected routes redirect

### Jobs ✅
- [ ] List displays correctly
- [ ] Create shows success toast
- [ ] Update shows success toast
- [ ] Delete shows success toast
- [ ] Errors show error toast

### CV Upload ✅
- [ ] Upload progress visible
- [ ] Success toast appears
- [ ] Processing banner shows
- [ ] Status updates in real-time
- [ ] Completion refreshes data
- [ ] Error states handled

### Applications ✅
- [ ] Status updates work
- [ ] Toast notifications appear
- [ ] List refreshes correctly

### Candidates ✅
- [ ] Create works with toast
- [ ] Update works with toast
- [ ] Delete works with toast
- [ ] Data displays correctly

### Toast Notifications ✅
- [ ] Success toasts have green color
- [ ] Error toasts have red color
- [ ] Descriptions are clear
- [ ] Dark theme applied
- [ ] Position is top-right
- [ ] Auto-dismiss works

### Error Handling ✅
- [ ] Network errors show toast
- [ ] Invalid data shows toast
- [ ] 401 redirects to login
- [ ] 404 shows not found
- [ ] 500 shows error toast

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

## Mobile Testing (Optional)
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Upload works on mobile

## Known Issues to Watch For

### Issue: Double Toast on Error
**Symptom:** Two error toasts appear
**Cause:** React Query retry + manual error handling
**Fix:** Check retry count in error handler

### Issue: Stale Data After Upload
**Symptom:** New CV doesn't appear
**Cause:** Cache not invalidated
**Fix:** Check queryClient.invalidateQueries calls

### Issue: Polling Doesn't Stop
**Symptom:** Requests continue after processing
**Cause:** enablePolling condition wrong
**Fix:** Check CV status condition

### Issue: Progress Stuck at 0%
**Symptom:** Upload progress doesn't update
**Cause:** Using fetch instead of XMLHttpRequest
**Fix:** Verify api.ts uploadFile implementation

## Performance Benchmarks

**Target Metrics:**
- Initial page load: < 2s
- API response time: < 500ms
- File upload (1MB): < 3s
- CV processing: 10-30s (depends on AI)
- Toast display delay: < 100ms

## Debugging Tips

### Check Network Tab
```
Look for:
- Authorization: Bearer <token>
- Content-Type: application/json
- Status codes: 200, 201, 204
- Upload: multipart/form-data
```

### Check Console
```
Should see:
- No React errors
- No API errors
- Query cache updates
```

### Check React Query DevTools
```
Enable: Add ReactQueryDevtools to layout
Check:
- Query states (loading, success, error)
- Cache entries
- Refetch timing
```

## Test Data Setup

### Create Test User
```bash
POST http://localhost:3001/auth/register
{
  "email": "test@example.com",
  "password": "Password123!",
  "role": "HR"
}
```

### Create Test Job
```bash
POST http://localhost:3001/jobs
{
  "title": "Senior Developer",
  "description": "We are looking for...",
  "department": "Engineering",
  "location": "Remote",
  "employmentType": "FULL_TIME",
  "requiredSkills": ["TypeScript", "React"],
  "status": "OPEN"
}
```

### Prepare Test CVs
Have these files ready:
- valid.pdf (< 5MB, valid PDF)
- large.pdf (> 5MB, test size limit)
- invalid.txt (wrong format)
- empty.pdf (0 bytes)

## Success Criteria

All tests pass if:
✅ All CRUD operations work with toasts
✅ Upload progress displays correctly
✅ Real-time polling works and stops
✅ Error states handled gracefully
✅ No console errors
✅ Data consistency maintained
✅ Performance meets targets

## Report Template

```
# Test Results - [Date]

## Environment
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: PostgreSQL
- Browser: [Chrome/Firefox/Safari]

## Test Results

### Authentication: ✅ PASS / ❌ FAIL
- Notes: [...]

### Jobs CRUD: ✅ PASS / ❌ FAIL
- Notes: [...]

### CV Upload: ✅ PASS / ❌ FAIL
- Notes: [...]

### Toast Notifications: ✅ PASS / ❌ FAIL
- Notes: [...]

### Error Handling: ✅ PASS / ❌ FAIL
- Notes: [...]

## Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce: [...]
   - Expected: [...]
   - Actual: [...]

## Overall Status: ✅ READY / ⚠️ NEEDS FIX / ❌ BLOCKED
```

---

**Happy Testing! 🎉**
