import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5561981823984";
const DEFAULT_MSG = "Olá! Gostaria de agendar uma consulta na Clínica Pacem.";

export function getWhatsAppLink(message: string = DEFAULT_MSG) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function WhatsAppFloat() {
  return (
    <a
      href={getWhatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-[0_12px_30px_-8px_rgba(37,211,102,0.6)] hover:bg-[#1ebe5d] hover:-translate-y-0.5 transition-all"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline text-sm font-semibold">Agende agora</span>
    </a>
  );
}
