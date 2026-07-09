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
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRealtime } from '@/hooks/useRealtime';

interface Stats { totalPatients: number; totalProfessionals: number; todayAppointments: number; pendingAppointments: number; }
interface GuideStats { total: number; pending: number; authorized: number; billed: number; totalRequested: number; totalAuthorized: number; }
interface BillingStats { openBatches: number; sentBatches: number; receivedAmount: number; pendingAmount: number; }
interface PayoutStats { pendingPayouts: number; pendingAmount: number; paidThisMonth: number; }
interface CashFlowStats { entradas: number; saidas: number; saldo: number; }
interface RecentActivity { id: string; type: 'guide' | 'appointment' | 'billing' | 'payout'; title: string; description: string; status: string; date: string; amount?: number; }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalPatients: 0, totalProfessionals: 0, todayAppointments: 0, pendingAppointments: 0 });
  const [guideStats, setGuideStats] = useState<GuideStats>({ total: 0, pending: 0, authorized: 0, billed: 0, totalRequested: 0, totalAuthorized: 0 });
  const [billingStats, setBillingStats] = useState<BillingStats>({ openBatches: 0, sentBatches: 0, receivedAmount: 0, pendingAmount: 0 });
  const [payoutStats, setPayoutStats] = useState<PayoutStats>({ pendingPayouts: 0, pendingAmount: 0, paidThisMonth: 0 });
  const [cashFlowStats, setCashFlowStats] = useState<CashFlowStats>({ entradas: 0, saidas: 0, saldo: 0 });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  useEffect(() => { fetchAllData(); }, []);
  useRealtime(['appointments','patients','financial_transactions'], () => fetchAllData());

  const fetchAllData = async () => {
    await Promise.all([fetchBasicStats(), fetchGuideStats(), fetchBillingStats(), fetchPayoutStats(), fetchCashFlowStats(), fetchRecentActivity()]);
    setLoading(false);
  };

  const fetchCashFlowStats = async () => {
    const { data } = await supabase.from('cash_flow_entries').select('entry_type, amount').gte('entry_date', monthStart).lte('entry_date', monthEnd);
    if (data) {
      const entradas = data.filter(d => d.entry_type === 'entrada').reduce((s, d) => s + Number(d.amount || 0), 0);
      const saidas = data.filter(d => d.entry_type === 'saida').reduce((s, d) => s + Number(d.amount || 0), 0);
      setCashFlowStats({ entradas, saidas, saldo: entradas - saidas });
    }
  };

  const fetchBasicStats = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [patients, professionals, todayAppts, pending] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'agendado'),
    ]);
    setStats({ totalPatients: patients.count || 0, totalProfessionals: professionals.count || 0, todayAppointments: todayAppts.count || 0, pendingAppointments: pending.count || 0 });
  };

  const fetchGuideStats = async () => {
    const { data: guides } = await supabase.from('medical_guides').select('status, total_value').gte('guide_date', monthStart).lte('guide_date', monthEnd);
    if (guides) {
      const pending = guides.filter(g => g.status === 'pendente');
      const authorized = guides.filter(g => g.status === 'autorizada');
      const billed = guides.filter(g => g.status === 'faturada' || g.status === 'recebida');
      setGuideStats({ total: guides.length, pending: pending.length, authorized: authorized.length, billed: billed.length, totalRequested: guides.reduce((s, g) => s + Number(g.total_value || 0), 0), totalAuthorized: [...authorized, ...billed].reduce((s, g) => s + Number(g.total_value || 0), 0) });
    }
  };

  const fetchBillingStats = async () => {
    const { data: batches } = await supabase.from('billing_batches').select('status, total_amount').gte('created_at', monthStart);
    if (batches) {
      setBillingStats({ openBatches: batches.filter(b => b.status === 'aberto').length, sentBatches: batches.filter(b => b.status === 'enviado').length, receivedAmount: batches.filter(b => b.status === 'recebido').reduce((s, b) => s + Number(b.total_amount || 0), 0), pendingAmount: batches.filter(b => b.status !== 'recebido').reduce((s, b) => s + Number(b.total_amount || 0), 0) });
    }
  };

  const fetchPayoutStats = async () => {
    const { data: payouts } = await supabase.from('professional_payouts').select('status, payout_amount, payment_date').gte('reference_date', monthStart);
    if (payouts) {
      const pending = payouts.filter(p => p.status === 'pendente');
      const paid = payouts.filter(p => p.status === 'pago');
      setPayoutStats({ pendingPayouts: pending.length, pendingAmount: pending.reduce((s, p) => s + Number(p.payout_amount || 0), 0), paidThisMonth: paid.reduce((s, p) => s + Number(p.payout_amount || 0), 0) });
    }
  };

  const fetchRecentActivity = async () => {
    const activities: RecentActivity[] = [];
    const { data: guides } = await supabase.from('medical_guides').select('id, guide_number, status, guide_date, total_value, patient:patients(full_name)').order('created_at', { ascending: false }).limit(5);
    if (guides) guides.forEach(g => activities.push({ id: g.id, type: 'guide', title: `Guia ${g.guide_number}`, description: (g.patient as any)?.full_name || 'Paciente', status: g.status, date: g.guide_date, amount: Number(g.total_value) }));
    const { data: appointments } = await supabase.from('appointments').select('id, status, appointment_date, patient:patients(full_name), professional:professionals(full_name)').order('created_at', { ascending: false }).limit(5);
    if (appointments) appointments.forEach(a => activities.push({ id: a.id, type: 'appointment', title: `Consulta - ${(a.patient as any)?.full_name || 'Paciente'}`, description: (a.professional as any)?.full_name || 'Profissional', status: a.status, date: a.appointment_date }));
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentActivity(activities.slice(0, 8));
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pendente:   { label: 'Pendente',   cls: 'bg-amber-100 text-amber-800 border-amber-200' },
      autorizada: { label: 'Autorizada', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      faturada:   { label: 'Faturada',   cls: 'bg-sky-100 text-sky-800 border-sky-200' },
      recebida:   { label: 'Recebida',   cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      agendado:   { label: 'Agendado',   cls: 'bg-sky-100 text-sky-800 border-sky-200' },
      confirmado: { label: 'Confirmado', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-800 border-red-200' },
      finalizado: { label: 'Finalizado', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      em_atendimento: { label: 'Em Atendimento', cls: 'bg-violet-100 text-violet-800 border-violet-200' },
      faltou:     { label: 'Faltou',     cls: 'bg-red-100 text-red-800 border-red-200' },
    };
    const c = map[status] || { label: status, cls: 'bg-muted text-muted-foreground border-border' };
    return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${c.cls}`}>{c.label}</span>;
  };

  const getActivityIcon = (type: string) => {
    const cls = "h-4 w-4";
    switch (type) {
      case 'guide': return <FileText className={cls} />;
      case 'appointment': return <Calendar className={cls} />;
      case 'billing': return <Receipt className={cls} />;
      case 'payout': return <Wallet className={cls} />;
      default: return <Activity className={cls} />;
    }
  };

  const basicCards = [
    { title: 'Pacientes Ativos', value: stats.totalPatients, icon: Users, color: 'text-sky-600 bg-sky-100' },
    { title: 'Profissionais', value: stats.totalProfessionals, icon: UserCog, color: 'text-emerald-600 bg-emerald-100' },
    { title: 'Consultas Hoje', value: stats.todayAppointments, icon: Calendar, color: 'text-violet-600 bg-violet-100' },
    { title: 'Pendentes', value: stats.pendingAppointments, icon: Clock, color: 'text-amber-600 bg-amber-100' },
  ];

  return (
    <div className="p-5 lg:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {basicCards.map((card) => (
          <Card key={card.title} className="shadow-sm border-t-[3px] border-t-primary">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-extrabold text-foreground">
                  {loading ? <span className="inline-block h-7 w-12 bg-muted animate-pulse rounded" /> : card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guias & Faturamento */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Guias */}
        <Card className="shadow-sm border-t-[3px] border-t-primary">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-sky-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-sky-600" strokeWidth={2} />
              </div>
              Guias do Mês — {format(new Date(), "MMM yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Total', value: guideStats.total, icon: FileText, iconCls: 'text-sky-600 bg-sky-50' },
                { label: 'Pendentes', value: guideStats.pending, icon: AlertCircle, iconCls: 'text-amber-600 bg-amber-50' },
                { label: 'Autorizadas', value: guideStats.authorized, icon: CheckCircle2, iconCls: 'text-emerald-600 bg-emerald-50' },
                { label: 'Faturadas', value: guideStats.billed, icon: Receipt, iconCls: 'text-violet-600 bg-violet-50' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-6 w-6 rounded flex items-center justify-center ${s.iconCls}`}>
                      <s.icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  </div>
                  <p className="text-xl font-extrabold text-foreground">{loading ? '—' : s.value}</p>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Valor Solicitado</span>
                <span className="font-bold text-foreground">{loading ? '—' : formatCurrency(guideStats.totalRequested)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Valor Autorizado</span>
                <span className="font-bold text-emerald-600">{loading ? '—' : formatCurrency(guideStats.totalAuthorized)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faturamento & Repasses */}
        <Card className="shadow-sm border-t-[3px] border-t-primary">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" strokeWidth={2} />
              </div>
              Faturamento & Repasses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {/* Faturamento */}
            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-sky-500" strokeWidth={2} />
                Faturamento
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Lotes Abertos</p>
                  <p className="text-xl font-extrabold text-foreground">{loading ? '—' : billingStats.openBatches}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Lotes Enviados</p>
                  <p className="text-xl font-extrabold text-foreground">{loading ? '—' : billingStats.sentBatches}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">A Receber</p>
                  <p className="text-sm font-bold text-amber-600">{loading ? '—' : formatCurrency(billingStats.pendingAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Recebido</p>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
                    <p className="text-sm font-bold text-emerald-600">{loading ? '—' : formatCurrency(billingStats.receivedAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Repasses */}
            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-violet-500" strokeWidth={2} />
                Repasses
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Pendentes</p>
                  <p className="text-xl font-extrabold text-foreground">{loading ? '—' : payoutStats.pendingPayouts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Valor Pendente</p>
                  <p className="text-sm font-bold text-amber-600">{loading ? '—' : formatCurrency(payoutStats.pendingAmount)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Pago este mês</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
                    <p className="text-sm font-bold text-emerald-600">{loading ? '—' : formatCurrency(payoutStats.paidThisMonth)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo de Caixa */}
      <Card className="shadow-sm border-t-[3px] border-t-primary">
        <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/15 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            Fluxo de Caixa — {format(new Date(), "MMM yyyy", { locale: ptBR })}
          </CardTitle>
          <Link to="/admin/fluxo-caixa" className="text-xs font-semibold text-primary hover:underline">
            Gerenciar →
          </Link>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Entradas</p>
              </div>
              <p className="text-lg font-extrabold text-emerald-700">{loading ? '—' : formatCurrency(cashFlowStats.entradas)}</p>
            </div>
            <div className="p-3 rounded-lg border border-red-200 bg-red-50/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-600" strokeWidth={2} />
                <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">Saídas</p>
              </div>
              <p className="text-lg font-extrabold text-red-700">{loading ? '—' : formatCurrency(cashFlowStats.saidas)}</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" strokeWidth={2} />
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Saldo</p>
              </div>
              <p className={`text-lg font-extrabold ${cashFlowStats.saldo >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {loading ? '—' : formatCurrency(cashFlowStats.saldo)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Atividade Recente */}
      <Card className="shadow-sm border-t-[3px] border-t-primary">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/15 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />)}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">Nenhuma atividade recente</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              {recentActivity.map((activity, idx) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className={`flex items-center justify-between px-3 py-2.5 ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/40'} ${idx !== recentActivity.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {activity.amount !== undefined && (
                      <span className="text-xs font-bold text-foreground tabular-nums">{formatCurrency(activity.amount)}</span>
                    )}
                    {getStatusBadge(activity.status)}
                    <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
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
