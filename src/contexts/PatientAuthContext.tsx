import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'administrador' | 'recepcao' | 'profissional' | 'financeiro' | 'paciente';

interface SignUpResult {
  error: Error | null;
  isInvitedAdmin: boolean;
  requiresEmailConfirmation: boolean;
  role: UserRole | null;
}

interface PatientProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  health_insurance_id: string | null;
}

interface PatientAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  patientProfile: PatientProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, cpf?: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  isPatient: boolean;
  isAdmin: boolean;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

export const PatientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [isPatient, setIsPatient] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchRoles = async (userId: string): Promise<UserRole[]> => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    return (data?.map((item) => item.role as UserRole) ?? []);
  };

  const provisionCurrentSignup = async (account: {
    email: string;
    fullName: string;
    cpf?: string | null;
  }): Promise<UserRole | null> => {
    const { data, error } = await (supabase.rpc as any)('provision_current_user_signup', {
      p_email: account.email,
      p_full_name: account.fullName,
      p_cpf: account.cpf ?? null,
    });

    if (error) {
      if (error.message?.includes('CPF_REQUIRED')) {
        throw new Error('Este e-mail não possui autorização administrativa. Se você é da equipe, solicite um convite.');
      }

      throw new Error(error.message || 'Não foi possível concluir seu cadastro.');
    }

    return (data as UserRole | null) ?? null;
  };

  const fetchPatientProfile = async (userId: string) => {
    let roles = await fetchRoles(userId);

    if (roles.length === 0 && user) {
      try {
        await provisionCurrentSignup({
          email: user.email ?? '',
          fullName: (user.user_metadata?.full_name as string | undefined) ?? 'Sem nome',
          cpf: (user.user_metadata?.cpf as string | undefined) ?? null,
        });
        roles = await fetchRoles(userId);
      } catch (error) {
        console.error('Error provisioning signup:', error);
      }
    }

    const hasPatientRole = roles.includes('paciente');
    const hasAdminRole = roles.includes('administrador') || roles.includes('recepcao') || roles.includes('profissional') || roles.includes('financeiro');

    setIsAdmin(hasAdminRole);
    setIsPatient(hasPatientRole);

    if (hasPatientRole) {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, full_name, email, phone, cpf, birth_date, health_insurance_id')
        .eq('user_id', userId)
        .single();

      if (patientData) {
        setPatientProfile(patientData);
      }
    } else {
      setPatientProfile(null);
    }
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
            if (mounted) {
              fetchPatientProfile(session.user.id).then(() => {
                if (mounted) setLoading(false);
              });
            }
          }, 0);
        } else {
          setIsPatient(false);
          setIsAdmin(false);
          setPatientProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchPatientProfile(session.user.id).then(() => {
          if (mounted) setLoading(false);
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

  const signUp = async (email: string, password: string, fullName: string, cpf?: string) => {
    const redirectUrl = `${window.location.origin}/paciente`;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCpf = cpf?.trim() || undefined;

    const { data: inviteCheck, error: inviteError } = await (supabase.rpc as any)('is_authorized_admin_email', {
      _email: normalizedEmail,
    });

    if (inviteError) {
      return {
        error: new Error('Não foi possível validar seu convite agora. Tente novamente.'),
        isInvitedAdmin: false,
        requiresEmailConfirmation: false,
        role: null,
      };
    }

    const isInvitedAdmin = Boolean(inviteCheck);

    if (!isInvitedAdmin && !normalizedCpf) {
      return {
        error: new Error('Este e-mail não possui autorização administrativa. Se você é da equipe, solicite um convite.'),
        isInvitedAdmin,
        requiresEmailConfirmation: false,
        role: null,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          cpf: normalizedCpf ?? null,
        },
      },
    });

    if (error) {
      return {
        error,
        isInvitedAdmin,
        requiresEmailConfirmation: false,
        role: null,
      };
    }

    const requiresEmailConfirmation = !data.session;
    let role: UserRole | null = null;

    if (data.session?.user) {
      try {
        role = await provisionCurrentSignup({
          email: normalizedEmail,
          fullName,
          cpf: normalizedCpf,
        });
      } catch (provisionError) {
        return {
          error: provisionError instanceof Error ? provisionError : new Error('Não foi possível concluir seu cadastro.'),
          isInvitedAdmin,
          requiresEmailConfirmation,
          role: null,
        };
      }
    }

    return { error: null, isInvitedAdmin, requiresEmailConfirmation, role };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPatientProfile(null);
    setIsPatient(false);
    setIsAdmin(false);
  };

  return (
    <PatientAuthContext.Provider
      value={{
        user,
        session,
        loading,
        patientProfile,
        signIn,
        signUp,
        signOut,
        isPatient,
        isAdmin,
      }}
    >
      {children}
    </PatientAuthContext.Provider>
  );
};

export const usePatientAuth = () => {
  const context = useContext(PatientAuthContext);
  if (context === undefined) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
};
