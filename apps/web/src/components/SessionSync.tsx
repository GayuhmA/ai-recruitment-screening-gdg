'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { tokenManager } from '@/lib/api';

/**
 * Session Sync Component
 * Syncs NextAuth session with our custom token manager (localStorage)
 * This ensures compatibility between NextAuth (Google OAuth) and custom backend auth
 */
export function SessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.accessToken) {
      // Sync NextAuth session to our token manager
      tokenManager.setToken(session.user.accessToken);
      tokenManager.setUser({
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        organizationId: session.user.organizationId,
      });
    } else if (status === 'unauthenticated') {
      // Clear tokens when logged out
      tokenManager.removeToken();
    }
  }, [session, status]);

  return null; // This component doesn't render anything
}
