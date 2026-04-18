import jsPDF from 'jspdf';
import logoPacem from '@/assets/logoPacem.png';
import { getClinicSettings } from '@/hooks/useClinicSettings';

async function loadImageAsDataUrl(src: string): Promise<{ dataUrl: string; format: string } | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const format = (blob.type.includes('jpeg') || blob.type.includes('jpg')) ? 'JPEG' : 'PNG';
    return { dataUrl, format };
  } catch (e) {
    console.error('Failed to load logo for PDF', e);
    return null;
  }
}

/**
 * Adds the official clinic header to a jsPDF document.
 * Uses dynamic clinic_settings (logo, name, address, contact) when available.
 */
export async function addClinicHeader(doc: jsPDF, margin: number = 20): Promise<number> {
  const settings = await getClinicSettings();

  const clinicName = settings?.nome_fantasia || 'Clínica Pacem';
  const clinicAddress = settings?.endereco_completo || '';
  const phone = settings?.telefone || '';
  const email = settings?.email_contato || '';
  const contactLine = [phone && `Contato: ${phone}`, email && `E-mail: ${email}`].filter(Boolean).join(' | ');

  const logoHeight = 22;
  const logoWidth = 22;
  let y = margin;

  const logoSrc = settings?.logo_url || logoPacem;
  const loaded = await loadImageAsDataUrl(logoSrc).catch(() => null);

  if (loaded) {
    try {
      doc.addImage(loaded.dataUrl, loaded.format, margin, y, logoWidth, logoHeight);
    } catch (e) {
      console.error('Error adding logo image to PDF', e);
    }
  }

  const textX = margin + logoWidth + 6;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(clinicName, textX, y + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (clinicAddress) doc.text(clinicAddress, textX, y + 13);
  if (contactLine) doc.text(contactLine, textX, y + 18);

  y += logoHeight + 4;

  doc.setDrawColor(180);
  doc.line(margin, y, 190, y);
  y += 8;

  return y;
}
