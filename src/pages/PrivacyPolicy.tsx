import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import logoPacem from '@/assets/logoPacem.png';

export default function PrivacyPolicy() {
  const { settings } = useClinicSettings();
  const clinicName = settings?.nome_fantasia || 'Clínica Pacem';
  const clinicLogo = settings?.logo_url || logoPacem;
  const email = settings?.email_contato || 'contato@clinicapacem.com.br';
  const phone = settings?.telefone || '(61) 99649-7990';
  const address = settings?.endereco_completo || '';
  const updated = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={clinicLogo} alt={clinicName} className="h-8 w-auto object-contain" />
            <span className="font-bold text-slate-900">{clinicName}</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-5 md:px-10 py-12 md:py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Política de Privacidade
        </h1>
        <p className="text-sm text-slate-500 mb-10">Última atualização: {updated}</p>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <p>
              A {clinicName} valoriza sua privacidade e está comprometida em proteger os dados pessoais
              de pacientes, profissionais e visitantes deste site, em conformidade com a Lei Geral de
              Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Dados que coletamos</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Dados cadastrais: nome, CPF, RG, data de nascimento, e-mail, telefone e endereço.</li>
              <li>Dados de saúde fornecidos para atendimento, anamnese e prontuário.</li>
              <li>Dados de navegação e cookies para melhorar a experiência no site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Finalidade do tratamento</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Realização e gestão de consultas, exames e procedimentos.</li>
              <li>Cumprimento de obrigações legais e regulatórias.</li>
              <li>Comunicação sobre agendamentos, lembretes e novidades autorizadas.</li>
              <li>Melhoria contínua dos serviços e segurança do site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Compartilhamento</h2>
            <p>
              Seus dados não são comercializados. Podem ser compartilhados apenas com profissionais
              de saúde envolvidos no seu atendimento, convênios para faturamento autorizado, e
              autoridades quando exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para
              compreender como nossos visitantes utilizam a plataforma. Você pode aceitar ou recusar
              o uso de cookies pelo banner exibido em sua primeira visita.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados contra acessos
              não autorizados, perda, alteração ou destruição, incluindo criptografia, controle de
              acesso e backups regulares.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Seus direitos</h2>
            <p>Você pode, a qualquer momento, solicitar:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Confirmação da existência de tratamento.</li>
              <li>Acesso, correção ou atualização dos seus dados.</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Portabilidade e revogação do consentimento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Contato</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
            </p>
            <ul className="mt-2 space-y-1">
              <li><strong>E-mail:</strong> {email}</li>
              <li><strong>Telefone:</strong> {phone}</li>
              {address && <li><strong>Endereço:</strong> {address}</li>}
            </ul>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container mx-auto px-5 md:px-10 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {clinicName}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
