import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, UserCog, Clock, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Stats {
  totalPatients: number;
  totalProfessionals: number;
  todayAppointments: number;
  pendingAppointments: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalProfessionals: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
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
      setLoading(false);
    };

    fetchStats();
  }, []);

  const cards = [
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

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card 
            key={card.title} 
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background glow */}
            <div className={`absolute inset-0 ${card.bgGlow} opacity-50 group-hover:opacity-70 transition-opacity`} />
            
            {/* Gradient accent line */}
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
                {loading ? (
                  <div className="h-10 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  card.value
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total registrado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions or Additional Info Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Resumo do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border/50">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? '...' : stats.todayAppointments}</p>
                <p className="text-sm text-muted-foreground">Consultas agendadas para hoje</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border/50">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? '...' : stats.pendingAppointments}</p>
                <p className="text-sm text-muted-foreground">Aguardando confirmação</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border/50">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? '...' : stats.totalPatients}</p>
                <p className="text-sm text-muted-foreground">Pacientes na base</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
