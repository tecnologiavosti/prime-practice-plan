import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Cache = Record<string, any>;
const cache: Cache = {};
const listeners = new Set<() => void>();
let loaded = false;
let loading: Promise<void> | null = null;

async function loadAll() {
  if (loading) return loading;
  loading = (async () => {
    const { data, error } = await supabase.from('site_content').select('key, value');
    if (!error && data) {
      for (const row of data as any[]) cache[row.key] = row.value;
    }
    loaded = true;
    listeners.forEach((l) => l());
  })();
  return loading;
}

export function useSiteContent<T = any>(key: string, fallback: T): { value: T; loading: boolean } {
  const [, force] = useState(0);
  const [isLoading, setIsLoading] = useState(!loaded);

  useEffect(() => {
    const notify = () => force((n) => n + 1);
    listeners.add(notify);
    if (!loaded) {
      loadAll().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
    return () => {
      listeners.delete(notify);
    };
  }, []);

  const value = (cache[key] ?? fallback) as T;
  return { value, loading: isLoading };
}

export async function fetchSiteContent<T = any>(key: string): Promise<T | null> {
  if (!loaded) await loadAll();
  return (cache[key] ?? null) as T | null;
}

export async function saveSiteContent(key: string, value: any) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id ?? null;
  const { error } = await supabase
    .from('site_content')
    .upsert({ key, value, updated_by: uid, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
  cache[key] = value;
  listeners.forEach((l) => l());
}

export function refreshSiteContent() {
  loaded = false;
  loading = null;
  return loadAll();
}
