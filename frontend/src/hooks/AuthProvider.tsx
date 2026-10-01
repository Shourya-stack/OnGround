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
  const [role, setRole] = useState<UserRole | null>(null);
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
        setRole(null);
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
        setRole(null);
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

      if (error) {
        console.error('Could not fetch user profile from Supabase:', error);
        setRole(null);
      } else if (data) {
        setProfile(data as UserProfile);
        const profileRole = data.role as UserRole;
        if (['planner', 'supervisor', 'manager', 'engineer'].includes(profileRole)) {
          setRole(profileRole);
        } else {
          setRole(null);
        }
      }
    } catch (err) {
      console.error('Could not fetch user profile from Supabase:', err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password = '') => {
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        await fetchProfile(data.user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (payload: {
    email: string;
    password: string;
    fullName: string;
    company?: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email.trim(),
        password: payload.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: {
            full_name: payload.fullName,
            company: payload.company,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await fetchProfile(data.session.user.id);
      }
      return Boolean(data.session);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
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
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>

  );
};
