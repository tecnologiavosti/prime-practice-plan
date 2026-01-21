import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Users, 
  UserCog, 
  Clock, 
  TrendingUp, 
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
    total: 0,
    pending: 0,
    authorized: 0,
    billed: 0,
    totalRequested: 0,
    totalAuthorized: 0,
  });
  const [billingStats, setBillingStats] = useState<BillingStats>({
    openBatches: 0,
    sentBatches: 0,
    receivedAmount: 0,
    pendingAmount: 0,
  });
  const [payoutStats, setPayoutStats] = useState<PayoutStats>({
    pendingPayouts: 0,
    pendingAmount: 0,
    paidThisMonth: 0,
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

    // Recent guides
    const { data: guides } = await supabase
      .from('medical_guides')
      .select('id, guide_number, status, guide_date, total_value, patient:patients(full_name)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (guides) {
      guides.forEach(g => {
        activities.push({
          id: g.id,
          type: 'guide',
          title: `Guia ${g.guide_number}`,
          description: (g.patient as any)?.full_name || 'Paciente',
          status: g.status,
          date: g.guide_date,
          amount: Number(g.total_value),
        });
      });
    }

    // Recent appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, status, appointment_date, patient:patients(full_name), professional:professionals(full_name)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (appointments) {
      appointments.forEach(a => {
        activities.push({
          id: a.id,
          type: 'appointment',
          title: `Consulta - ${(a.patient as any)?.full_name || 'Paciente'}`,
          description: (a.professional as any)?.full_name || 'Profissional',
          status: a.status,
          date: a.appointment_date,
        });
      });
    }

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentActivity(activities.slice(0, 8));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      autorizada: { label: 'Autorizada', className: 'bg-green-100 text-green-800' },
      faturada: { label: 'Faturada', className: 'bg-blue-100 text-blue-800' },
      recebida: { label: 'Recebida', className: 'bg-emerald-100 text-emerald-800' },
      agendado: { label: 'Agendado', className: 'bg-blue-100 text-blue-800' },
      confirmado: { label: 'Confirmado', className: 'bg-green-100 text-green-800' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
      finalizado: { label: 'Finalizado', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'guide': return <FileText className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'billing': return <Receipt className="h-4 w-4" />;
      case 'payout': return <Wallet className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const basicCards = [
    {
      title: 'Pacientes Ativos',
      value: stats.totalPatients,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgGlow: 'bg-blue-500/10',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Profissionais Ativos',
      value: stats.totalProfessionals,
      icon: UserCog,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGlow: 'bg-emerald-500/10',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Consultas Hoje',
      value: stats.todayAppointments,
      icon: Calendar,
      gradient: 'from-violet-500 to-violet-600',
      bgGlow: 'bg-violet-500/10',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Agendamentos Pendentes',
      value: stats.pendingAppointments,
      icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      bgGlow: 'bg-amber-500/10',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">Sistema operacional</span>
        </div>
      </div>

      {/* Basic Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {basicCards.map((card, index) => (
          <Card 
            key={card.title} 
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 ${card.bgGlow} opacity-50 group-hover:opacity-70 transition-opacity`} />
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2 pt-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-xl p-2.5 ${card.iconBg} transition-transform group-hover:scale-110`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="relative pb-5">
              <div className="text-4xl font-bold tracking-tight">
                {loading ? <div className="h-10 w-16 bg-muted animate-pulse rounded" /> : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guias do Mês Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Guias do Mês
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <p className="text-2xl font-bold">{loading ? '...' : guideStats.total}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                </div>
                <p className="text-2xl font-bold">{loading ? '...' : guideStats.pending}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Autorizadas</span>
                </div>
                <p className="text-2xl font-bold">{loading ? '...' : guideStats.authorized}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Faturadas</span>
                </div>
                <p className="text-2xl font-bold">{loading ? '...' : guideStats.billed}</p>
              </div>
            </div>
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor Solicitado</span>
                <span className="font-semibold text-lg">{loading ? '...' : formatCurrency(guideStats.totalRequested)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor Autorizado</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg text-green-600">{loading ? '...' : formatCurrency(guideStats.totalAuthorized)}</span>
                  {!loading && guideStats.totalRequested > 0 && (
                    <Badge className="bg-green-100 text-green-700">
                      {((guideStats.totalAuthorized / guideStats.totalRequested) * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faturamento e Repasses */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Faturamento & Repasses
            </CardTitle>
            <p className="text-sm text-muted-foreground">Resumo financeiro do mês</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Faturamento */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  Faturamento
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Lotes Abertos</p>
                  <p className="text-xl font-bold">{loading ? '...' : billingStats.openBatches}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lotes Enviados</p>
                  <p className="text-xl font-bold">{loading ? '...' : billingStats.sentBatches}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">A Receber</p>
                  <p className="text-lg font-semibold text-amber-600">{loading ? '...' : formatCurrency(billingStats.pendingAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recebido</p>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <p className="text-lg font-semibold text-green-600">{loading ? '...' : formatCurrency(billingStats.receivedAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Repasses */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/10 border border-violet-200/50 dark:border-violet-800/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-violet-600" />
                  Repasses a Profissionais
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Pendentes</p>
                  <p className="text-xl font-bold">{loading ? '...' : payoutStats.pendingPayouts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Pendente</p>
                  <div className="flex items-center gap-1">
                    <ArrowDownRight className="h-4 w-4 text-amber-500" />
                    <p className="text-lg font-semibold text-amber-600">{loading ? '...' : formatCurrency(payoutStats.pendingAmount)}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Pago este mês</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <p className="text-lg font-semibold text-green-600">{loading ? '...' : formatCurrency(payoutStats.paidThisMonth)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma atividade recente</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {activity.amount !== undefined && (
                      <span className="font-medium text-sm">{formatCurrency(activity.amount)}</span>
                    )}
                    {getStatusBadge(activity.status)}
                    <span className="text-xs text-muted-foreground">
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
