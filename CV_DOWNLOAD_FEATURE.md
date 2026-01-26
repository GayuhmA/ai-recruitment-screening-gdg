# Fitur Download & Preview CV - Dokumentasi

## 📋 Overview

Fitur ini memungkinkan pengguna untuk mendownload dan melihat preview CV kandidat yang telah diupload ke sistem. Implementasi menggunakan presigned URLs dari MinIO S3 untuk keamanan dan performa yang optimal.

## 🎯 Fitur yang Ditambahkan

### Backend (NestJS)

1. **S3 Utility Enhancement** (`apps/api/src/lib/s3.ts`)
   - Menambahkan fungsi `getPresignedDownloadUrl()` untuk generate URL download yang aman
   - URL expires dalam 1 jam untuk keamanan

2. **CV Module** (Baru)
   - `CvController` - Controller untuk handle request CV
   - `CvService` - Service layer untuk business logic
   - `CvModule` - Module NestJS untuk dependency injection

3. **Endpoint Baru**
   - `GET /cvs/:cvId/download` - Generate presigned download URL
   - Response:
     ```json
     {
       "url": "https://minio-presigned-url...",
       "filename": "cv_john_doe_2026-01-22.pdf",
       "expiresIn": 3600
     }
     ```

### Frontend (Next.js)

1. **API Client Updates** (`apps/web/src/lib/api.ts`)
   - `getDownloadUrl()` - Fetch presigned URL dari backend
   - `download()` - Trigger browser download secara otomatis

2. **Custom Hooks** (`apps/web/src/hooks/useCVs.ts`)
   - `useDownloadCV()` - Hook untuk download dengan loading state dan toast notification
   - `useCVDownloadUrl()` - Hook untuk fetch URL (useful untuk preview)

3. **UI Components**
   - `CVViewer` (`apps/web/src/components/features/CVViewer.tsx`)
     - Display CV information dengan status badge
     - Download button dengan loading state
     - Preview button untuk toggle PDF iframe
     - Error handling untuk failed CVs
   
   - `CVsPage` (`apps/web/src/app/(main)/cvs/page.tsx`)
     - List semua CV documents
     - Search functionality
     - CV selection untuk preview
     - Responsive layout (list + viewer)

4. **Navigation Update**
   - Menambahkan menu "CVs" di sidebar dengan icon FileText

## 🚀 Cara Menggunakan

### Untuk Pengguna

1. **Akses Halaman CVs**
   - Klik menu "CVs" di sidebar
   - Atau navigasi ke `/cvs`

2. **Lihat Daftar CV**
   - Semua CV yang diupload ditampilkan di panel kiri
   - Status badge menunjukkan:
     - 🟢 **Processed** - CV berhasil diproses AI
     - 🔵 **Processing** - CV sedang diproses
     - 🔴 **Failed** - CV gagal diproses

3. **Search CV**
   - Gunakan search box untuk filter berdasarkan:
     - Nama kandidat
     - Job title
     - CV ID

4. **Preview & Download**
   - Klik pada CV untuk memilih
   - Klik "Download PDF" untuk download file
   - Klik "Show Preview" untuk melihat PDF di browser
   - Preview menggunakan iframe dengan PDF viewer bawaan browser

### Untuk Developer

#### Backend API Call
```typescript
// Get download URL
GET /cvs/{cvId}/download

// Response
{
  "url": "presigned-url",
  "filename": "cv_candidate_name.pdf",
  "expiresIn": 3600
}
```

#### Frontend Usage
```typescript
import { useDownloadCV, useCVDownloadUrl } from '@/hooks/useCVs';

// For direct download
const downloadMutation = useDownloadCV();
downloadMutation.mutate(cvId);

// For getting URL (preview, custom handling)
const { data: downloadData } = useCVDownloadUrl(cvId);
const previewUrl = downloadData?.url;
```

#### Component Usage
```tsx
import { CVViewer } from '@/components/features/CVViewer';

<CVViewer cvId="cv-uuid-here" />
```

## 🔒 Keamanan

1. **Presigned URLs**
   - URLs expire dalam 1 jam
   - Tidak perlu expose S3 credentials ke frontend
   - Setiap request generate URL baru

2. **Authentication**
   - Endpoint memerlukan authentication (Bearer token)
   - Hanya authorized users yang bisa download CV

3. **Validation**
   - Backend validate CV existence sebelum generate URL
   - Error handling untuk CV yang tidak ditemukan

## 🎨 UI/UX Features

1. **Status Indicators**
   - Color-coded badges untuk status CV
   - Loading states untuk async operations
   - Error messages yang informatif

2. **Responsive Design**
   - Mobile-friendly layout
   - Sidebar collapse untuk tablet
   - Grid system yang adaptif

3. **User Feedback**
   - Toast notifications untuk success/error
   - Loading spinners
   - Empty states dengan helpful messages

## 📊 File Structure

```
apps/
├── api/
│   └── src/
│       ├── lib/
│       │   └── s3.ts (updated)
│       └── cv/
│           ├── cv.controller.ts (new)
│           ├── cv.service.ts (new)
│           └── cv.module.ts (new)
└── web/
    └── src/
        ├── app/
        │   └── (main)/
        │       └── cvs/
        │           └── page.tsx (new)
        ├── components/
        │   ├── features/
        │   │   └── CVViewer.tsx (new)
        │   └── layout/
        │       └── sidebar.tsx (updated)
        ├── hooks/
        │   └── useCVs.ts (updated)
        └── lib/
            └── api.ts (updated)
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] CV list loads correctly
- [ ] Search functionality works
- [ ] CV selection highlights correctly
- [ ] Download button triggers file download
- [ ] Preview shows PDF correctly in iframe
- [ ] Status badges display correct colors
- [ ] Error states display properly
- [ ] Loading states work correctly
- [ ] Mobile responsive

### API Testing
```bash
# Get CV download URL
curl -X GET http://localhost:3001/cvs/{cvId}/download \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Environment Variables

Pastikan variable berikut sudah di-set di `.env`:

```env
# S3/MinIO Configuration
S3_ENDPOINT=http://127.0.0.1:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=cv-docs
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

## 📝 Notes

1. **Browser Compatibility**
   - PDF preview requires browser yang support PDF viewing
   - Fallback: User bisa download dan buka secara manual

2. **File Size**
   - Presigned URL supports file apapun yang ada di S3
   - Tidak ada limit dari implementation (limit dari MinIO/S3)

3. **Performance**
   - Presigned URLs di-cache selama 5 menit di frontend
   - Reduces API calls untuk repeated previews
   - URLs expire di server setelah 1 jam

## 🚀 Next Steps (Optional Improvements)

1. **Bulk Download**
   - Download multiple CVs as ZIP

2. **PDF Annotations**
   - Add notes/highlights to PDFs

3. **Version History**
   - Track CV uploads/updates

4. **Advanced Preview**
   - Use dedicated PDF viewer library (pdf.js)
   - Add zoom, pagination controls

5. **Analytics**
   - Track CV views/downloads
   - Popular CVs metrics

---

**Created:** January 22, 2026  
**Status:** ✅ Complete and Ready for Use
