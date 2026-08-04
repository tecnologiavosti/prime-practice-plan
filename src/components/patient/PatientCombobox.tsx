import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PatientOption {
  id: string;
  full_name: string;
  cpf: string | null;
  active?: boolean;
}

interface PatientComboboxProps {
  value: string;
  onChange: (patientId: string, patient?: PatientOption) => void;
  placeholder?: string;
  allowCreate?: boolean;
}

const maskCpf = (cpf?: string | null) => {
  if (!cpf) return '';
  const d = cpf.replace(/\D/g, '');
  if (d.length < 4) return cpf;
  if (d.length === 11) return `***.***.${d.slice(6, 9)}-${d.slice(9)}`;
  return `***${d.slice(-4)}`;
};

export function PatientCombobox({ value, onChange, placeholder = 'Buscar por nome ou CPF...', allowCreate = true }: PatientComboboxProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PatientOption | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name: '', cpf: '', phone: '', email: '' });

  const debounceRef = useRef<number | null>(null);

  // Debounce
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebounced(search), 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [search]);

  // Fetch on debounced change or open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      let query = supabase
        .from('patients')
        .select('id, full_name, cpf, active')
        .order('full_name')
        .limit(100);

      const term = debounced.trim();
      if (term.length > 0) {
        const digits = term.replace(/\D/g, '');
        const hasDigits = digits.length > 0;
        
        // If searching, we don't necessarily need the limit to be as low, 
        // but 100 is still a good safety net.
        if (hasDigits && digits.length === term.replace(/\s/g, '').length) {
          // If the term is only digits (ignoring spaces/formatting), search strictly by CPF
          query = query.ilike('cpf', `%${digits}%`);
        } else {
          // Otherwise, search by name OR by digits in CPF if digits are present
          if (hasDigits) {
            query = query.or(`full_name.ilike.%${term}%,cpf.ilike.%${digits}%`);
          } else {
            query = query.ilike('full_name', `%${term}%`);
          }
        }
      }
      
      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        console.error('Error fetching patients:', error);
        setResults([]);
      } else {
        setResults((data as PatientOption[]) || []);
      }
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [debounced, open]);

  // Load selected patient label when value changes externally
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    if (selected?.id === value) return;
    (async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, cpf, active')
        .eq('id', value)
        .maybeSingle();
      if (data) setSelected(data as PatientOption);
    })();
  }, [value]);

  const displayLabel = useMemo(() => {
    if (selected) {
      return selected.cpf ? `${selected.full_name} • ${maskCpf(selected.cpf)}` : selected.full_name;
    }
    return '';
  }, [selected]);

  const handleSelect = (p: PatientOption) => {
    setSelected(p);
    onChange(p.id, p);
    setOpen(false);
    setSearch('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.full_name.trim()) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nome é obrigatório.' });
      return;
    }
    setCreating(true);
    const payload: any = {
      full_name: newPatient.full_name.trim(),
      cpf: newPatient.cpf.replace(/\D/g, '') || null,
      phone: newPatient.phone || null,
      email: newPatient.email || null,
      active: true,
    };
    const { data, error } = await supabase
      .from('patients')
      .insert(payload)
      .select('id, full_name, cpf, active')
      .single();
    setCreating(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao cadastrar', description: error.message });
      return;
    }
    toast({ title: 'Paciente cadastrado!', description: data.full_name });
    handleSelect(data as PatientOption);
    setCreateOpen(false);
    setNewPatient({ full_name: '', cpf: '', phone: '', email: '' });
  };

  return (
    <>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn('flex-1 justify-between font-normal', !selected && 'text-muted-foreground')}
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
                placeholder="Digite nome ou CPF..."
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
                  Paciente não encontrado
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
                      <div className="truncate font-medium">
                        {p.full_name} {!p.active && <span className="text-[10px] bg-muted px-1 rounded ml-1 text-muted-foreground uppercase">Inativo</span>}
                      </div>
                      {p.cpf && (
                        <div className="truncate text-xs text-muted-foreground">CPF: {maskCpf(p.cpf)}</div>
                      )}
                    </div>
                    {value === p.id && <Check className="ml-2 h-4 w-4 shrink-0" />}
                  </button>
                ))
              )}
            </div>
            {allowCreate && (
              <div className="border-t p-1">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setCreateOpen(true); }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-primary hover:bg-accent"
                >
                  <Plus className="h-4 w-4" /> Novo Paciente
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        {allowCreate && (
          <Button type="button" variant="outline" size="icon" onClick={() => setCreateOpen(true)} title="Novo paciente">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {allowCreate && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Paciente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <Label>Nome Completo *</Label>
                <Input
                  value={newPatient.full_name}
                  onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>CPF</Label>
                <Input
                  value={newPatient.cpf}
                  onChange={(e) => setNewPatient({ ...newPatient, cpf: e.target.value })}
                  placeholder="Somente números"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
