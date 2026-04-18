import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClinicSettings {
  id: string;
  logo_url: string | null;
  nome_fantasia: string;
  razao_social: string | null;
  cnpj: string | null;
  endereco_completo: string | null;
  telefone: string | null;
  email_contato: string | null;
}

let cache: ClinicSettings | null = null;
const listeners = new Set<(s: ClinicSettings | null) => void>();

async function fetchSettings(): Promise<ClinicSettings | null> {
  const { data, error } = await supabase
    .from('clinic_settings')
    .select('id, logo_url, nome_fantasia, razao_social, cnpj, endereco_completo, telefone, email_contato')
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('Error loading clinic settings', error);
    return null;
  }
  cache = data;
  listeners.forEach((l) => l(data));
  return data;
}

export function refreshClinicSettings() {
  return fetchSettings();
}

export function useClinicSettings() {
  const [settings, setSettings] = useState<ClinicSettings | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    listeners.add(setSettings);
    if (!cache) {
      fetchSettings().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  return { settings, loading };
}

export async function getClinicSettings(): Promise<ClinicSettings | null> {
  if (cache) return cache;
  return fetchSettings();
}
