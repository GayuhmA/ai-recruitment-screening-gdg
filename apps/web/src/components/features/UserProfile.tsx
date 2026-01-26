"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Building2, Calendar, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useUser';
import { format } from 'date-fns';

export function UserProfile() {
  const { data: user, isLoading, error, refetch, isRefetching } = useCurrentUser();

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-red-400 mb-4">Failed to load user profile</p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="border-zinc-700 text-zinc-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <User className="w-12 h-12 text-zinc-400 mb-4" />
          <p className="text-zinc-400">No user data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Profile Information</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-zinc-400 hover:text-white"
        >
          {isRefetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
            {user.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{user.fullName}</h3>
            <Badge variant="secondary" className="mt-1 bg-violet-500/20 text-violet-400">
              {user.role}
            </Badge>
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-zinc-300">
            <div className="p-2 rounded-lg bg-zinc-800">
              <Mail className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Email</p>
              <p className="text-sm">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-zinc-300">
            <div className="p-2 rounded-lg bg-zinc-800">
              <Building2 className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Organization ID</p>
              <p className="text-sm font-mono">{user.organizationId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-zinc-300">
            <div className="p-2 rounded-lg bg-zinc-800">
              <User className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">User ID</p>
              <p className="text-sm font-mono">{user.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-zinc-300">
            <div className="p-2 rounded-lg bg-zinc-800">
              <Calendar className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Member Since</p>
              <p className="text-sm">
                {format(new Date(user.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserProfile;
