'use client';

import React, { use, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  ArrowUpDown,
  Eye,
  Upload,
  FileText,
  X,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  XCircle,
  Sparkles,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { useJob, useJobCandidates } from '@/hooks/useJobs';
import { useUploadCV } from '@/hooks/useCVs';
import { JobStatus } from '@/types/api';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { api } from '@/lib/api';

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

// Helper function to get initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper to get score color
function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-violet-500';
  return 'bg-amber-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-violet-400';
  return 'text-amber-400';
}

// Helper to get status badge style
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'HIRED':
      return 'bg-emerald-500/20 text-emerald-400';
    case 'REJECTED':
      return 'bg-red-500/20 text-red-400';
    case 'INTERVIEW':
      return 'bg-purple-500/20 text-purple-400';
    case 'SHORTLISTED':
      return 'bg-amber-500/20 text-amber-400';
    default:
      return 'bg-blue-500/20 text-blue-400';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'HIRED':
      return 'Accepted';
    case 'APPLIED':
    case 'IN_REVIEW':
      return 'New';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Delete job state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit job state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: JobStatus.OPEN as JobStatus,
    requiredSkills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');

  // Constants
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

  // Fetch job details and candidates from API
  const { data: job, isLoading: jobLoading } = useJob(id);
  const { data: candidatesData, isLoading: candidatesLoading } =
    useJobCandidates(id);

  // Mutations
  const uploadCVMutation = useUploadCV();

  const processingCandidates = useMemo(() => {
    if (!candidatesData?.data) return [];
    return candidatesData.data.filter((c) => c.matchScore === 0);
  }, [candidatesData]);

  useEffect(() => {
    if (processingCandidates.length > 0) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.jobs.candidates(id),
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [processingCandidates.length, id, queryClient]);

  // Filter candidates based on search and status
  const filteredCandidates = useMemo(() => {
    if (!candidatesData?.data) return [];

    return candidatesData.data.filter((candidate) => {
      const matchesSearch =
        searchQuery === '' ||
        candidate.candidate.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        candidate.candidate.email
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || candidate.application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [candidatesData, searchQuery, statusFilter]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newStatuses: FileUploadStatus[] = files
        .filter(
          (file) =>
            file.type === 'application/pdf' && file.size <= MAX_FILE_SIZE,
        )
        .map((file) => ({
          file,
          status: 'pending' as const,
          progress: 0,
        }));
      setFileStatuses((prev) => [...prev, ...newStatuses]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf' && f.size <= MAX_FILE_SIZE,
    );
    const newStatuses: FileUploadStatus[] = files.map((file) => ({
      file,
      status: 'pending' as const,
      progress: 0,
    }));
    setFileStatuses((prev) => [...prev, ...newStatuses]);
  };

  const removeFile = (index: number) => {
    setFileStatuses((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileStatus = (
    index: number,
    updates: Partial<FileUploadStatus>,
  ) => {
    setFileStatuses((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const handleProcessFiles = async () => {
    if (fileStatuses.length === 0 || !job) return;

    setIsProcessing(true);
    let successCount = 0;

    try {
      for (let i = 0; i < fileStatuses.length; i++) {
        const fileStatus = fileStatuses[i];
        if (fileStatus.status === 'complete' || fileStatus.status === 'error') {
          continue;
        }

        updateFileStatus(i, { status: 'uploading', progress: 10 });

        try {
          updateFileStatus(i, { progress: 20 });

          // Create candidate profile first
          const candidateName = fileStatus.file.name
            .replace('.pdf', '')
            .replace(/[_-]/g, ' ');
          const candidate = await api.candidates.create({
            fullName: candidateName,
            email: `pending-${Date.now()}@processing.local`,
          });

          updateFileStatus(i, { progress: 40 });

          // Create application with candidate profile ID
          const application = await api.applications.create(job.id, {
            candidateProfileId: candidate.id,
          });

          updateFileStatus(i, { progress: 60 });

          // Upload CV
          await uploadCVMutation.mutateAsync({
            applicationId: application.id,
            file: fileStatus.file,
          });

          updateFileStatus(i, { progress: 80, status: 'processing' });

          setTimeout(() => {
            updateFileStatus(i, { progress: 100, status: 'complete' });
          }, 1500);

          successCount++;
        } catch (error) {
          console.error(`Failed to process CV: ${fileStatus.file.name}`, error);
          updateFileStatus(i, {
            status: 'error',
            error: 'Failed to upload. Please try again.',
          });
        }
      }

      // Refresh candidates list
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs.candidates(id),
      });

      setTimeout(() => {
        const allDone = fileStatuses.every(
          (f) => f.status === 'complete' || f.status === 'error',
        );
        if (allDone) {
          setIsUploadDialogOpen(false);
          setFileStatuses([]);
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to process CVs:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingFiles = fileStatuses.filter((f) => f.status === 'pending');
  const isLoading = jobLoading || candidatesLoading;

  // Handle delete job
  const handleDeleteJob = async () => {
    if (!job) return;
    setIsDeleting(true);
    try {
      await api.jobs.delete(job.id);
      router.push('/jobs');
    } catch (error) {
      console.error('Failed to delete job:', error);
      setIsDeleting(false);
    }
  };

  // Handle open edit dialog
  const handleOpenEditDialog = () => {
    if (!job) return;
    setEditForm({
      title: job.title,
      description: job.description,
      status: job.status || JobStatus.OPEN,
      requiredSkills: job.requiredSkills || [],
    });
    setNewSkill('');
    setIsEditDialogOpen(true);
  };

  // Handle update job
  const handleUpdateJob = async () => {
    if (!job) return;
    setIsUpdating(true);
    try {
      await api.jobs.update(job.id, {
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        requirements: {
          requiredSkills: editForm.requiredSkills,
        },
      } as any);
      await queryClient.refetchQueries({ queryKey: queryKeys.jobs.detail(id) });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update job:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle add skill
  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !editForm.requiredSkills.includes(trimmed)) {
      setEditForm((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, trimmed],
      }));
      setNewSkill('');
    }
  };

  // Handle remove skill
  const handleRemoveSkill = (skill: string) => {
    setEditForm((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skill),
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          <Header
            title={job?.title || 'Loading...'}
            description={`${job?.department || ''} • ${job?.status === JobStatus.OPEN ? 'Open' : 'Closed'}`}
          />

          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <span className="ml-3 text-zinc-400">
                  Loading job details...
                </span>
              </div>
            )}

            {!isLoading && job && (
              <>
                {/* Job Details Card */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl text-white mb-2">
                          Job Description
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={
                            job.status === JobStatus.OPEN
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-700 text-zinc-400'
                          }
                        >
                          {job.status === JobStatus.OPEN ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Upload Candidates Button & Dialog */}
                        <Dialog
                          open={isUploadDialogOpen}
                          onOpenChange={(open) => {
                            setIsUploadDialogOpen(open);
                            if (!open) {
                              setFileStatuses([]);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white gap-2">
                              <Upload className="w-4 h-4" />
                              Upload Candidates
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="text-xl flex items-center gap-2">
                                Upload Candidate Resumes
                              </DialogTitle>
                              <DialogDescription className="text-zinc-400">
                                Upload PDF resumes and our AI will automatically
                                analyze and score candidates.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                  isDragging
                                    ? 'border-violet-500 bg-violet-500/10'
                                    : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                                }`}
                              >
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-zinc-400" />
                                  </div>
                                  <div>
                                    <p className="text-white font-medium mb-1">
                                      Drag and drop PDF files here
                                    </p>
                                    <p className="text-sm text-zinc-500">
                                      or click to browse (max 2MB per file)
                                    </p>
                                  </div>
                                  <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".pdf"
                                    multiple
                                    className="hidden"
                                  />
                                  <Button
                                    variant="outline"
                                    className="mt-2 border-zinc-700 text-zinc-300"
                                    size="sm"
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                    disabled={isProcessing}
                                  >
                                    Browse Files
                                  </Button>
                                </div>
                              </div>

                              {fileStatuses.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-sm text-zinc-400 mb-2">
                                    Files ({fileStatuses.length}):
                                  </p>
                                  <div className="max-h-48 overflow-y-auto space-y-2">
                                    {fileStatuses.map((fileStatus, index) => (
                                      <div
                                        key={`${fileStatus.file.name}-${index}`}
                                        className="p-3 rounded-lg bg-zinc-800 space-y-2"
                                      >
                                        <div className="flex items-center gap-2">
                                          {fileStatus.status === 'pending' && (
                                            <FileText className="w-4 h-4 text-zinc-400" />
                                          )}
                                          {fileStatus.status ===
                                            'uploading' && (
                                            <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                                          )}
                                          {fileStatus.status ===
                                            'processing' && (
                                            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                                          )}
                                          {fileStatus.status === 'complete' && (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                          )}
                                          {fileStatus.status === 'error' && (
                                            <AlertCircle className="w-4 h-4 text-red-400" />
                                          )}

                                          <span className="text-sm text-zinc-300 flex-1 truncate">
                                            {fileStatus.file.name}
                                          </span>

                                          <span className="text-xs text-zinc-500">
                                            {(
                                              fileStatus.file.size / 1024
                                            ).toFixed(0)}{' '}
                                            KB
                                          </span>

                                          {/* Remove Button */}
                                          {fileStatus.status === 'pending' && (
                                            <button
                                              onClick={() => removeFile(index)}
                                              className="p-1 hover:bg-zinc-700 rounded"
                                            >
                                              <XCircle className="w-4 h-4 text-zinc-500 hover:text-red-400" />
                                            </button>
                                          )}
                                        </div>

                                        {/* Progress Bar */}
                                        {(fileStatus.status === 'uploading' ||
                                          fileStatus.status ===
                                            'processing') && (
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                              <span className="text-zinc-500">
                                                {fileStatus.status ===
                                                'uploading'
                                                  ? 'Uploading...'
                                                  : 'AI Processing...'}
                                              </span>
                                              <span className="text-violet-400 font-medium">
                                                {fileStatus.progress}%
                                              </span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                                              <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                  fileStatus.status ===
                                                  'processing'
                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                    : 'bg-gradient-to-r from-violet-500 to-indigo-600'
                                                }`}
                                                style={{
                                                  width: `${fileStatus.progress}%`,
                                                }}
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {fileStatus.status === 'complete' && (
                                          <p className="text-xs text-emerald-400">
                                            ✓ CV uploaded & queued for AI
                                            analysis
                                          </p>
                                        )}
                                        {fileStatus.status === 'error' && (
                                          <p className="text-xs text-red-400">
                                            {fileStatus.error}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setIsUploadDialogOpen(false);
                                  setFileStatuses([]);
                                }}
                                className="text-zinc-400 hover:text-white"
                                disabled={isProcessing}
                              >
                                Cancel
                              </Button>
                              <Button
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                                onClick={handleProcessFiles}
                                disabled={
                                  pendingFiles.length === 0 || isProcessing
                                }
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Process with AI ({pendingFiles.length})
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-zinc-900 border-zinc-700"
                          >
                            <DropdownMenuItem
                              className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer"
                              onClick={handleOpenEditDialog}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Job
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-700" />
                            <DropdownMenuItem
                              className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer"
                              onClick={() => setIsDeleteDialogOpen(true)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Delete Confirmation Dialog */}
                        <Dialog
                          open={isDeleteDialogOpen}
                          onOpenChange={setIsDeleteDialogOpen}
                        >
                          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-xl text-white">
                                Delete Job
                              </DialogTitle>
                              <DialogDescription className="text-zinc-400">
                                Are you sure you want to delete "{job.title}"?
                                This action cannot be undone and will remove all
                                associated applications.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2">
                              <Button
                                variant="ghost"
                                onClick={() => setIsDeleteDialogOpen(false)}
                                className="text-zinc-400 hover:text-white"
                                disabled={isDeleting}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteJob}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Job
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Edit Job Dialog */}
                        <Dialog
                          open={isEditDialogOpen}
                          onOpenChange={setIsEditDialogOpen}
                        >
                          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="text-xl text-white">
                                Edit Job
                              </DialogTitle>
                              <DialogDescription className="text-zinc-400">
                                Update the job details below.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="edit-title"
                                  className="text-zinc-300"
                                >
                                  Job Title
                                </Label>
                                <Input
                                  id="edit-title"
                                  value={editForm.title}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                  placeholder="e.g. Senior Frontend Developer"
                                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor="edit-description"
                                  className="text-zinc-300"
                                >
                                  Description
                                </Label>
                                <Textarea
                                  id="edit-description"
                                  value={editForm.description}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      description: e.target.value,
                                    }))
                                  }
                                  placeholder="Describe the job responsibilities..."
                                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[100px]"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-zinc-300">Status</Label>
                                <Select
                                  value={editForm.status}
                                  onValueChange={(value) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      status: value as JobStatus,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem
                                      value={JobStatus.OPEN}
                                      className="text-white focus:bg-zinc-700"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        Open
                                      </div>
                                    </SelectItem>
                                    <SelectItem
                                      value={JobStatus.CLOSED}
                                      className="text-white focus:bg-zinc-700"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-zinc-400" />
                                        Closed
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-zinc-300">
                                  Required Skills
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={newSkill}
                                    onChange={(e) =>
                                      setNewSkill(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSkill();
                                      }
                                    }}
                                    placeholder="Add a skill..."
                                    className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleAddSkill}
                                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                                {editForm.requiredSkills.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {editForm.requiredSkills.map((skill) => (
                                      <Badge
                                        key={skill}
                                        variant="secondary"
                                        className="bg-zinc-800 text-zinc-300 gap-1 pr-1"
                                      >
                                        {skill}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveSkill(skill)
                                          }
                                          className="ml-1 p-0.5 rounded hover:bg-zinc-700"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <DialogFooter className="gap-2">
                              <Button
                                variant="ghost"
                                onClick={() => setIsEditDialogOpen(false)}
                                className="text-zinc-400 hover:text-white"
                                disabled={isUpdating}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateJob}
                                disabled={
                                  isUpdating ||
                                  !editForm.title.trim() ||
                                  !editForm.description.trim()
                                }
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                              >
                                {isUpdating ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save Changes'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-400 mb-4">{job.description}</p>
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-zinc-500 mr-2">
                          Required Skills:
                        </span>
                        {job.requiredSkills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-zinc-800 text-zinc-300"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Candidates Section */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-4">
                    {processingCandidates.length > 0 && (
                      <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/30">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Sparkles className="w-5 h-5 text-violet-400" />
                            <div className="absolute inset-0 animate-ping">
                              <Sparkles className="w-5 h-5 text-violet-400 opacity-50" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              AI is analyzing {processingCandidates.length} CV
                              {processingCandidates.length > 1 ? 's' : ''}...
                            </p>
                            <p className="text-xs text-zinc-400">
                              Match scores will appear automatically when
                              analysis is complete
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <CardTitle className="text-lg text-white">
                        Candidates ({candidatesData?.data?.length || 0})
                      </CardTitle>
                      <div className="flex flex-wrap gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <Input
                            placeholder="Search candidates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-48 pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                          />
                        </div>
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem
                              value="all"
                              className="text-white focus:bg-zinc-700"
                            >
                              All Status
                            </SelectItem>
                            <SelectItem
                              value="APPLIED"
                              className="text-white focus:bg-zinc-700"
                            >
                              New
                            </SelectItem>
                            <SelectItem
                              value="HIRED"
                              className="text-white focus:bg-zinc-700"
                            >
                              Accepted
                            </SelectItem>
                            <SelectItem
                              value="REJECTED"
                              className="text-white focus:bg-zinc-700"
                            >
                              Rejected
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                          Sort by Score
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredCandidates.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500">
                        {candidatesData?.data?.length === 0
                          ? 'No candidates yet. Upload CVs to get started!'
                          : 'No candidates match your filters'}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-zinc-800 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                              <TableHead className="text-zinc-400">
                                Candidate
                              </TableHead>
                              <TableHead className="text-zinc-400">
                                Match Score
                              </TableHead>
                              <TableHead className="text-zinc-400">
                                Status
                              </TableHead>
                              <TableHead className="text-zinc-400">
                                Uploaded
                              </TableHead>
                              <TableHead className="text-zinc-400 text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCandidates.map((item) => (
                              <TableRow
                                key={item.candidate.id}
                                className="border-zinc-800 hover:bg-zinc-800/50"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                                      {getInitials(item.candidate.name)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-white">
                                        {item.candidate.name}
                                      </p>
                                      <p className="text-sm text-zinc-500">
                                        {item.candidate.email || 'No email'}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {item.matchScore === 0 ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                                      <span className="text-sm text-yellow-400">
                                        Analyzing...
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-2 rounded-full bg-zinc-800 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${getScoreColor(item.matchScore)}`}
                                          style={{
                                            width: `${item.matchScore}%`,
                                          }}
                                        />
                                      </div>
                                      <span
                                        className={`font-semibold ${getScoreTextColor(item.matchScore)}`}
                                      >
                                        {item.matchScore}%
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className={getStatusBadgeStyle(
                                      item.application.status,
                                    )}
                                  >
                                    {getStatusLabel(item.application.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-zinc-400">
                                  {format(
                                    new Date(item.application.createdAt),
                                    'MMM d, yyyy',
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Link
                                    href={`/candidates/${item.candidate.id}`}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-zinc-400 hover:text-white gap-1"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
