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
import { Search, ArrowUpDown, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState("");

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
                    value="New"
                    className="text-white focus:bg-zinc-800"
                  >
                    New
                  </SelectItem>
                  <SelectItem
                    value="Accepted"
                    className="text-white focus:bg-zinc-800"
                  >
                    Accepted
                  </SelectItem>
                  <SelectItem
                    value="Rejected"
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
              >
                <ArrowUpDown className="w-4 h-4" />
                Sort by Score
              </Button>
            </div>

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Candidates */}
              <Link href="/candidates/1">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                          AF
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                            Ahmad Fauzi
                          </h3>
                          <p className="text-xs text-zinc-500">
                            ahmad.fauzi@email.com
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-500/20 text-blue-400"
                      >
                        New
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-zinc-500 mb-1">Applied for</p>
                      <p className="text-sm text-zinc-300">
                        Frontend Developer
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">
                          Match Score
                        </span>
                        <span className="text-sm font-semibold text-emerald-400">
                          92%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-600"
                          style={{ width: "92%" }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        React
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        TypeScript
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        Next.js
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500">Jan 5, 2026</span>
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

              <Link href="/candidates/2">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                          CD
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                            Citra Dewi
                          </h3>
                          <p className="text-xs text-zinc-500">
                            citra.dewi@email.com
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-500/20 text-blue-400"
                      >
                        New
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-zinc-500 mb-1">Applied for</p>
                      <p className="text-sm text-zinc-300">
                        Frontend Developer
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">
                          Match Score
                        </span>
                        <span className="text-sm font-semibold text-violet-400">
                          85%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-600"
                          style={{ width: "85%" }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        Vue.js
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        JavaScript
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        CSS
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500">Jan 4, 2026</span>
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

              <Link href="/candidates/3">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                          ER
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                            Eko Raharjo
                          </h3>
                          <p className="text-xs text-zinc-500">
                            eko.raharjo@email.com
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/20 text-emerald-400"
                      >
                        Accepted
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-zinc-500 mb-1">Applied for</p>
                      <p className="text-sm text-zinc-300">
                        Frontend Developer
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">
                          Match Score
                        </span>
                        <span className="text-sm font-semibold text-amber-400">
                          78%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-amber-500 to-orange-600"
                          style={{ width: "78%" }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        React
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        Node.js
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        MongoDB
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500">Jan 3, 2026</span>
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

              <Link href="/candidates/4">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                          BS
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                            Budi Santoso
                          </h3>
                          <p className="text-xs text-zinc-500">
                            budi.santoso@email.com
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-500/20 text-blue-400"
                      >
                        New
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-zinc-500 mb-1">Applied for</p>
                      <p className="text-sm text-zinc-300">Backend Developer</p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">
                          Match Score
                        </span>
                        <span className="text-sm font-semibold text-violet-400">
                          88%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-600"
                          style={{ width: "88%" }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        Node.js
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        PostgreSQL
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        Docker
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500">Jan 3, 2026</span>
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

              <Link href="/candidates/5">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-semibold">
                          DL
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                            Dewi Lestari
                          </h3>
                          <p className="text-xs text-zinc-500">
                            dewi.lestari@email.com
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-red-500/20 text-red-400"
                      >
                        Rejected
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-zinc-500 mb-1">Applied for</p>
                      <p className="text-sm text-zinc-300">Backend Developer</p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">
                          Match Score
                        </span>
                        <span className="text-sm font-semibold text-red-400">
                          65%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-red-500 to-rose-600"
                          style={{ width: "65%" }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        Python
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        Django
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        MySQL
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500">Jan 2, 2026</span>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
