'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-violet-900/20 via-zinc-950 to-zinc-950" />
      
      <div className="relative w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center pb-6">Sign In</h1>
        {/* Login Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-white">Welcome Back</CardTitle>
            <CardDescription className="text-zinc-400">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link href="#" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Link href="/dashboard">
                <Button type="submit" className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-zinc-900 px-2 text-zinc-500">or</span>
              </div>
            </div>

            {/* Register Link */}
            <p className="text-center text-sm text-zinc-400">
              Don't have an account?{' '}
              <Link href="#" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}