import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Users, 
  UserCog, 
  Clock, 
  Activity,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Stats {
  totalPatients: number;
  totalProfessionals: number;
  todayAppointments: number;
  pendingAppointments: number;
}

interface GuideStats {
  total: number;
  pending: number;
  authorized: number;
  billed: number;
  totalRequested: number;
  totalAuthorized: number;
}

interface BillingStats {
  openBatches: number;
  sentBatches: number;
  receivedAmount: number;
  pendingAmount: number;
}

interface PayoutStats {
  pendingPayouts: number;
  pendingAmount: number;
  paidThisMonth: number;
}

interface RecentActivity {
  id: string;
  type: 'guide' | 'appointment' | 'billing' | 'payout';
  title: string;
  description: string;
  status: string;
  date: string;
  amount?: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalProfessionals: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
  });
  const [guideStats, setGuideStats] = useState<GuideStats>({
    total: 0, pending: 0, authorized: 0, billed: 0, totalRequested: 0, totalAuthorized: 0,
  });
  const [billingStats, setBillingStats] = useState<BillingStats>({
    openBatches: 0, sentBatches: 0, receivedAmount: 0, pendingAmount: 0,
  });
  const [payoutStats, setPayoutStats] = useState<PayoutStats>({
    pendingPayouts: 0, pendingAmount: 0, paidThisMonth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchBasicStats(),
      fetchGuideStats(),
      fetchBillingStats(),
      fetchPayoutStats(),
      fetchRecentActivity(),
    ]);
    setLoading(false);
  };

  const fetchBasicStats = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [patients, professionals, todayAppts, pending] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'agendado'),
    ]);
    setStats({
      totalPatients: patients.count || 0,
      totalProfessionals: professionals.count || 0,
      todayAppointments: todayAppts.count || 0,
      pendingAppointments: pending.count || 0,
    });
  };

  const fetchGuideStats = async () => {
    const { data: guides } = await supabase
      .from('medical_guides')
      .select('status, total_value')
      .gte('guide_date', monthStart)
      .lte('guide_date', monthEnd);
    if (guides) {
      const pending = guides.filter(g => g.status === 'pendente');
      const authorized = guides.filter(g => g.status === 'autorizada');
      const billed = guides.filter(g => g.status === 'faturada' || g.status === 'recebida');
      setGuideStats({
        total: guides.length,
        pending: pending.length,
        authorized: authorized.length,
        billed: billed.length,
        totalRequested: guides.reduce((sum, g) => sum + Number(g.total_value || 0), 0),
        totalAuthorized: [...authorized, ...billed].reduce((sum, g) => sum + Number(g.total_value || 0), 0),
      });
    }
  };

  const fetchBillingStats = async () => {
    const { data: batches } = await supabase
      .from('billing_batches')
      .select('status, total_amount')
      .gte('created_at', monthStart);
    if (batches) {
      const open = batches.filter(b => b.status === 'aberto');
      const sent = batches.filter(b => b.status === 'enviado');
      const received = batches.filter(b => b.status === 'recebido');
      const pending = batches.filter(b => b.status !== 'recebido');
      setBillingStats({
        openBatches: open.length,
        sentBatches: sent.length,
        receivedAmount: received.reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
        pendingAmount: pending.reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
      });
    }
  };

  const fetchPayoutStats = async () => {
    const { data: payouts } = await supabase
      .from('professional_payouts')
      .select('status, payout_amount, payment_date')
      .gte('reference_date', monthStart);
    if (payouts) {
      const pending = payouts.filter(p => p.status === 'pendente');
      const paidThisMonth = payouts.filter(p => p.status === 'pago');
      setPayoutStats({
        pendingPayouts: pending.length,
        pendingAmount: pending.reduce((sum, p) => sum + Number(p.payout_amount || 0), 0),
        paidThisMonth: paidThisMonth.reduce((sum, p) => sum + Number(p.payout_amount || 0), 0),
      });
    }
  };

  const fetchRecentActivity = async () => {
    const activities: RecentActivity[] = [];
    const { data: guides } = await supabase
      .from('medical_guides')
      .select('id, guide_number, status, guide_date, total_value, patient:patients(full_name)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (guides) {
      guides.forEach(g => {
        activities.push({
          id: g.id, type: 'guide',
          title: `Guia ${g.guide_number}`,
          description: (g.patient as any)?.full_name || 'Paciente',
          status: g.status, date: g.guide_date,
          amount: Number(g.total_value),
        });
      });
    }
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, status, appointment_date, patient:patients(full_name), professional:professionals(full_name)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (appointments) {
      appointments.forEach(a => {
        activities.push({
          id: a.id, type: 'appointment',
          title: `Consulta - ${(a.patient as any)?.full_name || 'Paciente'}`,
          description: (a.professional as any)?.full_name || 'Profissional',
          status: a.status, date: a.appointment_date,
        });
      });
    }
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentActivity(activities.slice(0, 8));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pendente: { label: 'Pendente', variant: 'outline' },
      autorizada: { label: 'Autorizada', variant: 'default' },
      faturada: { label: 'Faturada', variant: 'secondary' },
      recebida: { label: 'Recebida', variant: 'default' },
      agendado: { label: 'Agendado', variant: 'outline' },
      confirmado: { label: 'Confirmado', variant: 'default' },
      cancelado: { label: 'Cancelado', variant: 'destructive' },
      finalizado: { label: 'Finalizado', variant: 'secondary' },
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'guide': return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'appointment': return <Calendar className="h-4 w-4 text-muted-foreground" />;
      case 'billing': return <Receipt className="h-4 w-4 text-muted-foreground" />;
      case 'payout': return <Wallet className="h-4 w-4 text-muted-foreground" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const basicCards = [
    { title: 'Pacientes Ativos', value: stats.totalPatients, icon: Users },
    { title: 'Profissionais Ativos', value: stats.totalProfessionals, icon: UserCog },
    { title: 'Consultas Hoje', value: stats.todayAppointments, icon: Calendar },
    { title: 'Pendentes', value: stats.pendingAppointments, icon: Clock },
  ];

  return (
    <div className="p-5 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {basicCards.map((card) => (
          <Card key={card.title} className="shadow-none border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {loading ? <span className="inline-block h-7 w-10 bg-muted animate-pulse rounded" /> : card.value}
                </p>
              </div>
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                <card.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guias & Faturamento */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Guias do Mês */}
        <Card className="shadow-none border">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              Guias do Mês — {format(new Date(), "MMM yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Total', value: guideStats.total, icon: FileText },
                { label: 'Pendentes', value: guideStats.pending, icon: AlertCircle },
                { label: 'Autorizadas', value: guideStats.authorized, icon: CheckCircle2 },
                { label: 'Faturadas', value: guideStats.billed, icon: Receipt },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-md bg-muted/50 border border-border">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-semibold text-foreground mt-0.5">{loading ? '—' : s.value}</p>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor Solicitado</span>
                <span className="font-medium text-foreground">{loading ? '—' : formatCurrency(guideStats.totalRequested)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor Autorizado</span>
                <span className="font-medium text-primary">{loading ? '—' : formatCurrency(guideStats.totalAuthorized)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faturamento & Repasses */}
        <Card className="shadow-none border">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              Faturamento & Repasses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {/* Faturamento */}
            <div className="p-3 rounded-md border border-border">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Faturamento</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Lotes Abertos</p>
                  <p className="text-lg font-semibold">{loading ? '—' : billingStats.openBatches}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Lotes Enviados</p>
                  <p className="text-lg font-semibold">{loading ? '—' : billingStats.sentBatches}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">A Receber</p>
                  <p className="text-sm font-semibold">{loading ? '—' : formatCurrency(billingStats.pendingAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Recebido</p>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                    <p className="text-sm font-semibold text-primary">{loading ? '—' : formatCurrency(billingStats.receivedAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Repasses */}
            <div className="p-3 rounded-md border border-border">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Repasses</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Pendentes</p>
                  <p className="text-lg font-semibold">{loading ? '—' : payoutStats.pendingPayouts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Valor Pendente</p>
                  <p className="text-sm font-semibold">{loading ? '—' : formatCurrency(payoutStats.pendingAmount)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Pago este mês</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <p className="text-sm font-semibold text-primary">{loading ? '—' : formatCurrency(payoutStats.paidThisMonth)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente */}
      <Card className="shadow-none border">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">Nenhuma atividade recente</p>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {activity.amount !== undefined && (
                      <span className="text-xs font-medium text-foreground">{formatCurrency(activity.amount)}</span>
                    )}
                    {getStatusBadge(activity.status)}
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {format(new Date(activity.date + 'T12:00:00'), 'dd/MM', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
