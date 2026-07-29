// Catalog of admin modules. The `key` is stored in authorized_admins.allowed_modules
// and is used by Sidebar to decide what to show for non-administrador users.
export interface AdminModule {
  key: string;
  label: string;
  to: string;
  roles: string[]; // roles that may ever see it
}

export const ADMIN_MODULES: AdminModule[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/admin', roles: ['administrador', 'recepcao', 'financeiro'] },
  { key: 'meu-site', label: 'Meu Site', to: '/admin/meu-site', roles: ['administrador'] },
  { key: 'agenda', label: 'Agenda', to: '/admin/agenda', roles: ['administrador', 'recepcao'] },
  { key: 'agendamentos', label: 'Agendamentos', to: '/admin/agendamentos', roles: ['administrador', 'recepcao'] },
  { key: 'salas', label: 'Salas', to: '/admin/salas', roles: ['administrador', 'recepcao'] },
  { key: 'pacientes', label: 'Pacientes', to: '/admin/pacientes', roles: ['administrador', 'recepcao'] },
  { key: 'prontuarios', label: 'Prontuários', to: '/admin/prontuarios', roles: ['administrador', 'profissional'] },
  { key: 'profissionais', label: 'Profissionais', to: '/admin/profissionais', roles: ['administrador'] },
  { key: 'procedimentos', label: 'Procedimentos', to: '/admin/procedimentos', roles: ['administrador'] },
  { key: 'convenios', label: 'Convênios', to: '/admin/convenios', roles: ['administrador'] },
  { key: 'administradoras', label: 'Administradoras', to: '/admin/administradoras', roles: ['administrador'] },
  { key: 'pacotes', label: 'Pacotes', to: '/admin/pacotes', roles: ['administrador', 'recepcao'] },
  { key: 'especialidades', label: 'Especialidades', to: '/admin/especialidades', roles: ['administrador'] },
  { key: 'financeiro', label: 'Contas a Receber', to: '/admin/financeiro', roles: ['administrador', 'financeiro'] },
  { key: 'fluxo-caixa', label: 'Fluxo de Caixa', to: '/admin/fluxo-caixa', roles: ['administrador', 'financeiro'] },
  { key: 'guias', label: 'Guias Médicas', to: '/admin/guias', roles: ['administrador', 'financeiro', 'recepcao'] },
  { key: 'lotes-faturamento', label: 'Faturamento', to: '/admin/lotes-faturamento', roles: ['administrador', 'financeiro'] },
  { key: 'repasses', label: 'Repasses', to: '/admin/repasses', roles: ['administrador', 'financeiro'] },
  { key: 'repasse-convenios', label: 'Rep. Convênios', to: '/admin/repasse-convenios', roles: ['administrador', 'financeiro'] },
  { key: 'salas-sublocadas', label: 'Salas Sublocadas', to: '/admin/salas-sublocadas', roles: ['administrador', 'financeiro'] },
  { key: 'relatorios-financeiros', label: 'Rel. Financeiros', to: '/admin/relatorios-financeiros', roles: ['administrador', 'financeiro'] },
  { key: 'relatorios', label: 'Relatórios', to: '/admin/relatorios', roles: ['administrador', 'financeiro'] },
  { key: 'formas-pagamento', label: 'Formas Pgto', to: '/admin/formas-pagamento', roles: ['administrador'] },
  { key: 'escalas', label: 'Configurar Escalas', to: '/admin/escalas', roles: ['administrador'] },
  { key: 'perfil-clinica', label: 'Perfil da Clínica', to: '/admin/perfil-clinica', roles: ['administrador'] },
  { key: 'equipe', label: 'Equipe / Usuários', to: '/admin/equipe', roles: ['administrador'] },
  { key: 'seo', label: 'SEO / Google', to: '/admin/seo', roles: ['administrador'] },
  { key: 'blog', label: 'Blog', to: '/admin/blog', roles: ['administrador'] },
];
