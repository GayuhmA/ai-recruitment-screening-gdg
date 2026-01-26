'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { tokenManager } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Session Sync Component
 * Syncs NextAuth session with our custom token manager (localStorage)
 * This ensures compatibility between NextAuth (Google OAuth) and custom backend auth
 */
export function SessionSync() {
  const { data: session, status } = useSession();
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      
      // Sync NextAuth session to our token manager
      if (user.accessToken) {
        tokenManager.setToken(user.accessToken);
        tokenManager.setUser({
          id: user.id,
          email: user.email,
          fullName: user.name || user.email,
          role: user.role || 'recruiter',
          organizationId: user.organizationId,
        });

        // Refresh AuthContext to update the UI
        refreshUser();
        
        console.log('✅ Session synced to localStorage');
      }
    } else if (status === 'unauthenticated') {
      // Clear tokens when logged out
      tokenManager.removeToken();
      console.log('🔒 Session cleared from localStorage');
    }
  }, [session, status, refreshUser]);

  return null; // This component doesn't render anything
}

