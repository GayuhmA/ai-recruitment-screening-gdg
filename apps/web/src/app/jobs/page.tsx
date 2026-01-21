'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Users,
  Calendar,
  ArrowUpRight,
  Loader2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useJobs, useCreateJob } from '@/hooks/useJobs';
import { JobStatus } from '@/types/api';
import { format } from 'date-fns';

export default function JobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    requiredSkills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');

  // Skill handlers
  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !formData.requiredSkills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, trimmed],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skill),
    }));
  };

  // Fetch jobs from API
  const { data: jobsData, isLoading } = useJobs();
  const createJobMutation = useCreateJob();

  // Auto-open create dialog if ?create=true query param is present
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateDialogOpen(true);
      router.replace('/jobs', { scroll: false });
    }
  }, [searchParams, router]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    if (!jobsData?.data) return [];

    const query = searchQuery.trim().toLowerCase();

    return jobsData.data.filter((job) => {
      const matchesSearch =
        query === '' ||
        job.title?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.department?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' || job.status === statusFilter;
      const matchesDepartment =
        departmentFilter === 'all' || job.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [jobsData, searchQuery, statusFilter, departmentFilter]);

  // Get unique departments
  const uniqueDepartments = useMemo(() => {
    if (!jobsData?.data) return [];
    return jobsData.data
      .map((job) => job.department)
      .filter((dept, index, self) => dept && self.indexOf(dept) === index)
      .sort();
  }, [jobsData]);

  const handleCreateJob = async () => {
    try {
      await createJobMutation.mutateAsync({
        title: formData.title,
        department: formData.department,
        description: formData.description,
        requiredSkills: formData.requiredSkills,
        status: JobStatus.OPEN,
        requirements: {
          requiredSkills: formData.requiredSkills,
        },
      } as any);

      setFormData({
        title: '',
        department: '',
        description: '',
        requiredSkills: [],
      });
      setNewSkill('');
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create job:', err);
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                      value="OPEN"
                      className="text-white focus:bg-zinc-800"
                    >
                      Open
                    </SelectItem>
                    <SelectItem
                      value="CLOSED"
                      className="text-white focus:bg-zinc-800"
                    >
                      Closed
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem
                      value="all"
                      className="text-white focus:bg-zinc-800"
                    >
                      All Departments
                    </SelectItem>
                    {uniqueDepartments.map((dept) => (
                      <SelectItem
                        key={dept}
                        value={dept}
                        className="text-white focus:bg-zinc-800 capitalize"
                      >
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Create Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      Create New Job
                    </DialogTitle>
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
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Required Skills</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
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
                      {formData.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.requiredSkills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="bg-zinc-800 text-zinc-300 gap-1 pr-1"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
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
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
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

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <span className="ml-3 text-zinc-400">Loading jobs...</span>
              </div>
            )}

            {/* Jobs Grid */}
            {!isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredJobs.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-zinc-500">
                    {searchQuery ||
                    statusFilter !== 'all' ||
                    departmentFilter !== 'all'
                      ? 'No jobs match your filters'
                      : 'No jobs yet. Create your first job to get started!'}
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                        <CardContent className="px-5 py-2">
                          <div className="flex items-start justify-between mb-4">
                            <Badge
                              variant="secondary"
                              className={
                                job.status === JobStatus.OPEN
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-zinc-700 text-zinc-400'
                              }
                            >
                              {job.status === JobStatus.OPEN
                                ? 'Open'
                                : 'Closed'}
                            </Badge>
                            <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors" />
                          </div>
                          <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors mb-1">
                            {job.title}
                          </h3>
                          <p className="text-sm text-zinc-500 mb-4 capitalize">
                            {job.department || 'General'}
                          </p>
                          <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                            {job.description}
                          </p>
                          {job.requiredSkills &&
                            job.requiredSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {job.requiredSkills
                                  .slice(0, 4)
                                  .map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                {job.requiredSkills.length > 4 && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                                    +{job.requiredSkills.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <Users className="w-4 h-4" />
                              <span className="text-sm">
                                {job._count?.applications || 0} applicants
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">
                                {format(new Date(job.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
