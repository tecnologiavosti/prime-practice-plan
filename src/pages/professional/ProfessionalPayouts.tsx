import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

type Payout = {
  id: string;
  reference_date: string;
  payout_amount: number;
  status: string;
  payment_date: string | null;
  notes: string | null;
};

export default function ProfessionalPayouts() {
  const [items, setItems] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('professional_payouts')
        .select('id, reference_date, payout_amount, status, payment_date, notes')
        .order('reference_date', { ascending: false });
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const totalReceber = items.filter((p) => p.status === 'pendente').reduce((s, p) => s + Number(p.payout_amount), 0);
  const totalPago = items.filter((p) => p.status === 'pago').reduce((s, p) => s + Number(p.payout_amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Repasses</h1>
        <p className="text-sm text-muted-foreground">Extrato individual de consultas e pagamentos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">R$ {totalReceber.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">R$ {totalPago.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Extrato de consultas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum repasse registrado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referência</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{format(new Date(p.reference_date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">R$ {Number(p.payout_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'pago' ? 'default' : 'secondary'}>
                        {p.status === 'pago' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.payment_date ? format(new Date(p.payment_date + 'T00:00:00'), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.notes || '—'}</TableCell>
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
