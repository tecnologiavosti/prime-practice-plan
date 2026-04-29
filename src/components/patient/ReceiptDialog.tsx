import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import { addClinicHeader } from '@/lib/pdfHeader';

interface ReceiptData {
  patientName: string;
  professionalName: string;
  procedureName: string;
  consultationType: string;
  insuranceName?: string;
  appointmentDate: string;
  amount: number;
  paymentMethodName: string;
  notes?: string | null;
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData | null;
}

export function ReceiptDialog({ open, onOpenChange, data }: ReceiptDialogProps) {
  if (!data) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formattedDate = format(new Date(data.appointmentDate + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const typeLabel = data.consultationType === 'convenio'
    ? `Convênio${data.insuranceName ? ` (${data.insuranceName})` : ''}`
    : data.consultationType === 'pacote' ? 'Pacote' : 'Particular';

  const generatePDF = async () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = await addClinicHeader(doc, margin);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO DE ATENDIMENTO', 105, y, { align: 'center' });
    y += 12;

    doc.setFontSize(11);

    const addLine = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 55, y);
      y += 8;
    };

    addLine('Paciente', data.patientName);
    addLine('Profissional', data.professionalName);
    addLine('Procedimento', data.procedureName);
    addLine('Tipo', typeLabel);
    addLine('Data', formattedDate);
    addLine('Valor', formatCurrency(data.amount));
    addLine('Pagamento', data.paymentMethodName);

    y += 5;
    doc.line(margin, y, 190, y);
    y += 15;

    doc.setFontSize(10);
    doc.text(`Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 105, y, { align: 'center' });

    doc.save(`recibo_${data.patientName.replace(/\s+/g, '_')}_${data.appointmentDate}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo de Atendimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 border rounded-lg p-6 print:border-none" id="receipt-content">
          <h2 className="text-center text-lg font-bold">RECIBO DE ATENDIMENTO</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Paciente:</span>
              <span>{data.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Profissional:</span>
              <span>{data.professionalName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Procedimento:</span>
              <span>{data.procedureName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tipo:</span>
              <span>{typeLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Data:</span>
              <span>{formattedDate}</span>
            </div>
            <hr />
            <div className="flex justify-between text-base font-bold">
              <span>Valor:</span>
              <span>{formatCurrency(data.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Forma de Pagamento:</span>
              <span>{data.paymentMethodName}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button className="flex-1" onClick={generatePDF}>
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
