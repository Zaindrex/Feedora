import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import { databaseService } from '../../services/databaseService';
import { isSupabaseConfigured, requireSupabase } from '../../integrations/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, targetRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Pick<UserProfile, 'name' | 'phone'>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured) {
      return () => { mounted = false; };
    }
    const supabase = requireSupabase();

    const resolveSession = async (authUserId?: string) => {
      if (!authUserId) {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }
      try {
        const profile = await databaseService.getProfileByUserId(authUserId);
        if (!profile || profile.status !== 'active') {
          await supabase.auth.signOut();
          if (mounted) setUser(null);
          return;
        }
        if (mounted) setUser(profile);
      } catch (error) {
        console.error('Failed to load authenticated profile:', error);
        await supabase.auth.signOut();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => void resolveSession(session?.user.id));
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      return resolveSession(data.session?.user.id);
    }).catch((error: unknown) => {
      console.error('Failed to restore Supabase session:', error);
      if (mounted) {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    targetRole?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const supabase = requireSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (!data.user) throw new Error('Supabase did not return an authenticated user.');

      const profile = await databaseService.getProfileByUserId(data.user.id);
      if (!profile || profile.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error('This account is not provisioned or has been deactivated. Contact your administrator.');
      }
      if (targetRole && profile.role !== targetRole) {
        await supabase.auth.signOut();
        throw new Error(`This account does not have ${targetRole} privileges.`);
      }
      setUser(profile);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unable to sign in.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates: Pick<UserProfile, 'name' | 'phone'>) => {
    if (!user) return;
    const updated = await databaseService.updateProfile(user.id, updates);
    setUser(updated);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const supabase = requireSupabase();
    if (!user) throw new Error('You must be signed in to change your password.');
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (verifyError) throw verifyError;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
