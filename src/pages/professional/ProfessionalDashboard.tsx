import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Wallet, CheckCircle2, Clock, FilePlus, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfessionalDashboard() {
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    pendingPayouts: 0,
    paidPayouts: 0,
  });

  useEffect(() => {
    (async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekAhead = new Date();
      weekAhead.setDate(weekAhead.getDate() + 7);
      const weekEnd = format(weekAhead, 'yyyy-MM-dd');

      const [{ count: todayCount }, { count: weekCount }, { data: payouts }] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('appointment_date', today)
          .lte('appointment_date', weekEnd),
        supabase.from('professional_payouts').select('payout_amount, status'),
      ]);

      const pending = (payouts || []).filter((p) => p.status === 'pendente').reduce((s, p) => s + Number(p.payout_amount), 0);
      const paid = (payouts || []).filter((p) => p.status === 'pago').reduce((s, p) => s + Number(p.payout_amount), 0);

      setStats({
        todayCount: todayCount || 0,
        weekCount: weekCount || 0,
        pendingPayouts: pending,
        paidPayouts: paid,
      });
    })();
  }, []);

  const cards = [
    { label: 'Atendimentos hoje', value: stats.todayCount, icon: Calendar },
    { label: 'Próximos 7 dias', value: stats.weekCount, icon: Clock },
    { label: 'A receber', value: `R$ ${stats.pendingPayouts.toFixed(2)}`, icon: Wallet },
    { label: 'Total pago', value: `R$ ${stats.paidPayouts.toFixed(2)}`, icon: CheckCircle2 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral dos seus atendimentos e repasses</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
