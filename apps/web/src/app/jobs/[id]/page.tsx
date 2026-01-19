"use client";

import React, { use } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  ArrowUpDown,
  Eye,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useJob, useJobCandidates } from "@/hooks/useJobs";
import { useUploadCV, useMonitorCVProcessing } from "@/hooks/useCVs";
import { useUpdateApplication } from "@/hooks/useApplications";
import { ApplicationStatus, JobStatus } from "@/types/api";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { api } from "@/lib/api";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, boolean>>(new Map());
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [uploadErrors, setUploadErrors] = useState<Map<string, string>>(new Map());
  const [processingCVs, setProcessingCVs] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Constants
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

  // Fetch job details
  const { data: jobData, isLoading: isLoadingJob, error: jobError } = useJob(id);

  // Fetch candidates for this job
  const { data: candidatesData, isLoading: isLoadingCandidates, error: candidatesError } = useJobCandidates(id);

  // Mutations
  const uploadCVMutation = useUploadCV();
  const updateApplicationMutation = useUpdateApplication();

  // Toggle expanded row
  const toggleExpandedRow = (applicationId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }
      return next;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles: File[] = [];
      const errors = new Map(uploadErrors);

      files.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          errors.set(file.name, `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 2MB.`);
        } else if (file.type !== 'application/pdf') {
          errors.set(file.name, 'Only PDF files are allowed.');
        } else {
          validFiles.push(file);
          errors.delete(file.name);
        }
      });

      setUploadErrors(errors);
      setSelectedFiles((prev) => [...prev, ...validFiles]);
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
    const files = Array.from(e.dataTransfer.files);
    const validFiles: File[] = [];
    const errors = new Map(uploadErrors);

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        errors.set(file.name, `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 2MB.`);
      } else if (file.type !== 'application/pdf') {
        errors.set(file.name, 'Only PDF files are allowed.');
      } else {
        validFiles.push(file);
        errors.delete(file.name);
      }
    });

    setUploadErrors(errors);
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleProcessCVs = async () => {
    if (selectedFiles.length === 0 || !jobData) return;

    try {
      // Process each CV file
      for (const file of selectedFiles) {
        setUploadingFiles(prev => new Map(prev).set(file.name, true));
        setUploadProgress(prev => new Map(prev).set(file.name, 0));
        
        try {
          // Create candidate profile first
          const candidateName = file.name.replace('.pdf', '').replace(/[_-]/g, ' ');
          const candidate = await api.candidates.create({
            fullName: candidateName,
            email: `pending-${Date.now()}@processing.local`,
          });

          // Create application with candidate profile ID
          const application = await api.applications.create(jobData.id, {
            candidateProfileId: candidate.id,
          });

          // Upload CV with progress tracking
          const cvDoc = await uploadCVMutation.mutateAsync({
            applicationId: application.id,
            file: file,
            onProgress: (progress) => {
              setUploadProgress(prev => new Map(prev).set(file.name, progress));
            },
          });

          // Add to processing queue for real-time monitoring
          setProcessingCVs(prev => new Set(prev).add(cvDoc.id));
          
          setUploadingFiles(prev => new Map(prev).set(file.name, false));
          
          // Immediately refresh to show new candidate in table
          queryClient.invalidateQueries({ queryKey: queryKeys.jobs.candidates(id) });
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to upload CV. Please try again.';
          setUploadErrors(prev => new Map(prev).set(file.name, errorMessage));
          setUploadingFiles(prev => new Map(prev).set(file.name, false));
        }
      }

      // Close dialog and reset
      setIsUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadingFiles(new Map());
      setUploadProgress(new Map());

    } catch (error: any) {
      // Silent catch - individual errors are already handled above
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      await updateApplicationMutation.mutateAsync({
        applicationId,
        data: { status: newStatus },
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    if (!candidatesData?.data) return [];

    return candidatesData.data.filter((candidate) => {
      const matchesSearch =
        searchQuery === '' ||
        candidate.candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.candidate.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || candidate.application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [candidatesData, searchQuery, statusFilter]);

  const isLoading = isLoadingJob || isLoadingCandidates;
  const hasError = jobError || candidatesError;

  // Auto-refresh candidates list while CVs are processing
  useEffect(() => {
    if (processingCVs.size > 0) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.candidates(id) });
      }, 3000); // Refresh every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [processingCVs.size, id, queryClient]);

  // Component for displaying CV processing status
  const CVProcessingStatus = ({ cvId }: { cvId: string }) => {
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
      return (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Processing failed</span>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>AI is analyzing CV...</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <span className="ml-3 text-zinc-400">Loading job details...</span>
            </div>
          ) : hasError ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
              <span className="text-zinc-400">Failed to load job details</span>
            </div>
          ) : (
            <>
              <Header 
                title={jobData?.title || "Job Details"} 
                description={`${jobData?.department || ''} • ${jobData?.status || ''}`} 
              />

          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Job Details Card */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-white mb-2">
                      Job Description
                    </CardTitle>
                    <div className="flex items-center gap-3 mb-3">
                      <Badge
                        variant="secondary"
                        className={jobData?.status === JobStatus.OPEN 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-zinc-700 text-zinc-400"}
                      >
                        {jobData?.status}
                      </Badge>
                      <span className="text-sm text-zinc-500 capitalize">
                        {jobData?.department}
                      </span>
                    </div>
                    
                    {/* Statistics */}
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm text-zinc-400">
                          <span className="font-semibold text-white">{jobData?._count?.applications || 0}</span> applicants
                        </span>
                      </div>
                      {jobData?._count?.hired !== undefined && jobData._count.hired > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm text-emerald-400 font-semibold">
                            {jobData._count.hired} hired
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm text-zinc-400">
                          Posted {format(new Date(jobData?.createdAt || new Date()), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Upload Candidates Button & Dialog */}
                  <Dialog
                    open={isUploadDialogOpen}
                    onOpenChange={setIsUploadDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white gap-2">
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
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/50"
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
                                or click to browse from your computer
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
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Browse Files
                            </Button>
                          </div>
                        </div>

                        {/* Display file validation errors */}
                        {uploadErrors.size > 0 && (
                          <div className="mt-4 space-y-2">
                            {Array.from(uploadErrors.entries()).map(([fileName, error]) => (
                              <div key={fileName} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-400">{fileName}</p>
                                  <p className="text-xs text-red-300 mt-0.5">{error}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-auto text-red-400 hover:text-red-300"
                                  onClick={() => {
                                    const errors = new Map(uploadErrors);
                                    errors.delete(fileName);
                                    setUploadErrors(errors);
                                  }}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-zinc-400">
                                Selected files ({selectedFiles.length}):
                              </p>
                              <p className="text-xs text-zinc-500">
                                Max size: 2MB per file
                              </p>
                            </div>
                            {selectedFiles.map((file, index) => {
                              const isUploading = uploadingFiles.get(file.name);
                              const progress = uploadProgress.get(file.name) || 0;
                              const hasError = uploadErrors.has(file.name);
                              const fileSizeMB = file.size / 1024 / 1024;
                              
                              return (
                                <div
                                  key={`${file.name}-${index}-${file.size}`}
                                  className={`space-y-1 p-2 rounded-lg ${
                                    hasError ? 'bg-red-500/10 border border-red-500/30' : 'bg-zinc-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {hasError ? (
                                      <AlertCircle className="w-4 h-4 text-red-400" />
                                    ) : isUploading ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    )}
                                    <span className={`text-sm flex-1 ${
                                      hasError ? 'text-red-300' : 'text-zinc-300'
                                    }`}>
                                      {file.name}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                      {fileSizeMB < 1 ? `${(file.size / 1024).toFixed(1)} KB` : `${fileSizeMB.toFixed(2)} MB`}
                                    </span>
                                  </div>
                                  {hasError && (
                                    <div className="ml-6">
                                      <p className="text-xs text-red-400">{uploadErrors.get(file.name)}</p>
                                    </div>
                                  )}
                                  {isUploading && (
                                    <div className="ml-6 space-y-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-500">Uploading...</span>
                                        <span className="text-violet-400 font-medium">{progress}%</span>
                                      </div>
                                      <div className="w-full h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                                        <div
                                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-300"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsUploadDialogOpen(false);
                            setSelectedFiles([]);
                            setUploadingFiles(new Map());
                            setUploadErrors(new Map());
                          }}
                          className="text-zinc-400 hover:text-white"
                          disabled={uploadCVMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                          onClick={handleProcessCVs}
                          disabled={selectedFiles.length === 0 || uploadCVMutation.isPending}
                        >
                          {uploadCVMutation.isPending && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          Process with AI ({selectedFiles.length})
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 mb-4">
                  {jobData?.description || 'No description available'}
                </p>
                {jobData?.requiredSkills && jobData.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-zinc-500 mr-2">
                      Required Skills:
                    </span>
                    {jobData.requiredSkills.map((skill) => (
                      <Badge
                        key={skill}
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
                {/* Processing Banner */}
                {processingCVs.size > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">
                        Processing {processingCVs.size} CV{processingCVs.size > 1 ? 's' : ''} with AI...
                      </span>
                    </div>
                    <p className="text-xs text-yellow-400/70 mt-1 ml-6">
                      Results will appear automatically when analysis is complete
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <CardTitle className="text-lg text-white">
                    Candidates ({filteredCandidates.length})
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
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ApplicationStatus | "all")}>
                      <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all" className="text-white focus:bg-zinc-700">
                          All Status
                        </SelectItem>
                        <SelectItem value={ApplicationStatus.APPLIED} className="text-white focus:bg-zinc-700">
                          Applied
                        </SelectItem>
                        <SelectItem value={ApplicationStatus.IN_REVIEW} className="text-white focus:bg-zinc-700">
                          In Review
                        </SelectItem>
                        <SelectItem value={ApplicationStatus.SHORTLISTED} className="text-white focus:bg-zinc-700">
                          Shortlisted
                        </SelectItem>
                        <SelectItem value={ApplicationStatus.INTERVIEW} className="text-white focus:bg-zinc-700">
                          Interview
                        </SelectItem>
                        <SelectItem value={ApplicationStatus.OFFERED} className="text-white focus:bg-zinc-700">
                          Offered
                        </SelectItem>
                        <SelectItem value={ApplicationStatus.HIRED} className="text-white focus:bg-zinc-700">
                          Hired
                        </SelectItem>
                        <SelectItem value={ApplicationStatus.REJECTED} className="text-white focus:bg-zinc-700">
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
                {/* Processing CVs Section */}
                {processingCVs.size > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium text-zinc-400">Currently Processing:</p>
                    {Array.from(processingCVs).map((cvId, index) => (
                      <div key={`processing-cv-${cvId}-${index}`} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                        <CVProcessingStatus cvId={cvId} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-zinc-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400">Candidate</TableHead>
                        <TableHead className="text-zinc-400">Match Score</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400">Applied</TableHead>
                        <TableHead className="text-zinc-400 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCandidates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p className="text-zinc-400">
                              {searchQuery || statusFilter !== 'all' 
                                ? 'No candidates match your filters' 
                                : 'No candidates yet. Upload CVs to get started!'}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCandidates.map((item) => {
                          const { candidate, application, matchScore, matchedSkills, missingSkills, aiExplanation } = item;
                          const isExpanded = expandedRows.has(application.id);
                          const hasAIData = aiExplanation || (matchedSkills && matchedSkills.length > 0);
                          const initials = candidate.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);

                          const getStatusColor = (status: ApplicationStatus) => {
                            switch (status) {
                              case ApplicationStatus.APPLIED:
                                return 'bg-blue-500/20 text-blue-400';
                              case ApplicationStatus.IN_REVIEW:
                                return 'bg-yellow-500/20 text-yellow-400';
                              case ApplicationStatus.SHORTLISTED:
                                return 'bg-purple-500/20 text-purple-400';
                              case ApplicationStatus.INTERVIEW:
                                return 'bg-indigo-500/20 text-indigo-400';
                              case ApplicationStatus.OFFERED:
                                return 'bg-cyan-500/20 text-cyan-400';
                              case ApplicationStatus.HIRED:
                                return 'bg-emerald-500/20 text-emerald-400';
                              case ApplicationStatus.REJECTED:
                                return 'bg-red-500/20 text-red-400';
                              default:
                                return 'bg-zinc-700 text-zinc-400';
                            }
                          };

                          return (
                            <React.Fragment key={application.id}>
                              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {hasAIData && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-1 h-auto text-zinc-400 hover:text-white"
                                        onClick={() => toggleExpandedRow(application.id)}
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="w-4 h-4" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4" />
                                        )}
                                      </Button>
                                    )}
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                                      {initials}
                                    </div>
                                    <div>
                                      <p className="font-medium text-white">{candidate.name}</p>
                                      <p className="text-sm text-zinc-500">
                                        {candidate.email}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                              <TableCell>
                                {matchScore === 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                                    <span className="text-sm text-yellow-400">Processing...</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all ${
                                            matchScore >= 80
                                              ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                                              : matchScore >= 60
                                              ? 'bg-gradient-to-r from-violet-500 to-indigo-600'
                                              : matchScore >= 40
                                              ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                                              : 'bg-gradient-to-r from-red-500 to-rose-600'
                                          }`}
                                          style={{ width: `${matchScore}%` }}
                                        />
                                      </div>
                                      <span className={`font-semibold text-sm ${
                                        matchScore >= 80
                                          ? 'text-emerald-400'
                                          : matchScore >= 60
                                          ? 'text-violet-400'
                                          : matchScore >= 40
                                          ? 'text-yellow-400'
                                          : 'text-red-400'
                                      }`}>
                                        {matchScore}%
                                      </span>
                                    </div>
                                    {matchScore >= 70 && (
                                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Strong match
                                      </span>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={application.status}
                                  onValueChange={(value) =>
                                    handleStatusChange(application.id, value as ApplicationStatus)
                                  }
                                  disabled={updateApplicationMutation.isPending}
                                >
                                  <SelectTrigger className={`w-32 border-0 ${getStatusColor(application.status)}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value={ApplicationStatus.APPLIED} className="text-white focus:bg-zinc-700">
                                      Applied
                                    </SelectItem>
                                    <SelectItem value={ApplicationStatus.IN_REVIEW} className="text-white focus:bg-zinc-700">
                                      In Review
                                    </SelectItem>
                                    <SelectItem value={ApplicationStatus.SHORTLISTED} className="text-white focus:bg-zinc-700">
                                      Shortlisted
                                    </SelectItem>
                                    <SelectItem value={ApplicationStatus.INTERVIEW} className="text-white focus:bg-zinc-700">
                                      Interview
                                    </SelectItem>
                                    <SelectItem value={ApplicationStatus.OFFERED} className="text-white focus:bg-zinc-700">
                                      Offered
                                    </SelectItem>
                                    <SelectItem value={ApplicationStatus.HIRED} className="text-white focus:bg-zinc-700">
                                      Hired
                                    </SelectItem>
                                    <SelectItem value={ApplicationStatus.REJECTED} className="text-white focus:bg-zinc-700">
                                      Rejected
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-zinc-400">
                                {format(new Date(application.createdAt), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link href={`/candidates/${candidate.id}`}>
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

                            {/* Expanded Row: AI Analysis Details */}
                            {isExpanded && hasAIData && (
                              <TableRow key={`${application.id}-expanded`} className="border-zinc-800 bg-zinc-900/50">
                                <TableCell colSpan={5} className="p-6">
                                  <div className="space-y-4">
                                    {/* AI Explanation */}
                                    {aiExplanation && (
                                      <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                          <Sparkles className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <h4 className="text-sm font-semibold text-white mb-2">AI Analysis</h4>
                                            <p className="text-sm text-zinc-300 leading-relaxed">
                                              {aiExplanation}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Skills Breakdown */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Matched Skills */}
                                      {matchedSkills && matchedSkills.length > 0 && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                                          <div className="flex items-center gap-2 mb-3">
                                            <Target className="w-4 h-4 text-emerald-400" />
                                            <h4 className="text-sm font-semibold text-emerald-400">
                                              Matched Skills ({matchedSkills.length})
                                            </h4>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {matchedSkills.map((skill: string, idx: number) => (
                                              <Badge
                                                key={`${skill}-${idx}`}
                                                className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                              >
                                                {skill}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Missing Skills */}
                                      {missingSkills && missingSkills.length > 0 && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                          <div className="flex items-center gap-2 mb-3">
                                            <XCircle className="w-4 h-4 text-red-400" />
                                            <h4 className="text-sm font-semibold text-red-400">
                                              Missing Skills ({missingSkills.length})
                                            </h4>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {missingSkills.map((skill: string, idx: number) => (
                                              <Badge
                                                key={`${skill}-${idx}`}
                                                className="bg-red-500/20 text-red-300 border-red-500/30"
                                              >
                                                {skill}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
