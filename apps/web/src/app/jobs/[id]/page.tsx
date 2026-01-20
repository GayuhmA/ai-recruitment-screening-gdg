'use client';

import { use } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Search,
  ArrowUpDown,
  Eye,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { useJob, useJobCandidates } from '@/hooks/useJobs';
import { JobStatus } from '@/types/api';
import { format } from 'date-fns';

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch job details and candidates from API
  const { data: job, isLoading: jobLoading } = useJob(id);
  const { data: candidatesData, isLoading: candidatesLoading } =
    useJobCandidates(id);

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
      setUploadedFiles((prev) => [...prev, ...files]);
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
      (f) => f.type === 'application/pdf',
    );
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleProcessFiles = async () => {
    setIsUploadDialogOpen(false);
    setUploadedFiles([]);
  };

  const isLoading = jobLoading || candidatesLoading;

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
                      {/* Upload Candidates Button & Dialog */}
                      <Dialog
                        open={isUploadDialogOpen}
                        onOpenChange={setIsUploadDialogOpen}
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
                            {uploadedFiles.length > 0 && (
                              <div className="mt-4 space-y-2">
                                <p className="text-sm text-zinc-400 mb-2">
                                  Uploaded files:
                                </p>
                                {uploadedFiles.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-zinc-300">
                                      {file.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setIsUploadDialogOpen(false);
                                setUploadedFiles([]);
                              }}
                              className="text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                              onClick={handleProcessFiles}
                              disabled={uploadedFiles.length === 0}
                            >
                              Process with AI
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 rounded-full bg-zinc-800 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${getScoreColor(item.matchScore)}`}
                                        style={{ width: `${item.matchScore}%` }}
                                      />
                                    </div>
                                    <span
                                      className={`font-semibold ${getScoreTextColor(item.matchScore)}`}
                                    >
                                      {item.matchScore}%
                                    </span>
                                  </div>
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
