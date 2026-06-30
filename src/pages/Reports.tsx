import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileBarChart, FileText } from 'lucide-react';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear, format,
} from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '@/lib/pdfHeader';

type Preset = 'dia' | 'semana' | 'mes' | 'ano' | 'personalizado';

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

const fmtDate = (d: string | null) => (d ? format(new Date(d + 'T00:00:00'), 'dd/MM/yyyy') : '—');

function toCSV(rows: any[], headers: { key: string; label: string }[]) {
  const head = headers.map((h) => `"${h.label}"`).join(';');
  const body = rows
    .map((r) =>
      headers
        .map((h) => {
          const v = r[h.key];
          if (v == null) return '';
          if (typeof v === 'number') return String(v).replace('.', ',');
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(';')
    )
    .join('\n');
  return head + '\n' + body;
}

function downloadCSV(name: string, csv: string) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(opts: {
  title: string;
  period: string;
  fileName: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string }[];
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = await addClinicHeader(doc, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(opts.title, 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Período: ${opts.period}`, 14, y);
  y += 5;

  if (opts.summary?.length) {
    const summaryRows = opts.summary.map((s) => [s.label, s.value]);
    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Valor']],
      body: summaryRows,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 122, 109] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  autoTable(doc, {
    startY: y,
    head: [opts.headers],
    body: opts.rows,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [16, 122, 109] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${opts.fileName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export default function Reports() {
  const [preset, setPreset] = useState<Preset>('mes');
  const today = new Date();
  const [from, setFrom] = useState<string>(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [to, setTo] = useState<string>(format(endOfMonth(today), 'yyyy-MM-dd'));

  const applyPreset = (p: Preset) => {
    setPreset(p);
    const n = new Date();
    if (p === 'dia') {
      setFrom(format(startOfDay(n), 'yyyy-MM-dd'));
      setTo(format(endOfDay(n), 'yyyy-MM-dd'));
    } else if (p === 'semana') {
      setFrom(format(startOfWeek(n, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setTo(format(endOfWeek(n, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (p === 'mes') {
      setFrom(format(startOfMonth(n), 'yyyy-MM-dd'));
      setTo(format(endOfMonth(n), 'yyyy-MM-dd'));
    } else if (p === 'ano') {
      setFrom(format(startOfYear(n), 'yyyy-MM-dd'));
      setTo(format(endOfYear(n), 'yyyy-MM-dd'));
    }
  };

  // Data
  const [loading, setLoading] = useState(false);
  const [receivable, setReceivable] = useState<any[]>([]);
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [administrators, setAdministrators] = useState<any[]>([]);
  const [insAdminMap, setInsAdminMap] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [specInsMap, setSpecInsMap] = useState<any[]>([]);
  const [insurances, setInsurances] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [ft, cf, ap, ad, iam, sp, shi, hi] = await Promise.all([
        supabase
          .from('financial_transactions')
          .select('id, transaction_type, description, amount, due_date, payment_date, status, patient:patients(full_name), professional:professionals(full_name), health_insurance:health_insurances(name)')
          .or(`due_date.gte.${from},payment_date.gte.${from}`)
          .order('due_date', { ascending: false }),
        supabase
          .from('cash_flow_entries')
          .select('id, entry_type, category, description, amount, entry_date')
          .gte('entry_date', from)
          .lte('entry_date', to)
          .order('entry_date', { ascending: false }),
        supabase
          .from('appointments')
          .select('id, appointment_date, start_time, status, consultation_type, custom_amount, patient:patients(full_name), professional:professionals(full_name), procedure:procedures(name, private_price), health_insurance:health_insurances(name), administrator:administrators(name)')
          .gte('appointment_date', from)
          .lte('appointment_date', to)
          .order('appointment_date', { ascending: false }),
        supabase.from('administrators').select('id, name, active'),
        supabase.from('insurance_administrators_map').select('insurance_id, administrator_id, billing_rate'),
        supabase.from('specialties').select('id, name, active'),
        supabase.from('specialty_health_insurances').select('specialty_id, health_insurance_id, administrator_id'),
        supabase.from('health_insurances').select('id, name'),
      ]);
      setReceivable((ft.data || []).filter((r: any) => {
        const d = r.payment_date || r.due_date;
        return d && d >= from && d <= to;
      }));
      setCashflow(cf.data || []);
      setAppointments(ap.data || []);
      setAdministrators(ad.data || []);
      setInsAdminMap(iam.data || []);
      setSpecialties(sp.data || []);
      setSpecInsMap(shi.data || []);
      setInsurances(hi.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  const insById = useMemo(() => Object.fromEntries(insurances.map((i) => [i.id, i.name])), [insurances]);
  const admById = useMemo(() => Object.fromEntries(administrators.map((a) => [a.id, a.name])), [administrators]);

  // Receivable totals
  const recTotals = useMemo(() => {
    const r = { total: 0, pago: 0, pendente: 0, cancelado: 0, particular: 0, convenio: 0 };
    receivable.forEach((t) => {
      const v = Number(t.amount || 0);
      r.total += v;
      r[t.status as 'pago' | 'pendente' | 'cancelado'] += v;
      r[t.transaction_type as 'particular' | 'convenio'] += v;
    });
    return r;
  }, [receivable]);

  // Cash flow totals
  const cfTotals = useMemo(() => {
    let inAmt = 0, outAmt = 0;
    cashflow.forEach((c) => {
      const v = Number(c.amount || 0);
      if (c.entry_type === 'entrada') inAmt += v; else outAmt += v;
    });
    return { inAmt, outAmt, saldo: inAmt - outAmt };
  }, [cashflow]);

  // Appointment metrics
  const apMetrics = useMemo(() => {
    const m = { total: appointments.length, finalizado: 0, agendado: 0, cancelado: 0, faltou: 0, valor: 0 };
    appointments.forEach((a) => {
      m[a.status as keyof typeof m] = ((m[a.status as keyof typeof m] as number) || 0) + 1;
      const val = Number(a.custom_amount ?? a.procedure?.private_price ?? 0);
      if (a.status === 'finalizado') m.valor += val;
    });
    return m;
  }, [appointments]);

  // Admin x Convenios summary
  const adminInsSummary = useMemo(() => {
    return administrators.map((a) => {
      const links = insAdminMap.filter((m) => m.administrator_id === a.id);
      return {
        name: a.name,
        convenios: links.length,
        media: links.length ? links.reduce((s, l) => s + Number(l.billing_rate || 0), 0) / links.length : 0,
        items: links.map((l) => ({
          convenio: insById[l.insurance_id] || '—',
          valor: Number(l.billing_rate || 0),
        })),
      };
    });
  }, [administrators, insAdminMap, insById]);

  // Especialidades x Convenios x Administradoras
  const specSummary = useMemo(() => {
    return specialties.map((s) => {
      const links = specInsMap.filter((m) => m.specialty_id === s.id);
      return {
        name: s.name,
        active: s.active,
        items: links.map((l) => ({
          convenio: insById[l.health_insurance_id] || '—',
          administradora: l.administrator_id ? admById[l.administrator_id] || '—' : '—',
        })),
      };
    });
  }, [specialties, specInsMap, insById, admById]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Relatórios</h1>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {(['dia', 'semana', 'mes', 'ano', 'personalizado'] as Preset[]).map((p) => (
            <Button key={p} size="sm" variant={preset === p ? 'default' : 'outline'} onClick={() => applyPreset(p)}>
              {p[0].toUpperCase() + p.slice(1)}
            </Button>
          ))}
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={from} onChange={(e) => { setPreset('personalizado'); setFrom(e.target.value); }} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={to} onChange={(e) => { setPreset('personalizado'); setTo(e.target.value); }} className="h-9" />
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="receber">
        <TabsList className="flex-wrap">
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="caixa">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="admins">Administradoras x Convênios</TabsTrigger>
          <TabsTrigger value="especialidades">Especialidades</TabsTrigger>
        </TabsList>

        {/* RECEIVABLE */}
        <TabsContent value="receber" className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <Stat label="Total" value={fmtBRL(recTotals.total)} />
            <Stat label="Pago" value={fmtBRL(recTotals.pago)} />
            <Stat label="Pendente" value={fmtBRL(recTotals.pendente)} />
            <Stat label="Cancelado" value={fmtBRL(recTotals.cancelado)} />
            <Stat label="Particular" value={fmtBRL(recTotals.particular)} />
            <Stat label="Convênio" value={fmtBRL(recTotals.convenio)} />
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Lançamentos ({receivable.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCSV('contas-a-receber', toCSV(
                receivable.map((r) => ({
                  descricao: r.description,
                  tipo: r.transaction_type,
                  status: r.status,
                  paciente: r.patient?.full_name || '',
                  profissional: r.professional?.full_name || '',
                  convenio: r.health_insurance?.name || '',
                  vencimento: r.due_date || '',
                  pagamento: r.payment_date || '',
                  valor: Number(r.amount || 0),
                })),
                [
                  { key: 'descricao', label: 'Descrição' },
                  { key: 'tipo', label: 'Tipo' },
                  { key: 'status', label: 'Status' },
                  { key: 'paciente', label: 'Paciente' },
                  { key: 'profissional', label: 'Profissional' },
                  { key: 'convenio', label: 'Convênio' },
                  { key: 'vencimento', label: 'Vencimento' },
                  { key: 'pagamento', label: 'Pagamento' },
                  { key: 'valor', label: 'Valor' },
                ]
              ))}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Convênio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivable.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.description}</TableCell>
                      <TableCell className="capitalize">{r.transaction_type}</TableCell>
                      <TableCell>{r.patient?.full_name || '—'}</TableCell>
                      <TableCell>{r.health_insurance?.name || '—'}</TableCell>
                      <TableCell className="capitalize">{r.status}</TableCell>
                      <TableCell>{fmtDate(r.payment_date || r.due_date)}</TableCell>
                      <TableCell className="text-right">{fmtBRL(Number(r.amount))}</TableCell>
                    </TableRow>
                  ))}
                  {!receivable.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Sem dados no período</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CASH FLOW */}
        <TabsContent value="caixa" className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Entradas" value={fmtBRL(cfTotals.inAmt)} />
            <Stat label="Saídas" value={fmtBRL(cfTotals.outAmt)} />
            <Stat label="Saldo" value={fmtBRL(cfTotals.saldo)} />
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Movimentações ({cashflow.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCSV('fluxo-caixa', toCSV(
                cashflow.map((c) => ({ ...c, valor: Number(c.amount) })),
                [
                  { key: 'entry_date', label: 'Data' },
                  { key: 'entry_type', label: 'Tipo' },
                  { key: 'category', label: 'Categoria' },
                  { key: 'description', label: 'Descrição' },
                  { key: 'valor', label: 'Valor' },
                ]
              ))}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashflow.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{fmtDate(c.entry_date)}</TableCell>
                      <TableCell className="capitalize">{c.entry_type}</TableCell>
                      <TableCell>{c.category}</TableCell>
                      <TableCell>{c.description}</TableCell>
                      <TableCell className={`text-right ${c.entry_type === 'saida' ? 'text-red-600' : 'text-emerald-600'}`}>{fmtBRL(Number(c.amount))}</TableCell>
                    </TableRow>
                  ))}
                  {!cashflow.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sem dados</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPOINTMENTS */}
        <TabsContent value="agendamentos" className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <Stat label="Total" value={String(apMetrics.total)} />
            <Stat label="Finalizados" value={String(apMetrics.finalizado || 0)} />
            <Stat label="Agendados" value={String(apMetrics.agendado || 0)} />
            <Stat label="Cancelados" value={String(apMetrics.cancelado || 0)} />
            <Stat label="Faltas" value={String(apMetrics.faltou || 0)} />
            <Stat label="Faturado" value={fmtBRL(apMetrics.valor)} />
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Atendimentos ({appointments.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCSV('agendamentos', toCSV(
                appointments.map((a) => ({
                  data: a.appointment_date,
                  hora: a.start_time,
                  paciente: a.patient?.full_name || '',
                  profissional: a.professional?.full_name || '',
                  procedimento: a.procedure?.name || '',
                  tipo: a.consultation_type,
                  convenio: a.health_insurance?.name || '',
                  administradora: a.administrator?.name || '',
                  status: a.status,
                  valor: Number(a.custom_amount ?? a.procedure?.private_price ?? 0),
                })),
                [
                  { key: 'data', label: 'Data' },
                  { key: 'hora', label: 'Hora' },
                  { key: 'paciente', label: 'Paciente' },
                  { key: 'profissional', label: 'Profissional' },
                  { key: 'procedimento', label: 'Procedimento' },
                  { key: 'tipo', label: 'Tipo' },
                  { key: 'convenio', label: 'Convênio' },
                  { key: 'administradora', label: 'Administradora' },
                  { key: 'status', label: 'Status' },
                  { key: 'valor', label: 'Valor' },
                ]
              ))}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Convênio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{fmtDate(a.appointment_date)} {a.start_time?.slice(0, 5)}</TableCell>
                      <TableCell>{a.patient?.full_name || '—'}</TableCell>
                      <TableCell>{a.professional?.full_name || '—'}</TableCell>
                      <TableCell className="capitalize">{a.consultation_type}</TableCell>
                      <TableCell>{a.health_insurance?.name || '—'}{a.administrator?.name ? ` / ${a.administrator.name}` : ''}</TableCell>
                      <TableCell className="capitalize">{a.status}</TableCell>
                      <TableCell className="text-right">{fmtBRL(Number(a.custom_amount ?? a.procedure?.private_price ?? 0))}</TableCell>
                    </TableRow>
                  ))}
                  {!appointments.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Sem dados</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADMIN x CONVENIOS */}
        <TabsContent value="admins" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Administradoras e seus convênios</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                const rows: any[] = [];
                adminInsSummary.forEach((a) => a.items.forEach((it) => rows.push({ administradora: a.name, convenio: it.convenio, valor: it.valor })));
                downloadCSV('administradoras-convenios', toCSV(rows, [
                  { key: 'administradora', label: 'Administradora' },
                  { key: 'convenio', label: 'Convênio' },
                  { key: 'valor', label: 'Valor' },
                ]));
              }}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminInsSummary.map((a) => (
                <div key={a.name} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.convenios} convênios · média {fmtBRL(a.media)}</div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Convênio</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {a.items.map((it, i) => (
                        <TableRow key={i}>
                          <TableCell>{it.convenio}</TableCell>
                          <TableCell className="text-right">{fmtBRL(it.valor)}</TableCell>
                        </TableRow>
                      ))}
                      {!a.items.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-3">Sem convênios vinculados</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPECIALTIES */}
        <TabsContent value="especialidades" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Especialidades, convênios e administradoras</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                const rows: any[] = [];
                specSummary.forEach((s) => s.items.forEach((it) => rows.push({ especialidade: s.name, convenio: it.convenio, administradora: it.administradora })));
                downloadCSV('especialidades', toCSV(rows, [
                  { key: 'especialidade', label: 'Especialidade' },
                  { key: 'convenio', label: 'Convênio' },
                  { key: 'administradora', label: 'Administradora' },
                ]));
              }}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {specSummary.map((s) => (
                <div key={s.name} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.items.length} vínculos</div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Convênio</TableHead><TableHead>Administradora</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {s.items.map((it, i) => (
                        <TableRow key={i}>
                          <TableCell>{it.convenio}</TableCell>
                          <TableCell>{it.administradora}</TableCell>
                        </TableRow>
                      ))}
                      {!s.items.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-3">Sem vínculos</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading && <div className="text-xs text-muted-foreground">Carregando…</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-base font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
