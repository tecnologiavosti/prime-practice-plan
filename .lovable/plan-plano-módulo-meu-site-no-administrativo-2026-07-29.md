# Plano: Módulo "Meu Site" no administrativo

Criar uma área única no admin em que você edita **todo o conteúdo do site público** (LandingPage, cabeçalho, rodapé, páginas de especialidade, blog, políticas, SEO) sem precisar mexer no código. Hoje esses dados estão em três lugares: `clinic_settings` (identidade), constantes hard-coded dentro de `LandingPage.tsx` (hero, especialidades, diferenciais, depoimentos, FAQ, CTAs) e as páginas `Especialidade.tsx`, `PrivacyPolicy.tsx`, `SeoSettings.tsx`. O plano centraliza tudo.

## O que muda para você

Novo item no menu do administrativo: **Meu Site** (`/admin/meu-site`). A tela abre com as abas exatamente como na imagem de referência:

- **Identidade** — logo, favicon, cores primária/secundária/destaque, fonte.
- **Topo (Hero)** — título, subtítulo, texto dos 2 CTAs (Agendar / Especialidades), imagem de fundo.
- **Sobre** — título, texto, imagem, lista de destaques (bullets).
- **Especialidades** — lista completa: nome, slug, ícone, descrição curta (card), descrição longa (página interna `/especialidade/:slug`), imagem, bullets e CTA. Reordenar por drag-and-drop e ativar/desativar cada uma.
- **Diferenciais** — os 4 cards de "Por que escolher a Clínica Pacem" (ícone + título + texto), editáveis e reordenáveis.
- **Equipe** — bloco da home: título da seção, texto de apoio, e quais profissionais aparecem (puxa de `professionals`, permite marcar visíveis e ordenar). Edição de bio/foto continua no cadastro do profissional.
- **Depoimentos** — CRUD dos depoimentos exibidos na home (nome, texto, estrelas, foto opcional).
- **FAQ** — CRUD das perguntas/respostas do accordion.
- **CTAs** — textos e números de WhatsApp/telefone dos botões espalhados (Agende agora, botão flutuante etc.), e mensagem pré-preenchida do WhatsApp.
- **Contato** — endereço, telefone, e-mail, horário, redes sociais (Instagram, Facebook), link do Google Maps.
- **Seções** — liga/desliga blocos da home (Hero, Sobre, Especialidades, Diferenciais, Equipe, Depoimentos, FAQ, Blog, CTA final) e define a ordem.
- **SEO** — título, descrição, palavras-chave, imagem OG, robots, sitemap (integra com o que já existe em `SeoSettings.tsx`).
- **Domínio** — mostra o domínio atual e link para Configurações → Domínios.
- **Privacidade** — editor do texto da página `/politica-de-privacidade` (rich text).

No topo da tela: nome atual do site, link com "prévia" (abre o site em nova aba) e botão **Salvar alterações** (também no fim da página). Só administradores acessam.

## Como funciona por dentro

### Banco de dados

Nova tabela `site_content` (uma linha por chave), acessada pelo site público sem login (RLS: `select` público, `insert/update/delete` restrito a admin via `has_role`). Estrutura:

```text
site_content
  key         text primary key      -- ex.: 'hero', 'sobre', 'diferenciais', 'faq', 'depoimentos', 'especialidades', 'ctas', 'contato', 'sections_order', 'seo', 'privacidade'
  value       jsonb                 -- payload livre por bloco
  updated_at  timestamptz default now()
  updated_by  uuid references auth.users
```

Grants padrão (`select` para `anon`+`authenticated`, `all` para `service_role`, mutações apenas via policy admin). Seed inicial gera as chaves com os valores atuais hard-coded (extraídos de `LandingPage.tsx`) para não quebrar nada no primeiro deploy.

Reaproveita tabelas já existentes:
- `clinic_settings` continua sendo a fonte de identidade (logo, cores, contato base) — a aba **Identidade** passa a ser uma view amigável dela.
- `professionals` alimenta a aba **Equipe**; adiciona colunas `show_on_landing boolean default true` e `landing_order int` para controle de exibição/ordem.
- Blog continua usando as tabelas atuais.

### Frontend

- Novo hook `useSiteContent(key)` com cache em memória + realtime (parecido com `useClinicSettings`), retornando o JSON tipado por chave.
- `src/lib/siteContent.ts` — tipos TypeScript por bloco (`HeroContent`, `SobreContent`, `EspecialidadeContent[]`, `FaqContent[]`, etc.).
- `src/pages/LandingPage.tsx` refatorado para ler tudo de `useSiteContent` em vez das constantes locais. Fallback para os valores atuais se a chave não existir.
- `src/pages/Especialidade.tsx` passa a ler o conteúdo do slug direto de `site_content.key = 'especialidades'`.
- `src/pages/PrivacyPolicy.tsx` renderiza o HTML sanitizado de `site_content.key = 'privacidade'`.
- `PublicHeader` e `PublicFooter` leem contato/CTAs de `site_content` (com fallback).

### Nova UI admin

- `src/pages/admin/MeuSite.tsx` — layout com `Tabs` do shadcn na ordem da imagem, botão global "Salvar alterações" e link de prévia.
- Uma pasta `src/pages/admin/meu-site/` com um componente por aba (`IdentidadeTab.tsx`, `HeroTab.tsx`, `SobreTab.tsx`, `EspecialidadesTab.tsx`, `DiferenciaisTab.tsx`, `EquipeTab.tsx`, `DepoimentosTab.tsx`, `FaqTab.tsx`, `CtasTab.tsx`, `ContatoTab.tsx`, `SecoesTab.tsx`, `SeoTab.tsx`, `DominioTab.tsx`, `PrivacidadeTab.tsx`). Cada aba tem seu próprio estado + botão salvar (grava só a chave dela).
- Componentes reutilizáveis: `ImageUploadField` (usa o bucket `clinic-assets`), `IconPicker` (mesma lista lucide usada hoje), `SortableList` (drag-and-drop com `@dnd-kit/sortable` — já disponível), `RichTextField` (textarea com preview para Sobre / Privacidade).
- Rota registrada em `src/App.tsx` protegida por `ReadOnlyGate` + role `administrador`.
- Item "Meu Site" adicionado à `Sidebar.tsx` (ícone `Globe`) no grupo administrativo, respeitando o sistema de permissões atual (novo módulo `meu_site`).

### Migração e compatibilidade

- Migration 1: cria `site_content`, grants, policies, seed com o conteúdo atual (extraído dos arrays em `LandingPage.tsx`).
- Migration 2: adiciona `show_on_landing`, `landing_order` em `professionals`.
- Migration 3: registra `meu_site` como módulo válido para a matriz de permissões.
- Nenhum dado existente é removido; se a tabela estiver vazia, o site usa os defaults hard-coded (evita "site em branco" no primeiro deploy).

### Fora do escopo

- Editor visual "arrastar componente" — a edição é por formulário, seção por seção.
- Multi-idioma (o site é PT-BR).
- Versionamento/histórico das edições (fica para depois; posso salvar apenas o último estado).
