import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfessionalOption {
  id: string;
  full_name: string;
  crm: string | null;
  uf_crm: string | null;
  cpf: string | null;
}

interface ProfessionalComboboxProps {
  value: string;
  onChange: (id: string, professional?: ProfessionalOption) => void;
  placeholder?: string;
  /** Optional className applied to the trigger button */
  className?: string;
  /** When true, hides the chevron and search behaves as a filter trigger */
  disabled?: boolean;
}

const formatCrm = (p: ProfessionalOption) => {
  if (!p.crm) return '';
  return p.uf_crm ? `CRM ${p.uf_crm} ${p.crm}` : `CRM ${p.crm}`;
};

export function ProfessionalCombobox({
  value,
  onChange,
  placeholder = 'Buscar por nome ou CRM...',
  className,
  disabled,
}: ProfessionalComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<ProfessionalOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ProfessionalOption | null>(null);

  const debounceRef = useRef<number | null>(null);

  // Debounce 300ms
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebounced(search), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Fetch when popover opens or search changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      let query = supabase
        .from('professionals')
        .select('id, full_name, crm, uf_crm, cpf')
        .eq('active', true)
        .order('full_name')
        .limit(20);

      const term = debounced.trim();
      // Trigger search only with 3+ chars in large bases; below that show top results
      if (term.length >= 3) {
        const safe = term.replace(/[%]/g, '');
        query = query.or(
          `full_name.ilike.%${safe}%,crm.ilike.%${safe}%,cpf.ilike.%${safe.replace(/\D/g, '')}%`,
        );
      }
      const { data, error } = await query;
      if (cancelled) return;
      setResults(error ? [] : ((data as ProfessionalOption[]) || []));
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  // Load selected label
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    (async () => {
      const { data } = await supabase
        .from('professionals')
        .select('id, full_name, crm, uf_crm, cpf')
        .eq('id', value)
        .maybeSingle();
      if (data) setSelected(data as ProfessionalOption);
    })();
  }, [value]);

  const displayLabel = useMemo(() => {
    if (!selected) return '';
    const crm = formatCrm(selected);
    return crm ? `${selected.full_name} • ${crm}` : selected.full_name;
  }, [selected]);

  const handleSelect = (p: ProfessionalOption) => {
    setSelected(p);
    onChange(p.id, p);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate">{displayLabel || placeholder}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite nome ou CRM..."
            className="flex h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum registro encontrado
            </div>
          ) : (
            results.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => handleSelect(p)}
                className={cn(
                  'flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                  value === p.id && 'bg-accent/50',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.full_name}</div>
                  {(p.crm || p.cpf) && (
                    <div className="truncate text-xs text-muted-foreground">
                      {formatCrm(p) || (p.cpf ? `CPF: ${p.cpf}` : '')}
                    </div>
                  )}
                </div>
                {value === p.id && <Check className="ml-2 h-4 w-4 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
