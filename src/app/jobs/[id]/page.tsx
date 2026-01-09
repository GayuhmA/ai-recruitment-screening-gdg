"use client";

import { use } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowUpDown, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          <Header title="Frontend Developer" description="Engineering • Open" />

          <div className="flex-1 p-6 space-y-6 overflow-auto">
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
                      className="bg-emerald-500/20 text-emerald-400"
                    >
                      Open
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 mb-4">
                  We are looking for an experienced Frontend Developer to join our
                  team. You will be responsible for building user interfaces using
                  React and TypeScript. The ideal candidate should have strong
                  problem-solving skills and experience with modern web
                  technologies.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-zinc-500 mr-2">
                    Required Skills:
                  </span>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    React
                  </Badge>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    TypeScript
                  </Badge>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    Tailwind CSS
                  </Badge>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    Next.js
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Candidates Section */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <CardTitle className="text-lg text-white">
                    Candidates (3)
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
                    <Select defaultValue="all">
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
                          value="New"
                          className="text-white focus:bg-zinc-700"
                        >
                          New
                        </SelectItem>
                        <SelectItem
                          value="Hired"
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
                <div className="rounded-lg border border-zinc-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400">Candidate</TableHead>
                        <TableHead className="text-zinc-400">Match Score</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400">Uploaded</TableHead>
                        <TableHead className="text-zinc-400 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Candidate 1 */}
                      <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                              AF
                            </div>
                            <div>
                              <p className="font-medium text-white">Ahmad Fauzi</p>
                              <p className="text-sm text-zinc-500">
                                ahmad.fauzi@email.com
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: "92%" }}
                              />
                            </div>
                            <span className="font-semibold text-emerald-400">
                              92%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-blue-500/20 text-blue-400"
                          >
                            New
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-400">Jan 5, 2026</TableCell>
                        <TableCell className="text-right">
                          <Link href="/candidates/1">
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

                      {/* Candidate 2 */}
                      <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                              CD
                            </div>
                            <div>
                              <p className="font-medium text-white">Citra Dewi</p>
                              <p className="text-sm text-zinc-500">
                                citra.dewi@email.com
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-violet-500"
                                style={{ width: "85%" }}
                              />
                            </div>
                            <span className="font-semibold text-violet-400">
                              85%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-blue-500/20 text-blue-400"
                          >
                            New
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-400">Jan 4, 2026</TableCell>
                        <TableCell className="text-right">
                          <Link href="/candidates/2">
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

                      {/* Candidate 3 */}
                      <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                              ER
                            </div>
                            <div>
                              <p className="font-medium text-white">Eko Raharjo</p>
                              <p className="text-sm text-zinc-500">
                                eko.raharjo@email.com
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{ width: "78%" }}
                              />
                            </div>
                            <span className="font-semibold text-amber-400">
                              78%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/20 text-emerald-400"
                          >
                            Accepted
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-400">Jan 3, 2026</TableCell>
                        <TableCell className="text-right">
                          <Link href="/candidates/3">
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
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
