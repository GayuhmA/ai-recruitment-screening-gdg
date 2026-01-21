'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Users,
  Clock,
  UserCheck,
  Plus,
  ArrowUpRight,
  FileUser,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useJobs, useJobCandidates } from '@/hooks/useJobs';
import { useCandidates } from '@/hooks/useCandidates';
import { useApplications } from '@/hooks/useApplications';
import { useMemo } from 'react';

// Helper function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  // Fetch real data
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ limit: 100 });
  const { data: candidatesData, isLoading: candidatesLoading } = useCandidates({
    limit: 100,
  });
  const { data: applicationsData, isLoading: applicationsLoading } =
    useApplications({ limit: 100 });

  // Get first job's candidates for top matches (if available)
  const firstJobId = jobsData?.data?.[0]?.id;
  const { data: topMatchesData } = useJobCandidates(firstJobId);

  // Calculate metrics from real data
  const totalJobs = jobsData?.data.length || 0;
  const totalCandidates = candidatesData?.data.length || 0;

  // Count applications by status
  const pendingReviews =
    applicationsData?.data.filter(
      (app) => app.status === 'APPLIED' || app.status === 'IN_REVIEW',
    ).length || 0;

  const hiredThisMonth =
    applicationsData?.data.filter((app) => {
      if (app.status !== 'HIRED') return false;
      const appDate = new Date(app.createdAt);
      const now = new Date();
      return (
        appDate.getMonth() === now.getMonth() &&
        appDate.getFullYear() === now.getFullYear()
      );
    }).length || 0;

  // Get top candidates with scores
  const topCandidates = useMemo(() => {
    if (!topMatchesData?.data) return [];
    return topMatchesData.data
      .filter((match) => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }, [topMatchesData]);

  const isLoading = jobsLoading || candidatesLoading || applicationsLoading;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <Header
            title="Dashboard"
            description="Welcome back! Here's what's happening today."
          />

          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <span className="ml-3 text-zinc-400">Loading dashboard...</span>
              </div>
            )}

            {!isLoading && (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Open Jobs */}
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-200 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-zinc-400">
                            Open Jobs
                          </p>
                          <p className="text-3xl font-bold text-white">
                            {totalJobs}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Active positions
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Candidates */}
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-200 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-zinc-400">
                            Total Candidates
                          </p>
                          <p className="text-3xl font-bold text-white">
                            {totalCandidates}
                          </p>
                          <p className="text-xs text-zinc-500">In database</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pending Reviews */}
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-200 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-zinc-400">
                            Pending Reviews
                          </p>
                          <p className="text-3xl font-bold text-white">
                            {pendingReviews}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {pendingReviews > 0
                              ? 'Needs attention'
                              : 'All clear'}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Accepted This Month */}
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-200 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-zinc-400">
                            Accepted This Month
                          </p>
                          <p className="text-3xl font-bold text-white">
                            {hiredThisMonth}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {hiredThisMonth > 0
                              ? 'Great progress!'
                              : 'Keep going!'}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 opacity-80 group-hover:opacity-100 transition-opacity">
                          <UserCheck className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Activity */}
                  <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <CardTitle className="text-lg font-semibold text-white">
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {applicationsData?.data.slice(0, 5).map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400">
                            <FileUser className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-300 truncate">
                              {app.candidate?.name || 'New candidate'} applied
                              for {app.job?.title || 'position'}
                            </p>
                          </div>
                          <span className="text-xs text-zinc-500 shrink-0">
                            {formatRelativeTime(app.createdAt)}
                          </span>
                        </div>
                      ))}

                      {(!applicationsData ||
                        applicationsData.data.length === 0) && (
                        <div className="flex items-center gap-4 p-3 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-500">
                              No recent activity yet
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions & Top Candidates */}
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card className="bg-zinc-900 border-zinc-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-white">
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Link href="/jobs?create=true">
                          <Button className="w-full justify-start gap-2 bg-gradient-to-r mb-3 from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white">
                            <Plus className="w-4 h-4" />
                            Create New Job
                          </Button>
                        </Link>
                        <Link href="/candidates">
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          >
                            <Users className="w-4 h-4" />
                            View All Candidates
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    {/* Top Candidates */}
                    <Card className="bg-zinc-900 border-zinc-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-white">
                          Top Matches
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {topCandidates.length > 0 ? (
                          topCandidates.map((match) => (
                            <Link
                              key={match.candidate.id}
                              href={`/candidates/${match.candidate.id}`}
                              className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
                            >
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-medium text-sm">
                                {getInitials(match.candidate.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate group-hover:text-violet-400 transition-colors">
                                  {match.candidate.name}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">
                                  {match.candidate.email || 'No email'}
                                </p>
                              </div>
                              <Badge
                                variant="secondary"
                                className={
                                  match.matchScore >= 80
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : match.matchScore >= 60
                                      ? 'bg-violet-500/20 text-violet-400'
                                      : 'bg-amber-500/20 text-amber-400'
                                }
                              >
                                {match.matchScore}%
                              </Badge>
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-zinc-500 text-center py-4">
                            No matches yet. Upload CVs to see AI-powered
                            rankings.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Open Jobs Preview */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg font-semibold text-white">
                      Open Positions
                    </CardTitle>
                    <Link href="/jobs">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-white gap-1"
                      >
                        View All <ArrowUpRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {jobsData && jobsData.data.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...jobsData.data]
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime(),
                          )
                          .slice(0, 6)
                          .map((job) => (
                            <Link
                              key={job.id}
                              href={`/jobs/${job.id}`}
                              className="p-4 rounded-lg border border-zinc-800 hover:border-violet-500/50 bg-zinc-800/30 hover:bg-zinc-800/50 transition-all group"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <Badge
                                  variant="secondary"
                                  className="bg-zinc-700 text-zinc-300"
                                >
                                  {job.department
                                    ? job.department.charAt(0).toUpperCase() +
                                      job.department.slice(1)
                                    : 'General'}
                                </Badge>
                                <span className="text-xs text-zinc-500">
                                  {job._count?.applications || 0} applicants
                                </span>
                              </div>
                              <h3 className="font-medium text-white group-hover:text-violet-400 transition-colors mb-2">
                                {job.title}
                              </h3>
                              {job.requiredSkills &&
                                job.requiredSkills.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {job.requiredSkills
                                      .slice(0, 3)
                                      .map((skill, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    {job.requiredSkills.length > 3 && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                                        +{job.requiredSkills.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                            </Link>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-zinc-500">
                        No open positions yet.{' '}
                        <Link
                          href="/jobs?create=true"
                          className="text-violet-400 hover:text-violet-300"
                        >
                          Create your first job
                        </Link>
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
