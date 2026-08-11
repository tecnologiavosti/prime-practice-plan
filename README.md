# ClinicFlow: Management System

Crie um sistema web completo de gestão para clínica, com foco em operação e agenda.

1. Autenticação
- Perfis: administrador, recepção, profissional e financeiro
- Controle de permissões por módulo

2. Cadastro de Pacientes
- Dados completos
- Seleção de convênio
- Número da carteirinha
- Opção de atendimento: particular ou convênio
- Histórico de consultas
- Ficha de anamnese vinculada ao paciente e à consulta

3. Cadastro de Profissionais
- Dados completos
- Especialidade
- Convênios atendidos
- Tipo de atendimento:
  - particular
  - convênio
  - ambos
- Configuração de agenda individual

4. Agenda Médica
- Agenda por profissional
- Visualização diária, semanal e mensal
- Definir períodos em que o profissional atende:
  - determinados convênios
  - particular
- Bloqueio automático fora do período configurado

5. Agendamentos
- Agendamento com:
  - paciente
  - profissional
  - procedimento
  - convênio ou particular (selecionável)
- Consultas recorrentes:
  - por convênio
  - particular

6. Procedimentos
- Cadastro de procedimentos
- Código
- Valor particular
- Convênios compatíveis
- Tempo de duração

7. Convênios
- Cadastro de convênios
- Valores por procedimento
- Regras básicas de atendimento

8. Administradoras
- Cadastro de administradoras
- Vincular convênios
- Não utilizar campo de data de recebimento

9. Pacotes Particulares
- Nome do pacote
- Valor fechado
- Procedimentos incluídos
- Vínculo com agenda
- Marcação se a consulta é pacote, particular ou convênio

Objetivo:
Sistema completo operacional, sem módulo financeiro neste momento.
Interface simples, organizada e sem automações desnecessárias.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://prime-practice-plan.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6a3d2291-7bab-4b20-96b9-b91fb26e848d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
