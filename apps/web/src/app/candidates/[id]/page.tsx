"use client";

import { use } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MatchScoreRing } from "@/components/ui/match-score-ring";
import {
  Mail,
  Phone,
  Calendar,
  FileText,
  Briefcase,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useCandidate } from "@/hooks/useCandidates";
import { format } from "date-fns";

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: candidateData, isLoading, error } = useCandidate(id);

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <span className="ml-3 text-zinc-400">Loading candidate details...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !candidateData) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-zinc-400">Failed to load candidate details</p>
              <Link href="/candidates">
                <Button variant="ghost" className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Candidates
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const candidate = candidateData;
  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Get latest application for this candidate
  const latestApp = candidate.applications?.[0];
  const matchScore = latestApp?.matchScore ?? 0;
  const matchedSkills = latestApp?.matchedSkills ?? [];
  const missingSkills = latestApp?.missingSkills ?? [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title={candidate.name} 
          description="Candidate Profile" 
        />
        
        <div className="p-6 space-y-6">
          {/* Back Button */}
          <Link href="/candidates">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Candidates
            </Button>
          </Link>

          {/* Profile Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-white mb-2">
                        {candidate.name}
                      </CardTitle>
                      <div className="space-y-2">
                        {candidate.email && (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{candidate.email}</span>
                          </div>
                        )}
                        {candidate.phone && (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{candidate.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            Applied on {format(new Date(candidate.createdAt), "MMMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Skills Section */}
              {(matchedSkills.length > 0 || missingSkills.length > 0) && (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Skills Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {matchedSkills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <h3 className="text-sm font-medium text-zinc-300">
                            Matched Skills ({matchedSkills.length})
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {matchedSkills.map((skill: string) => (
                            <Badge
                              key={skill}
                              className="bg-green-500/20 text-green-400 border-green-500/30"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {matchedSkills.length > 0 && missingSkills.length > 0 && (
                      <Separator className="bg-zinc-800" />
                    )}

                    {missingSkills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="w-5 h-5 text-red-500" />
                          <h3 className="text-sm font-medium text-zinc-300">
                            Missing Skills ({missingSkills.length})
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {missingSkills.map((skill: string) => (
                            <Badge
                              key={skill}
                              className="bg-red-500/20 text-red-400 border-red-500/30"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Applications History */}
              {candidate.applications && candidate.applications.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      Application History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {candidate.applications.map((app: any) => (
                        <Link
                          key={app.id}
                          href={`/jobs/${app.jobId}`}
                          className="block p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-violet-500/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Briefcase className="w-5 h-5 text-violet-400 mt-1" />
                              <div>
                                <h4 className="font-medium text-white">
                                  {app.job?.title || "Position"}
                                </h4>
                                {app.job?.department && (
                                  <p className="text-xs text-zinc-500 capitalize">
                                    {app.job.department}
                                  </p>
                                )}
                                <p className="text-sm text-zinc-400 mt-1">
                                  Applied {format(new Date(app.createdAt), "MMM d, yyyy")}
                                </p>
                                {app.matchScore > 0 && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-zinc-500">Match:</span>
                                    <span className={`text-xs font-semibold ${
                                      app.matchScore >= 80
                                        ? 'text-emerald-400'
                                        : app.matchScore >= 60
                                        ? 'text-violet-400'
                                        : app.matchScore >= 40
                                        ? 'text-yellow-400'
                                        : 'text-red-400'
                                    }`}>
                                      {app.matchScore}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-blue-500/20 text-blue-400"
                            >
                              {app.status}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Match Score */}
            <div className="space-y-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white text-center">
                    Match Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-6">
                  {matchScore > 0 ? (
                    <>
                      <MatchScoreRing score={matchScore} size="lg" />
                      <p className="text-sm text-zinc-400 mt-4 text-center">
                        {matchScore >= 80
                          ? "Excellent match for the position"
                          : matchScore >= 60
                          ? "Good match with some gaps"
                          : matchScore >= 40
                          ? "Moderate match, needs evaluation"
                          : "Limited match to requirements"}
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-12 h-12 animate-spin text-yellow-400" />
                      <p className="text-sm text-yellow-400 text-center">
                        AI is analyzing CV...
                      </p>
                      <p className="text-xs text-zinc-500 text-center">
                        Score will appear when analysis is complete
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full bg-violet-600 hover:bg-violet-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                    <FileText className="w-4 h-4 mr-2" />
                    Download CV
                  </Button>
                  <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
