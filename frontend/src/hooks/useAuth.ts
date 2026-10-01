/**
 * OnGround — useAuth Hook
 * Manages Supabase authentication, session state, user role, and demo role switcher.
 */

import { createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '../lib/types';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isPlanner: boolean;
  isSupervisor: boolean;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (payload: {
    email: string;
    password: string;
    fullName: string;
    company?: string;
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
}


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
