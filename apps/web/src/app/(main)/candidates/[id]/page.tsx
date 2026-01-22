'use client';

import { use } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  User,
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MatchScoreRing } from '@/components/features/match-score-ring';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { useCandidate } from '@/hooks/useCandidates';
import { ApplicationStatus } from '@/types/api';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type CandidateStatus = 'New' | 'Accepted' | 'Rejected';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusColor(status: CandidateStatus): string {
  switch (status) {
    case 'New':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Accepted':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Rejected':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
}

function mapApplicationStatusToUI(
  appStatus: ApplicationStatus | undefined,
): CandidateStatus {
  switch (appStatus) {
    case ApplicationStatus.HIRED:
    case ApplicationStatus.OFFERED:
      return 'Accepted';
    case ApplicationStatus.REJECTED:
      return 'Rejected';
    default:
      return 'New';
  }
}

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: candidate, isLoading, error, refetch } = useCandidate(id);

  const primaryApplication = candidate?.applications?.[0];

  const [status, setStatus] = useState<CandidateStatus>('New');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (primaryApplication) {
      setStatus(mapApplicationStatusToUI(primaryApplication.status));
    }
  }, [primaryApplication]);

  const mapUIStatusToAPI = (uiStatus: CandidateStatus): ApplicationStatus => {
    switch (uiStatus) {
      case 'Accepted':
        return ApplicationStatus.HIRED;
      case 'Rejected':
        return ApplicationStatus.REJECTED;
      default:
        return ApplicationStatus.APPLIED;
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: CandidateStatus) => {
    if (!primaryApplication) {
      toast.error('No application found for this candidate');
      return;
    }

    setIsUpdating(true);
    try {
      const apiStatus = mapUIStatusToAPI(newStatus);
      await api.applications.update(primaryApplication.id, {
        status: apiStatus,
      });
      setStatus(newStatus);
      await refetch();
      toast.success(
        `Candidate ${newStatus === 'Accepted' ? 'accepted' : newStatus === 'Rejected' ? 'rejected' : 'status updated'}`,
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update candidate status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header
          title="Loading..."
          description="Fetching candidate details"
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <span className="ml-3 text-zinc-400">Loading candidate...</span>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex flex-col h-full">
        <Header
          title="Candidate Not Found"
          description="The requested candidate does not exist"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Candidate Not Found
            </h2>
            <p className="text-zinc-400 mb-4">
              The candidate with ID "{id}" does not exist.
            </p>
            <Link href="/candidates">
              <Button>Back to Candidates</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const matchScore = primaryApplication?.matchScore || 0;
  const matchedSkills =
    primaryApplication?.matchedSkills || candidate.skills || [];
  const missingSkills = primaryApplication?.missingSkills || [];
  const jobTitle = primaryApplication?.job?.title || 'Position';

  return (
    <div className="flex flex-col h-full">
      <Header
        title={candidate.name}
        description={`Candidate for ${jobTitle}`}
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left Side - PDF Viewer */}
          <div className="w-[60%] border-r border-zinc-800 flex flex-col">
            {/* PDF Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white gap-1"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Separator
                  orientation="vertical"
                  className="h-6 bg-zinc-800"
                />
                <div className="flex items-center gap-2 text-zinc-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Resume.pdf</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            {/* PDF Viewer Placeholder */}
            <div className="flex-1 flex items-center justify-center bg-zinc-950/50 p-8">
              <div className="w-full max-w-2xl aspect-[8.5/11] bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center p-8">
                <FileText className="w-16 h-16 text-zinc-300 mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 mb-2">
                  Resume Preview
                </h3>
                <p className="text-sm text-zinc-500 text-center max-w-xs">
                  PDF viewer integration would display the candidate's
                  resume here
                </p>
                <div className="mt-6 w-full max-w-sm space-y-3">
                  <div className="h-4 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-4 bg-zinc-200 rounded animate-pulse w-4/5" />
                  <div className="h-4 bg-zinc-200 rounded animate-pulse w-3/4" />
                  <div className="h-8" />
                  <div className="h-3 bg-zinc-100 rounded animate-pulse" />
                  <div className="h-3 bg-zinc-100 rounded animate-pulse w-5/6" />
                  <div className="h-3 bg-zinc-100 rounded animate-pulse w-4/5" />
                  <div className="h-3 bg-zinc-100 rounded animate-pulse w-full" />
                  <div className="h-3 bg-zinc-100 rounded animate-pulse w-3/4" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Candidate Info */}
          <div className="w-[40%] bg-zinc-900/30">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Candidate Info */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
                        {candidate.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-white">
                          {candidate.name}
                        </h2>
                        <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{candidate.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Uploaded {formatDate(candidate.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-sm text-zinc-400">Status:</span>
                      <Select
                        value={status}
                        onValueChange={(value) =>
                          handleStatusChange(value as CandidateStatus)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger
                          className={`w-32 h-8 text-xs border ${getStatusColor(
                            status,
                          )} bg-transparent`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem
                            value="New"
                            className="text-white focus:bg-zinc-700"
                          >
                            New
                          </SelectItem>
                          <SelectItem
                            value="Accepted"
                            className="text-white focus:bg-zinc-700"
                          >
                            Accepted
                          </SelectItem>
                          <SelectItem
                            value="Rejected"
                            className="text-white focus:bg-zinc-700"
                          >
                            Rejected
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Match Score */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      AI Match Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center pb-6">
                    <MatchScoreRing score={matchScore} />
                  </CardContent>
                </Card>

                {/* AI Summary */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      Candidate Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {candidate.experience ||
                        `${candidate.name} is a candidate with skills in ${matchedSkills.slice(0, 3).join(', ')}${matchedSkills.length > 3 ? ` and ${matchedSkills.length - 3} more` : ''}.`}
                    </p>
                  </CardContent>
                </Card>

                {/* Skills Analysis */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">
                      Skills Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Skills Found */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-zinc-300">
                          Skills Found
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {matchedSkills.length > 0 ? (
                          matchedSkills.map((skill, idx) => (
                            <Badge
                              key={`${skill}-${idx}`}
                              variant="secondary"
                              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            >
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-zinc-500">
                            No skills data available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    {missingSkills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-medium text-zinc-300">
                            Missing Skills
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {missingSkills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="bg-red-500/10 text-red-400 border border-red-500/20"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Reasoning */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      AI Reasoning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                      <p className="text-sm text-zinc-300 leading-relaxed italic">
                        &quot;Based on the candidate's profile, they have a{' '}
                        {matchScore}% match score for this position.
                        {matchedSkills.length > 0 &&
                          ` Key strengths include ${matchedSkills.slice(0, 3).join(', ')}.`}
                        {missingSkills.length > 0 &&
                          ` Areas for development include ${missingSkills.slice(0, 2).join(' and ')}.`}
                        &quot;
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                    onClick={() => handleStatusChange('Accepted')}
                    disabled={isUpdating || status === 'Accepted'}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Accept'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => handleStatusChange('Rejected')}
                    disabled={isUpdating || status === 'Rejected'}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Reject'
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
