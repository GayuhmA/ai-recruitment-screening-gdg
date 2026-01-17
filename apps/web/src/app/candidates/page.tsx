"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, ArrowUpDown, Eye, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useCandidates } from "@/hooks/useCandidates";
import { ApplicationStatus } from "@/types/api";

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"score" | "date">("score");

  // Fetch candidates
  const { data: candidatesData, isLoading, error } = useCandidates();

  // Filter and sort candidates with optimized search
  const filteredCandidates = useMemo(() => {
    if (!candidatesData?.data) return [];

    const query = searchQuery.trim().toLowerCase();

    let filtered = candidatesData.data.filter((candidate) => {
      // Search filter - check name, email, phone, and skills
      const matchesSearch =
        query === "" ||
        candidate.name?.toLowerCase().includes(query) ||
        candidate.email?.toLowerCase().includes(query) ||
        candidate.phone?.toLowerCase().includes(query) ||
        candidate.skills?.some(skill => skill.toLowerCase().includes(query));

      // Status filter - check if candidate has any application with the filtered status
      const matchesStatus =
        statusFilter === "all" ||
        candidate.applications?.some((app) => app.status === statusFilter);

      return matchesSearch && matchesStatus;
    });

    // Sort by score (using match score from first application) or date
    if (sortBy === "score") {
      filtered.sort((a, b) => {
        const scoreA = a.applications?.[0]?.matchScore || 0;
        const scoreB = b.applications?.[0]?.matchScore || 0;
        return scoreB - scoreA;
      });
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return filtered;
  }, [candidatesData, searchQuery, statusFilter, sortBy]);

  // Check if any filter is active
  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("score");
  }, []);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.APPLIED:
        return "bg-blue-500/20 text-blue-400";
      case ApplicationStatus.IN_REVIEW:
        return "bg-yellow-500/20 text-yellow-400";
      case ApplicationStatus.SHORTLISTED:
        return "bg-purple-500/20 text-purple-400";
      case ApplicationStatus.INTERVIEW:
        return "bg-indigo-500/20 text-indigo-400";
      case ApplicationStatus.OFFERED:
        return "bg-cyan-500/20 text-cyan-400";
      case ApplicationStatus.HIRED:
        return "bg-emerald-500/20 text-emerald-400";
      case ApplicationStatus.REJECTED:
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-zinc-700 text-zinc-400";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          <Header
            title="Candidates"
            description="View and manage all candidates across all jobs"
          />

          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <span className="ml-3 text-zinc-400">Loading candidates...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center py-12">
                <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                <span className="text-zinc-400">
                  Failed to load candidates. Please try again.
                </span>
              </div>
            )}

            {/* Content */}
            {!isLoading && !error && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      placeholder="Search candidates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as ApplicationStatus | "all")
                    }
                  >
                    <SelectTrigger className="w-32 bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem
                        value="all"
                        className="text-white focus:bg-zinc-800"
                      >
                        All Status
                      </SelectItem>
                      <SelectItem
                        value={ApplicationStatus.APPLIED}
                        className="text-white focus:bg-zinc-800"
                      >
                        Applied
                      </SelectItem>
                      <SelectItem
                        value={ApplicationStatus.IN_REVIEW}
                        className="text-white focus:bg-zinc-800"
                      >
                        In Review
                      </SelectItem>
                      <SelectItem
                        value={ApplicationStatus.SHORTLISTED}
                        className="text-white focus:bg-zinc-800"
                      >
                        Shortlisted
                      </SelectItem>
                      <SelectItem
                        value={ApplicationStatus.INTERVIEW}
                        className="text-white focus:bg-zinc-800"
                      >
                        Interview
                      </SelectItem>
                      <SelectItem
                        value={ApplicationStatus.OFFERED}
                        className="text-white focus:bg-zinc-800"
                      >
                        Offered
                      </SelectItem>
                      <SelectItem
                        value={ApplicationStatus.HIRED}
                        className="text-white focus:bg-zinc-800"
                      >
                        Hired
                      </SelectItem>
                      <SelectItem
                        value={ApplicationStatus.REJECTED}
                        className="text-white focus:bg-zinc-800"
                      >
                        Rejected
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
                    onClick={() => setSortBy(sortBy === "score" ? "date" : "score")}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    Sort by {sortBy === "score" ? "Score" : "Date"}
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-zinc-400 hover:text-white"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>

                {/* Results count */}
                {candidatesData?.data && (
                  <div className="text-sm text-zinc-400">
                    Showing <span className="text-white font-semibold">{filteredCandidates.length}</span> of{" "}
                    <span className="text-white font-semibold">{candidatesData.data.length}</span> candidates
                  </div>
                )}

                {/* Candidates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCandidates.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-zinc-400 mb-4">
                        {searchQuery || statusFilter !== "all"
                          ? "No candidates match your filters"
                          : "No candidates yet. Candidates will appear here when they apply to your jobs."}
                      </p>
                    </div>
                  ) : (
                    filteredCandidates.map((candidate) => {
                      const primaryApplication = candidate.applications?.[0];
                      const matchScore = primaryApplication?.matchScore || 0;
                      const status =
                        primaryApplication?.status || ApplicationStatus.APPLIED;

                      return (
                        <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
                          <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                    {getInitials(candidate.name)}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                                      {candidate.name || "Unknown Candidate"}
                                    </h3>
                                    <p className="text-xs text-zinc-500">
                                      {candidate.email || "No email"}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={getStatusColor(status)}
                                >
                                  {status}
                                </Badge>
                              </div>

                              {primaryApplication && (
                                <>
                                  <div className="mb-4">
                                    <p className="text-xs text-zinc-500 mb-1">
                                      Applied for
                                    </p>
                                    <p className="text-sm text-zinc-300">
                                      {primaryApplication.job?.title || "N/A"}
                                    </p>
                                  </div>

                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-zinc-500">
                                        Match Score
                                      </span>
                                      <span className="text-sm font-semibold text-violet-400">
                                        {matchScore}%
                                      </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600"
                                        style={{ width: `${matchScore}%` }}
                                      />
                                    </div>
                                  </div>
                                </>
                              )}

                              {candidate.skills && candidate.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                  {candidate.skills.slice(0, 3).map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {candidate.skills.length > 3 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                                      +{candidate.skills.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                <span className="text-xs text-zinc-500">
                                  {new Date(candidate.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-zinc-400 hover:text-white gap-1 h-7"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
