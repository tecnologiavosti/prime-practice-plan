import jsPDF from 'jspdf';
import logoPacem from '@/assets/logoPacem.png';

const CLINIC_NAME = 'Clínica Pacem';
const CLINIC_ADDRESS = 'SCN Quadra 1 Bloco E Sala 1905 – Edifício Central Park – Asa Norte – Brasília/DF';
const CLINIC_CONTACT = 'Contato: (61) 99649-7990 | E-mail: contato@clinicapacem.com.br';

/**
 * Adds the official clinic header to a jsPDF document.
 * Returns the Y position after the header (below the separator line).
 */
export async function addClinicHeader(doc: jsPDF, margin: number = 20): Promise<number> {
  const logoHeight = 22; // ~22mm
  const logoWidth = 22;  // square logo
  let y = margin;

  // Load logo image
  const img = new Image();
  img.src = logoPacem;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    // If already cached
    if (img.complete) resolve();
  });

  doc.addImage(img, 'PNG', margin, y, logoWidth, logoHeight);

  // Text to the right of the logo
  const textX = margin + logoWidth + 6;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(CLINIC_NAME, textX, y + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(CLINIC_ADDRESS, textX, y + 13);
  doc.text(CLINIC_CONTACT, textX, y + 18);

  y += logoHeight + 4;

  // Separator line
  doc.setDrawColor(180);
  doc.line(margin, y, 190, y);
  y += 8;

  return y;
}
