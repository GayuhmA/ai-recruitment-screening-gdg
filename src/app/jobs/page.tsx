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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Users, Calendar, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function JobsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
                    className="w-64 pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                  />
                </div>
                <Select defaultValue="all">
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
                      value="Open"
                      className="text-white focus:bg-zinc-800"
                    >
                      Open
                    </SelectItem>
                    <SelectItem
                      value="Closed"
                      className="text-white focus:bg-zinc-800"
                    >
                      Closed
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
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
                    <SelectItem
                      value="engineering"
                      className="text-white focus:bg-zinc-800"
                    >
                      Engineering
                    </SelectItem>
                    <SelectItem
                      value="design"
                      className="text-white focus:bg-zinc-800"
                    >
                      Design
                    </SelectItem>
                    <SelectItem
                      value="analytics"
                      className="text-white focus:bg-zinc-800"
                    >
                      Analytics
                    </SelectItem>
                    <SelectItem
                      value="marketing"
                      className="text-white focus:bg-zinc-800"
                    >
                      Marketing
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Create Job
                  </Button>
                </DialogTrigger>
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
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Department</Label>
                      <Select>
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
                        className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">
                        Required Skills (comma-separated)
                      </Label>
                      <Input
                        placeholder="e.g., React, TypeScript, Node.js"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Create Job
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Job Card */}
              <Link href="/jobs">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/20 text-emerald-400"
                      >
                        Open
                      </Badge>
                      <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors mb-1">
                      Frontend Developer
                    </h3>
                    <p className="text-sm text-zinc-500 mb-4">Engineering</p>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                      We are looking for an experienced Frontend Developer to join
                      our team. You will be responsible for building user interfaces
                      using React and TypeScript.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        React
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        TypeScript
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        Tailwind CSS
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        Next.js
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">3 applicants</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Jan 5, 2026</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/jobs">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/20 text-emerald-400"
                      >
                        Open
                      </Badge>
                      <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors mb-1">
                      Backend Developer
                    </h3>
                    <p className="text-sm text-zinc-500 mb-4">Engineering</p>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                      Join our backend team to build scalable APIs and services.
                      Experience with Node.js and database management is required.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        Node.js
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        PostgreSQL
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        Docker
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        REST API
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">2 applicants</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Jan 3, 2026</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/jobs">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <Badge
                        variant="secondary"
                        className="bg-zinc-700 text-zinc-400"
                      >
                        Closed
                      </Badge>
                      <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors mb-1">
                      UI/UX Designer
                    </h3>
                    <p className="text-sm text-zinc-500 mb-4">Design</p>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                      Create beautiful and intuitive user experiences for our
                      products. Strong portfolio and Figma skills required.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        Figma
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        UI Design
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        UX Research
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        Prototyping
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">5 applicants</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Dec 20, 2025</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/jobs">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/20 text-emerald-400"
                      >
                        Open
                      </Badge>
                      <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors mb-1">
                      Data Analyst
                    </h3>
                    <p className="text-sm text-zinc-500 mb-4">Analytics</p>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                      Analyze data to provide insights and support decision-making.
                      Experience with SQL and Python is a plus.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        SQL
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        Python
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        Excel
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                        Data Visualization
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">4 applicants</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Jan 2, 2026</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

}
