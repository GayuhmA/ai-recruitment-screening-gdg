'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Briefcase, 
  Users, 
  Clock, 
  UserCheck, 
  Plus,
  ArrowUpRight,
  FileUser,
  Sparkles,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useJobs, useCreateJob } from '@/hooks/useJobs';
import { useCandidates } from '@/hooks/useCandidates';
import { useApplications } from '@/hooks/useApplications';
import { ApplicationStatus, JobStatus } from '@/types/api';
import { useState } from 'react';

export default function DashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    description: "",
    requiredSkills: "",
  });

  // Fetch real data
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ limit: 100 });
  const { data: candidatesData, isLoading: candidatesLoading } = useCandidates({ limit: 100 });
  const { data: applicationsData, isLoading: applicationsLoading } = useApplications({ limit: 100 });
  const createJobMutation = useCreateJob();

  const handleCreateJob = async () => {
    try {
      await createJobMutation.mutateAsync({
        title: formData.title,
        department: formData.department,
        description: formData.description,
        requiredSkills: formData.requiredSkills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        status: JobStatus.OPEN,
      });

      setFormData({
        title: "",
        department: "",
        description: "",
        requiredSkills: "",
      });
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error("Failed to create job:", err);
    }
  };

  // Calculate metrics from real data
  const totalJobs = jobsData?.data.length || 0;
  const totalCandidates = candidatesData?.data.length || 0;
  const totalApplications = applicationsData?.data.length || 0;
  
  // Count applications by status
  const pendingReviews = applicationsData?.data.filter(
    app => app.status === 'APPLIED' || app.status === 'IN_REVIEW'
  ).length || 0;
  
  const hiredThisMonth = applicationsData?.data.filter(app => {
    if (app.status !== 'HIRED') return false;
    const appDate = new Date(app.createdAt);
    const now = new Date();
    return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
  }).length || 0;

  const isLoading = jobsLoading || candidatesLoading || applicationsLoading;
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <Header title="Dashboard" description="Welcome back Username! Here's what's happening today." />
          
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
                          <p className="text-sm font-medium text-zinc-400">Open Jobs</p>
                          <p className="text-3xl font-bold text-white">{totalJobs}</p>
                          <p className="text-xs text-zinc-500">Active positions</p>
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
                          <p className="text-sm font-medium text-zinc-400">Total Candidates</p>
                          <p className="text-3xl font-bold text-white">{totalCandidates}</p>
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
                          <p className="text-sm font-medium text-zinc-400">Pending Reviews</p>
                          <p className="text-3xl font-bold text-white">{pendingReviews}</p>
                          <p className="text-xs text-zinc-500">
                            {pendingReviews > 0 ? 'Needs attention' : 'All clear'}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hired This Month */}
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-200 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-zinc-400">Hired This Month</p>
                          <p className="text-3xl font-bold text-white">{hiredThisMonth}</p>
                          <p className="text-xs text-zinc-500">
                            {hiredThisMonth > 0 ? 'Great progress!' : 'Keep going!'}
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
                    <CardTitle className="text-lg font-semibold text-white">Recent Applications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {applicationsData?.data.slice(0, 5).map((app) => (
                      <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400">
                          <FileUser className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300 truncate">
                            {app.candidate?.name || 'Unknown'} applied for {app.job?.title || 'Unknown Position'}
                          </p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={
                            app.status === ApplicationStatus.HIRED ? 'bg-emerald-500/20 text-emerald-400' :
                            app.status === ApplicationStatus.REJECTED ? 'bg-red-500/20 text-red-400' :
                            app.status === ApplicationStatus.INTERVIEW ? 'bg-blue-500/20 text-blue-400' :
                            'bg-amber-500/20 text-amber-400'
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                    
                    {(!applicationsData || applicationsData.data.length === 0) && (
                      <div className="text-center py-8 text-zinc-500">
                        No applications yet
                      </div>
                    )}
                  </CardContent>
                </Card>

              {/* Quick Actions & Top Candidates */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="w-full justify-start gap-2 bg-linear-to-r mb-3 from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Job
                    </Button>
                    <Link href="/candidates">
                      <Button variant="outline" className="w-full justify-start gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                        <Users className="w-4 h-4" />
                        View All Candidates
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Top Candidates */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-white">Top Matches</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/candidates/" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-white font-medium text-sm">
                        AF
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-violet-400 transition-colors">Ahmad Fauzi</p>
                        <p className="text-xs text-zinc-500 truncate">Frontend Developer</p>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">92%</Badge>
                    </Link>

                    <Link href="/candidates/" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-white font-medium text-sm">
                        BS
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-violet-400 transition-colors">Budi Santoso</p>
                        <p className="text-xs text-zinc-500 truncate">Backend Developer</p>
                      </div>
                      <Badge variant="secondary" className="bg-violet-500/20 text-violet-400">88%</Badge>
                    </Link>

                    <Link href="/candidates/" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-white font-medium text-sm">
                        CD
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-violet-400 transition-colors">Citra Dewi</p>
                        <p className="text-xs text-zinc-500 truncate">Frontend Developer</p>
                      </div>
                      <Badge variant="secondary" className="bg-violet-500/20 text-violet-400">85%</Badge>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Open Jobs Preview */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold text-white">Open Positions</CardTitle>
                <Link href="/jobs">
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white gap-1">
                    View All <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {jobsData && jobsData.data.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jobsData.data.slice(0, 4).map((job) => (
                      <Link key={job.id} href={`/jobs/${job.id}`} className="p-4 rounded-lg border border-zinc-800 hover:border-violet-500/50 bg-zinc-800/30 hover:bg-zinc-800/50 transition-all group">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-white group-hover:text-violet-400 transition-colors">
                            {job.title}
                          </h4>
                          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 shrink-0">
                            Open
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                          {job.description}
                        </p>
                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {job.requiredSkills.length > 3 && (
                              <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs">
                                +{job.requiredSkills.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    No open positions yet. <Link href="/jobs" className="text-violet-400 hover:text-violet-300">Create your first job</Link>
                  </div>
                )}
              </CardContent>
            </Card>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Create Job Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Job</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add a new job position to start receiving candidates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Job Title</Label>
              <Input
                placeholder="e.g., Senior Frontend Engineer"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem
                    value="engineering"
                    className="text-white focus:bg-zinc-700"
                  >
                    Engineering
                  </SelectItem>
                  <SelectItem
                    value="design"
                    className="text-white focus:bg-zinc-700"
                  >
                    Design
                  </SelectItem>
                  <SelectItem
                    value="analytics"
                    className="text-white focus:bg-zinc-700"
                  >
                    Analytics
                  </SelectItem>
                  <SelectItem
                    value="marketing"
                    className="text-white focus:bg-zinc-700"
                  >
                    Marketing
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Description</Label>
              <Textarea
                placeholder="Describe the role and responsibilities..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Required Skills (comma-separated)
              </Label>
              <Input
                placeholder="e.g., React, TypeScript, Node.js"
                value={formData.requiredSkills}
                onChange={(e) =>
                  setFormData({ ...formData, requiredSkills: e.target.value })
                }
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(false)}
              className="text-zinc-400 hover:text-white"
              disabled={createJobMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
              onClick={handleCreateJob}
              disabled={
                createJobMutation.isPending ||
                !formData.title ||
                !formData.department ||
                !formData.description
              }
            >
              {createJobMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
