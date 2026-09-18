/**
 * OnGround — AuthProvider Implementation
 */

import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserRole, UserProfile } from '../lib/types';
import { setUnauthorizedHandler } from '../lib/apiClient';
import { AuthContext } from './useAuth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('planner'); // Default to planner for smooth initial demo experience
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 0. Register centralized 401 handling for API requests
    setUnauthorizedHandler(async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        // Safe swallow
      }
      setUser(null);
      setSession(null);
      setProfile(null);

      if (typeof window !== 'undefined' && window.location) {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/signup') && currentPath !== '/') {
          window.location.href = '/login?expired=true';
        }
      }
    });

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      setUnauthorizedHandler(null);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile(data as UserProfile);
        setRole(data.role as UserRole);
      }
    } catch (err) {
      console.warn('Could not fetch user profile from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, selectedRole: UserRole = 'planner') => {
    setLoading(true);
    try {
      // For local development and demo purposes, allows instant demo login
      setRole(selectedRole);
      setProfile({
        id: '00000000-0000-0000-0000-000000000002',
        email: email,
        full_name: email.split('@')[0],
        role: selectedRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const switchRoleForDemo = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('onground_demo_role', newRole);
    if (profile) {
      setProfile({ ...profile, role: newRole });
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isPlanner: role === 'planner',
        isSupervisor: role === 'supervisor',
        loading,
        signIn,
        signOut,
        switchRoleForDemo,
      }}
    >
      {children}
    </AuthContext.Provider>

  );
};
