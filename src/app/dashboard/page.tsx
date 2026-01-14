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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <Header title="Dashboard" description="Welcome back Username! Here's what's happening today." />
          
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Open Jobs */}
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-200 group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-zinc-400">Open Jobs</p>
                      <p className="text-3xl font-bold text-white">2</p>
                      <p className="text-xs text-zinc-500">+1 this month</p>
                    </div>
                    <div className="p-3 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity">
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
                      <p className="text-3xl font-bold text-white">5</p>
                      <p className="text-xs text-zinc-500">+3 this week</p>
                    </div>
                    <div className="p-3 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 opacity-80 group-hover:opacity-100 transition-opacity">
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
                      <p className="text-3xl font-bold text-white">3</p>
                      <p className="text-xs text-zinc-500">Needs attention</p>
                    </div>
                    <div className="p-3 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 opacity-80 group-hover:opacity-100 transition-opacity">
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
                      <p className="text-3xl font-bold text-white">1</p>
                      <p className="text-xs text-zinc-500">Great progress!</p>
                    </div>
                    <div className="p-3 rounded-xl bg-linear-to-br from-pink-500 to-rose-600 opacity-80 group-hover:opacity-100 transition-opacity">
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
                  <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400">
                      <FileUser className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">New candidate applied for Frontend Developer</p>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">2h ago</span>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">Ahmad moved to Interview stage</p>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">4h ago</span>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">Sarah accepted the offer for Backend Developer</p>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">1d ago</span>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">AI analysis completed for 3 candidates</p>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">2d ago</span>
                  </div>
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
                    <Link href="/jobs">
                      <Button className="w-full justify-start gap-2 bg-linear-to-r mb-3 from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white">
                        <Plus className="w-4 h-4" />
                        Create New Job
                      </Button>
                    </Link>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/jobs/" className="p-4 rounded-lg border border-zinc-800 hover:border-violet-500/50 bg-zinc-800/30 hover:bg-zinc-800/50 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">Engineering</Badge>
                      <span className="text-xs text-zinc-500">3 applicants</span>
                    </div>
                    <h3 className="font-medium text-white group-hover:text-violet-400 transition-colors mb-2">Frontend Developer</h3>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">React</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">TypeScript</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">Tailwind</span>
                    </div>
                  </Link>

                  <Link href="/jobs/" className="p-4 rounded-lg border border-zinc-800 hover:border-violet-500/50 bg-zinc-800/30 hover:bg-zinc-800/50 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">Engineering</Badge>
                      <span className="text-xs text-zinc-500">2 applicants</span>
                    </div>
                    <h3 className="font-medium text-white group-hover:text-violet-400 transition-colors mb-2">Backend Developer</h3>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">Node.js</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">PostgreSQL</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">Docker</span>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>

  );
}
