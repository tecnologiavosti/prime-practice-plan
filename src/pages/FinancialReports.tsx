import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, DollarSign, Users, Stethoscope, FileDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '@/lib/pdfHeader';

interface ReportData {
  total: number;
  count: number;
  items: any[];
}

type ReportType = 'geral' | 'convenio' | 'profissional' | 'procedimento';

export default function FinancialReports() {
  const [reportType, setReportType] = useState<ReportType>('geral');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [data, setData] = useState<ReportData>({ total: 0, count: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateReport();
  }, [reportType, startDate, endDate]);

  const generateReport = async () => {
    setLoading(true);

    try {
      if (reportType === 'geral') {
        await generateGeneralReport();
      } else if (reportType === 'convenio') {
        await generateInsuranceReport();
      } else if (reportType === 'profissional') {
        await generateProfessionalReport();
      } else if (reportType === 'procedimento') {
        await generateProcedureReport();
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }

    setLoading(false);
  };

  const generateGeneralReport = async () => {
    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    const particular = (transactions || []).filter(t => t.transaction_type === 'particular');
    const convenio = (transactions || []).filter(t => t.transaction_type === 'convenio');
    const pago = (transactions || []).filter(t => t.status === 'pago');
    const pendente = (transactions || []).filter(t => t.status === 'pendente');

    setData({
      total: (transactions || []).reduce((acc, t) => acc + Number(t.amount), 0),
      count: (transactions || []).length,
      items: [
        { label: 'Particular', count: particular.length, total: particular.reduce((acc, t) => acc + Number(t.amount), 0) },
        { label: 'Convênio', count: convenio.length, total: convenio.reduce((acc, t) => acc + Number(t.amount), 0) },
        { label: 'Recebidos', count: pago.length, total: pago.reduce((acc, t) => acc + Number(t.amount), 0) },
        { label: 'Pendentes', count: pendente.length, total: pendente.reduce((acc, t) => acc + Number(t.amount), 0) },
      ],
    });
  };

  const generateInsuranceReport = async () => {
    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        health_insurance:health_insurances(name)
      `)
      .eq('transaction_type', 'convenio')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    const grouped: Record<string, { count: number; total: number; pago: number; pendente: number }> = {};

    (transactions || []).forEach((t: any) => {
      const name = t.health_insurance?.name || 'Sem convênio';
      if (!grouped[name]) {
        grouped[name] = { count: 0, total: 0, pago: 0, pendente: 0 };
      }
      grouped[name].count++;
      grouped[name].total += Number(t.amount);
      if (t.status === 'pago') grouped[name].pago += Number(t.amount);
      if (t.status === 'pendente') grouped[name].pendente += Number(t.amount);
    });

    const items = Object.entries(grouped).map(([label, data]) => ({
      label,
      ...data,
    })).sort((a, b) => b.total - a.total);

    setData({
      total: (transactions || []).reduce((acc, t) => acc + Number(t.amount), 0),
      count: (transactions || []).length,
      items,
    });
  };

  const generateProfessionalReport = async () => {
    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        professional:professionals(full_name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    const grouped: Record<string, { count: number; total: number; particular: number; convenio: number }> = {};

    (transactions || []).forEach((t: any) => {
      const name = t.professional?.full_name || 'Sem profissional';
      if (!grouped[name]) {
        grouped[name] = { count: 0, total: 0, particular: 0, convenio: 0 };
      }
      grouped[name].count++;
      grouped[name].total += Number(t.amount);
      if (t.transaction_type === 'particular') grouped[name].particular += Number(t.amount);
      if (t.transaction_type === 'convenio') grouped[name].convenio += Number(t.amount);
    });

    const items = Object.entries(grouped).map(([label, data]) => ({
      label,
      ...data,
    })).sort((a, b) => b.total - a.total);

    setData({
      total: (transactions || []).reduce((acc, t) => acc + Number(t.amount), 0),
      count: (transactions || []).length,
      items,
    });
  };

  const generateProcedureReport = async () => {
    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        procedure:procedures(name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    const grouped: Record<string, { count: number; total: number }> = {};

    (transactions || []).forEach((t: any) => {
      const name = t.procedure?.name || 'Sem procedimento';
      if (!grouped[name]) {
        grouped[name] = { count: 0, total: 0 };
      }
      grouped[name].count++;
      grouped[name].total += Number(t.amount);
    });

    const items = Object.entries(grouped).map(([label, data]) => ({
      label,
      ...data,
    })).sort((a, b) => b.total - a.total);

    setData({
      total: (transactions || []).reduce((acc, t) => acc + Number(t.amount), 0),
      count: (transactions || []).length,
      items,
    });
  };

  const exportCSV = () => {
    let csv = '';
    
    if (reportType === 'geral') {
      csv = 'Categoria,Quantidade,Total\n';
      data.items.forEach(item => {
        csv += `${item.label},${item.count},${item.total}\n`;
      });
    } else {
      const headers = reportType === 'convenio' 
        ? 'Convênio,Quantidade,Total,Recebido,Pendente\n'
        : reportType === 'profissional'
        ? 'Profissional,Quantidade,Total,Particular,Convênio\n'
        : 'Procedimento,Quantidade,Total\n';
      
      csv = headers;
      data.items.forEach(item => {
        if (reportType === 'convenio') {
          csv += `${item.label},${item.count},${item.total},${item.pago},${item.pendente}\n`;
        } else if (reportType === 'profissional') {
          csv += `${item.label},${item.count},${item.total},${item.particular},${item.convenio}\n`;
        } else {
          csv += `${item.label},${item.count},${item.total}\n`;
        }
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${reportType}_${startDate}_${endDate}.csv`;
    link.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const exportPDF = async () => {
    const doc = new jsPDF();
    let y = await addClinicHeader(doc, 14);

    const titleMap: Record<ReportType, string> = {
      geral: 'Relatório Financeiro Geral',
      convenio: 'Relatório Financeiro por Convênio',
      profissional: 'Relatório Financeiro por Profissional',
      procedimento: 'Relatório Financeiro por Procedimento',
    };

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(titleMap[reportType], 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Período: ${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')}`,
      14,
      y,
    );
    y += 5;
    doc.text(`Total: ${formatCurrency(data.total)}  |  Lançamentos: ${data.count}`, 14, y);
    y += 4;

    let head: string[][] = [];
    let body: (string | number)[][] = [];
    let foot: (string | number)[][] = [];

    if (reportType === 'convenio') {
      head = [['Convênio', 'Qtd', 'Recebido', 'Pendente', 'Total']];
      body = data.items.map((i) => [
        i.label,
        i.count,
        formatCurrency(i.pago || 0),
        formatCurrency(i.pendente || 0),
        formatCurrency(i.total),
      ]);
      foot = [[
        'Total',
        data.count,
        formatCurrency(data.items.reduce((a, i) => a + (i.pago || 0), 0)),
        formatCurrency(data.items.reduce((a, i) => a + (i.pendente || 0), 0)),
        formatCurrency(data.total),
      ]];
    } else if (reportType === 'profissional') {
      head = [['Profissional', 'Qtd', 'Particular', 'Convênio', 'Total']];
      body = data.items.map((i) => [
        i.label,
        i.count,
        formatCurrency(i.particular || 0),
        formatCurrency(i.convenio || 0),
        formatCurrency(i.total),
      ]);
      foot = [[
        'Total',
        data.count,
        formatCurrency(data.items.reduce((a, i) => a + (i.particular || 0), 0)),
        formatCurrency(data.items.reduce((a, i) => a + (i.convenio || 0), 0)),
        formatCurrency(data.total),
      ]];
    } else {
      head = [[reportType === 'geral' ? 'Categoria' : 'Procedimento', 'Qtd', 'Total']];
      body = data.items.map((i) => [i.label, i.count, formatCurrency(i.total)]);
      foot = [['Total', data.count, formatCurrency(data.total)]];
    }

    autoTable(doc, {
      startY: y + 2,
      head,
      body,
      foot,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 148, 152] },
      footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });

    doc.save(`relatorio_${reportType}_${startDate}_${endDate}.pdf`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
        <p className="text-muted-foreground">Visualize relatórios por período, convênio, profissional ou procedimento</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="convenio">Por Convênio</SelectItem>
                  <SelectItem value="profissional">Por Profissional</SelectItem>
                  <SelectItem value="procedimento">Por Procedimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total do Período</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lançamentos</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">
              {format(new Date(startDate), 'dd/MM/yyyy')} - {format(new Date(endDate), 'dd/MM/yyyy')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {reportType === 'geral' && 'Resumo Geral'}
            {reportType === 'convenio' && 'Por Convênio'}
            {reportType === 'profissional' && 'Por Profissional'}
            {reportType === 'procedimento' && 'Por Procedimento'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : data.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum dado encontrado para o período</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {reportType === 'geral' && 'Categoria'}
                    {reportType === 'convenio' && 'Convênio'}
                    {reportType === 'profissional' && 'Profissional'}
                    {reportType === 'procedimento' && 'Procedimento'}
                  </TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  {reportType === 'convenio' && (
                    <>
                      <TableHead className="text-right">Recebido</TableHead>
                      <TableHead className="text-right">Pendente</TableHead>
                    </>
                  )}
                  {reportType === 'profissional' && (
                    <>
                      <TableHead className="text-right">Particular</TableHead>
                      <TableHead className="text-right">Convênio</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    {reportType === 'convenio' && (
                      <>
                        <TableCell className="text-right text-green-600">{formatCurrency(item.pago)}</TableCell>
                        <TableCell className="text-right text-yellow-600">{formatCurrency(item.pendente)}</TableCell>
                      </>
                    )}
                    {reportType === 'profissional' && (
                      <>
                        <TableCell className="text-right">{formatCurrency(item.particular)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.convenio)}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right font-bold">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">{data.count}</TableCell>
                  {reportType === 'convenio' && (
                    <>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(data.items.reduce((acc, i) => acc + (i.pago || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right font-bold text-yellow-600">
                        {formatCurrency(data.items.reduce((acc, i) => acc + (i.pendente || 0), 0))}
                      </TableCell>
                    </>
                  )}
                  {reportType === 'profissional' && (
                    <>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(data.items.reduce((acc, i) => acc + (i.particular || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(data.items.reduce((acc, i) => acc + (i.convenio || 0), 0))}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-right font-bold">{formatCurrency(data.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
