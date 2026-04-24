import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

type Patient = {
  id: string;
  full_name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
};

export default function ProfessionalPatients() {
  const [items, setItems] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      // RLS já restringe para pacientes do profissional
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, cpf, phone, email')
        .order('full_name');
      setItems((data as any) || []);
    })();
  }, []);

  const filtered = items.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Pacientes</h1>
          <p className="text-sm text-muted-foreground">Pacientes que você já atendeu</p>
        </div>
        <Input
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[260px]"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{filtered.length} paciente(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell>{p.cpf || '—'}</TableCell>
                    <TableCell>{p.phone || '—'}</TableCell>
                    <TableCell>{p.email || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
