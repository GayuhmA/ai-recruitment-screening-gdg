"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Users, Calendar, ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useJobs, useCreateJob } from "@/hooks/useJobs";
import { formatDistanceToNow } from "date-fns";

export default function JobsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch jobs with React Query
  const { data: jobsData, isLoading, error } = useJobs({ 
    limit: 20,
    q: searchQuery 
  });
  
  // Create job mutation
  const createJob = useCreateJob();
  
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    department: "",
    location: "",
    requiredSkills: "",
  });

  const handleCreateJob = async () => {
    try {
      await createJob.mutateAsync({
        title: newJob.title,
        description: newJob.description,
        requirements: {
          requiredSkills: newJob.requiredSkills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      
      // Reset form and close dialog
      setNewJob({
        title: "",
        description: "",
        department: "",
        location: "",
        requiredSkills: "",
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create job:", error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          <Header
            title="Jobs"
            description="Manage your open positions and track candidates"
          />

          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 gap-2">
                    <Plus className="w-4 h-4" />
                    Create Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Job</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Fill in the details to post a new job opening
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g. Senior Backend Developer"
                        value={newJob.title}
                        onChange={(e) =>
                          setNewJob({ ...newJob, title: e.target.value })
                        }
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Job description and responsibilities..."
                        rows={4}
                        value={newJob.description}
                        onChange={(e) =>
                          setNewJob({ ...newJob, description: e.target.value })
                        }
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skills">Required Skills</Label>
                      <Input
                        id="skills"
                        placeholder="e.g. Node.js, React, PostgreSQL (comma separated)"
                        value={newJob.requiredSkills}
                        onChange={(e) =>
                          setNewJob({ ...newJob, requiredSkills: e.target.value })
                        }
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-zinc-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateJob}
                      disabled={createJob.isPending || !newJob.title || !newJob.description}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                    >
                      {createJob.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Job"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <span className="ml-3 text-zinc-400">Loading jobs...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-6">
                  <p className="text-red-400">Failed to load jobs: {error.message}</p>
                </CardContent>
              </Card>
            )}

            {/* Jobs Grid */}
            {!isLoading && !error && jobsData && (
              <>
                {jobsData.data.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-12 text-center">
                      <p className="text-zinc-400">
                        {searchQuery ? "No jobs found matching your search." : "No jobs yet. Create your first job!"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jobsData.data.map((job) => (
                      <Link key={job.id} href={`/jobs/${job.id}`}>
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors mb-1">
                                  {job.title}
                                </h3>
                                <p className="text-sm text-zinc-500">
                                  Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              <Badge
                                variant="secondary"
                                className="bg-emerald-500/20 text-emerald-400"
                              >
                                Open
                              </Badge>
                            </div>

                            <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                              {job.description}
                            </p>

                            {job.requirements?.requiredSkills && job.requirements.requiredSkills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {job.requirements.requiredSkills.slice(0, 3).map((skill, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="border-zinc-700 text-zinc-300"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {job.requirements.requiredSkills.length > 3 && (
                                  <Badge
                                    variant="outline"
                                    className="border-zinc-700 text-zinc-400"
                                  >
                                    +{job.requirements.requiredSkills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                              <div className="flex items-center gap-4 text-sm text-zinc-500">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>0 applicants</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
