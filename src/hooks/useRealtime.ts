import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Tables mirrored on the supabase_realtime publication
const REALTIME_TABLES = [
  'appointments','appointment_sessions','patients','professionals','rooms',
  'medical_guides','medical_guide_items','medical_guide_documents',
  'financial_transactions','cash_flow_entries','professional_payouts',
  'insurance_reimbursements','billing_batches','billing_batch_guides',
  'health_insurances','administrators','insurance_administrators_map',
  'procedures','procedure_insurance_prices','specialties','specialty_health_insurances',
  'professional_insurances','professional_fees','professional_schedules',
  'professional_special_periods','schedule_blocks','patient_documents',
  'patient_packages','private_packages','package_sections','package_procedures',
  'anamnesis','anamnesis_attachments','notifications','clinic_settings',
  'blog_posts','seo_settings','subleased_rooms','payment_methods','user_roles',
];

const EVENT = 'db:changed';
let started = false;

/** Mounts once at app root. Subscribes to all tables and dispatches window events. */
export function GlobalRealtimeBridge() {
  useEffect(() => {
    if (started) return;
    started = true;
    const channel = supabase.channel('global-realtime-bridge');
    REALTIME_TABLES.forEach((table) => {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        (payload: any) => {
          window.dispatchEvent(new CustomEvent(EVENT, { detail: { table, payload } }));
        }
      );
    });
    channel.subscribe();
    return () => { started = false; supabase.removeChannel(channel); };
  }, []);
  return null;
}

/** Re-runs `fn` (debounced) whenever any of the given tables change in the DB. */
export function useRealtime(tables: string | string[], fn: () => void) {
  const cbRef = useRef(fn);
  cbRef.current = fn;

  useEffect(() => {
    const list = Array.isArray(tables) ? tables : [tables];
    if (list.length === 0) return;
    let timer: any;
    const handler = (e: Event) => {
      const t = (e as CustomEvent).detail?.table;
      if (!t || list.includes(t)) {
        clearTimeout(timer);
        timer = setTimeout(() => cbRef.current?.(), 250);
      }
    };
    window.addEventListener(EVENT, handler as EventListener);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(EVENT, handler as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(tables) ? tables.join('|') : tables]);
}
