'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { status: sessionStatus } = useSession();

  const isLoading = authLoading || sessionStatus === 'loading';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && sessionStatus === 'unauthenticated') {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, sessionStatus, router]);

 
  if (isLoading || (sessionStatus === 'authenticated' && !isAuthenticated)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && sessionStatus === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
