import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Search, FileText } from 'lucide-react';

interface Patient {
  id: string;
  full_name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
}

export default function Prontuarios() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, cpf, phone, email')
        .eq('active', true)
        .order('full_name');
      setPatients(data || []);

      const { data: anam } = await supabase.from('anamnesis').select('patient_id');
      const c: Record<string, number> = {};
      (anam || []).forEach((a: any) => {
        c[a.patient_id] = (c[a.patient_id] || 0) + 1;
      });
      setCounts(c);
      setLoading(false);
    })();
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      (p.cpf || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Prontuários</h1>
        <p className="text-muted-foreground">
          Acesse o prontuário completo dos pacientes
        </p>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF ou email..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Registros</TableHead>
              <TableHead className="w-[160px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">Nenhum paciente encontrado</TableCell></TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.cpf || '—'}</TableCell>
                  <TableCell>{p.phone || p.email || '—'}</TableCell>
                  <TableCell>{counts[p.id] || 0}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/admin/prontuarios/${p.id}`)}>
                      <FileText className="h-4 w-4 mr-1" />
                      Abrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
