

## Plano de Melhorias do Sistema

Este plano aborda 7 frentes de trabalho: upload de documentos, correção de convênios, valores nas guias, agendamentos com convênio, finalização de consulta com recibo, repasse de convênios e UX geral.

---

### 1. Upload de Documentos (Pacientes e Guias)

**Banco de dados:**
- Criar storage bucket `documents` (publico para leitura autenticada)
- Criar tabela `patient_documents` (id, patient_id, file_name, file_path, file_type, uploaded_at) com RLS
- Criar tabela `medical_guide_documents` (id, medical_guide_id, file_name, file_path, file_type, uploaded_at) com RLS
- Policies: staff pode gerenciar, pacientes podem ver os seus

**Pacientes (`Patients.tsx`):**
- Adicionar aba/seção "Documentos" no dialog de edição do paciente
- Input de upload multiplo de arquivos
- Lista de documentos com botoes de visualizar, baixar e excluir

**Guias (`MedicalGuides.tsx`):**
- Adicionar campo de upload no formulario de criacao da guia
- Na area expandida da guia, mostrar documentos com download

---

### 2. Correção de Convênios (Status Ativo/Inativo)

**`HealthInsurances.tsx`:**
- Adicionar campo Switch (ativo/inativo) no formulario de cadastro e edicao
- O `emptyInsurance` ja deve ter `active: true` como padrao
- Na submissao, enviar o campo `active` no payload
- Na tabela, permitir toggle de status direto

O banco ja tem `active default true`, entao o problema esta no formulario que nao envia o campo `active`.

---

### 3. Correção dos Valores nas Guias

**`MedicalGuides.tsx`:**
- Ao selecionar procedimento + convênio no item da guia, buscar automaticamente o preco de `procedure_insurance_prices`
- Preencher `unit_value` automaticamente
- Garantir que `total_value` (quantity * unit_value) persista corretamente
- Na listagem e detalhes, exibir valores formatados

---

### 4. Correção de Agendamentos com Convênio

**`Appointments.tsx`:**
- O problema provavelmente e que ao selecionar "convenio", se nao houver convenios carregados ou o campo `health_insurance_id` nao e tratado, causa crash
- Adicionar tratamento de erro com try/catch no handleSubmit
- Validar que `health_insurance_id` esteja preenchido quando tipo = convenio antes de submeter
- Adicionar `ErrorBoundary` ou fallback para evitar tela em branco
- Garantir que o campo `patient_package_id` seja tratado para tipo "pacote"

---

### 5. Finalizar Consulta + Recibo Automatico

**`Appointments.tsx`:**
- Ao mudar status para "finalizado", abrir dialog de finalizacao
- Campos: forma de pagamento (select de `payment_methods`), valor, observacoes
- Ao confirmar:
  - Atualizar status do appointment para "finalizado"
  - Criar `financial_transaction` automatica
  - Gerar recibo em PDF (usando biblioteca client-side)

**Novo componente `ReceiptDialog.tsx`:**
- Exibir recibo na tela com dados: paciente, data, profissional, tipo, valor, forma de pagamento
- Botao "Baixar PDF" (gerar PDF no client com jspdf ou similar)
- Botao "Imprimir" (window.print)

**Dependencia:** instalar `jspdf` para geracao de PDF no client

---

### 6. Repasse de Convenios (Financeiro)

**Banco de dados:**
- Criar tabela `insurance_reimbursements` (id, health_insurance_id, reference_month, expected_amount, received_amount, receipt_file_path, status, notes, created_at, updated_at) com RLS

**Nova pagina `InsuranceReimbursements.tsx`:**
- Selecionar convênio e mes de referencia
- Calcular automaticamente valor esperado (soma das guias do periodo)
- Informar valor recebido
- Upload de comprovante
- Comparativo: esperado vs recebido com diferenca destacada

**Sidebar:** Adicionar link "Repasse Convênios" no menu financeiro

---

### 7. Experiencia do Usuario (UX)

- Adicionar loading states (Skeleton) nas listagens
- Garantir mensagens de erro amigaveis em todos os formularios
- Adicionar `ErrorBoundary` global no App.tsx para evitar telas em branco
- Feedback visual: toast de sucesso/erro em todas as acoes
- Desabilitar botoes durante submissao (estado `submitting`)

---

### Resumo Tecnico

| Item | Arquivos Modificados | Migracao DB |
|------|---------------------|-------------|
| 1. Upload Docs | Patients.tsx, MedicalGuides.tsx, novos componentes | Sim (bucket + 2 tabelas) |
| 2. Convenios Status | HealthInsurances.tsx | Nao |
| 3. Valores Guias | MedicalGuides.tsx | Nao |
| 4. Agendamentos | Appointments.tsx | Nao |
| 5. Recibo | Appointments.tsx, novo ReceiptDialog.tsx | Nao |
| 6. Repasse Convenios | Nova pagina, Sidebar.tsx, App.tsx | Sim (1 tabela) |
| 7. UX | Multiplos arquivos | Nao |

**Dependencias npm:** `jspdf` para geracao de recibos PDF

