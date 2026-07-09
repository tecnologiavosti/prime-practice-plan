import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to realtime changes on one or more Postgres tables and calls `onChange`
 * (debounced ~250ms) whenever any INSERT/UPDATE/DELETE happens.
 *
 * Usage:
 *   useRealtime(['appointments','appointment_sessions'], fetchAppointments);
 */
export function useRealtime(tables: string | string[], onChange: () => void) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    const list = Array.isArray(tables) ? tables : [tables];
    if (list.length === 0) return;

    let timer: any;
    const trigger = () => {
      clearTimeout(timer);
      timer = setTimeout(() => cbRef.current?.(), 250);
    };

    const channel = supabase.channel(`rt-${list.join('-')}-${Math.random().toString(36).slice(2, 8)}`);
    list.forEach((table) => {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        trigger
      );
    });
    channel.subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(tables) ? tables.join('|') : tables]);
}
