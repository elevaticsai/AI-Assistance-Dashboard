import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Development-only dummy credentials
const VALID_EMAIL = 'user@elevatics.ai';
const VALID_PASSWORD = 'password';

const supabase = createClient(
  'https://xyzcompany.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdGt4eHh4eHh4eHh4eHh4eHh4IiwiZG9sZSI6ImFub24iLCJpYXQiOjE2NDYxNDQwMDAsImV4cCI6MTgwMzgyNDAwMH0.K6J_ghwFh-ArFX6IAYcqZxBi6Ac_S8DLwptcb9pO9rw'
);

interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string) => {
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      setUser({
        id: 'dummy-user-123',
        email: email
      });
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const signUp = async (email: string, password: string) => {
    throw new Error('Sign up is disabled');
  };

  const signOut = async () => {
    setUser(null);
  };

  const signInWithGithub = async () => {
    throw new Error('GitHub sign in is disabled');
  };

  const signInWithGoogle = async () => {
    throw new Error('Google sign in is disabled');
  };

  const resetPassword = async (email: string) => {
    throw new Error('Password reset is disabled');
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    signInWithGithub,
    signInWithGoogle,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}