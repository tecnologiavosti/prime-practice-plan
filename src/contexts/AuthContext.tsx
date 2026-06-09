import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'administrador' | 'recepcao' | 'profissional' | 'financeiro';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  allowedModules: string[] | null; // null = not loaded yet, [] = no row, list = explicit
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [allowedModules, setAllowedModules] = useState<string[] | null>(null);

  const fetchAllowedModules = async (email: string | null | undefined) => {
    if (!email) return [];
    const { data } = await supabase
      .from('authorized_admins')
      .select('allowed_modules')
      .ilike('email', email)
      .maybeSingle();
    return ((data as any)?.allowed_modules as string[]) ?? [];
  };

  const provisionCurrentSignup = async (account: { email: string; fullName: string; cpf?: string | null }) => {
    const { error } = await (supabase.rpc as any)('provision_current_user_signup', {
      p_email: account.email,
      p_full_name: account.fullName,
      p_cpf: account.cpf ?? null,
    });

    if (error) {
      throw error;
    }
  };

  const fetchUserRoles = async (userId: string, currentUser?: User | null) => {
    let { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (!error && (!data || data.length === 0) && currentUser?.id === userId) {
      try {
        await provisionCurrentSignup({
          email: currentUser.email ?? '',
          fullName: (currentUser.user_metadata?.full_name as string | undefined) ?? 'Sem nome',
          cpf: (currentUser.user_metadata?.cpf as string | undefined) ?? null,
        });

        const retry = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        data = retry.data;
        error = retry.error;
      } catch (provisionError) {
        console.error('Error provisioning roles:', provisionError);
      }
    }

    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }

    return data.map((r) => r.role as AppRole);
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            if (!mounted) return;
            Promise.all([
              fetchUserRoles(session.user.id, session.user),
              fetchAllowedModules(session.user.email),
            ]).then(([r, mods]) => {
              if (mounted) {
                setRoles(r);
                setAllowedModules(mods);
                setLoading(false);
              }
            });
          }, 0);
        } else {
          setRoles([]);
          setAllowedModules(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        Promise.all([
          fetchUserRoles(session.user.id, session.user),
          fetchAllowedModules(session.user.email),
        ]).then(([r, mods]) => {
          if (mounted) {
            setRoles(r);
            setAllowedModules(mods);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        full_name: fullName,
        email: email,
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setAllowedModules(null);
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const hasAnyRole = () => roles.length > 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        allowedModules,
        signIn,
        signUp,
        signOut,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
