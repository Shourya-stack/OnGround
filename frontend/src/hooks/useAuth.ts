/**
 * TrueLine — useAuth Hook
 * Manages Supabase authentication, session state, user role, and demo role switcher.
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserRole, UserProfile } from '../lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  switchRoleForDemo: (newRole: UserRole) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
