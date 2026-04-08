import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  signUp: (email: string, password: string, fullName: string, cpf: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isPatient: boolean;
  isAdmin: boolean;
  isPending: boolean;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

export const PatientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [isPatient, setIsPatient] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const fetchPatientProfile = async (userId: string) => {
    // Check all user roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles = rolesData?.map(r => r.role) || [];
    const hasPatientRole = roles.includes('paciente');
    const hasAdminRole = roles.includes('administrador') || roles.includes('recepcao') || roles.includes('profissional') || roles.includes('financeiro');

    setIsAdmin(hasAdminRole);
    setIsPatient(hasPatientRole);

    if (hasPatientRole) {
      // Fetch patient profile
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, full_name, email, phone, cpf, birth_date, health_insurance_id, active')
        .eq('user_id', userId)
        .single();

      if (patientData) {
        setPatientProfile(patientData);
        setIsPending(!patientData.active);
      } else {
        setIsPending(false);
      }
    } else {
      setPatientProfile(null);
      setIsPending(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchPatientProfile(session.user.id);
          }, 0);
        } else {
          setIsPatient(false);
          setIsAdmin(false);
          setPatientProfile(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchPatientProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, cpf: string) => {
    const redirectUrl = `${window.location.origin}/paciente`;
    
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
      // Create patient record linked to user
      const { error: patientError } = await supabase.from('patients').insert({
        user_id: data.user.id,
        full_name: fullName,
        email: email,
        cpf: cpf,
      });

      if (patientError) {
        console.error('Error creating patient:', patientError);
      }

      // Assign patient role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'paciente',
      });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }
    }

    return { error };
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
        isPending,
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
