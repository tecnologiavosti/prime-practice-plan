import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PatientAuthProvider } from "@/contexts/PatientAuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfessionalLayout } from "@/components/layout/ProfessionalLayout";
import { PatientLayout } from "@/components/patient/PatientLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalRealtimeBridge } from "@/hooks/useRealtime";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Professionals from "./pages/Professionals";
import Procedures from "./pages/Procedures";
import HealthInsurances from "./pages/HealthInsurances";
import Administrators from "./pages/Administrators";
import Specialties from "./pages/Specialties";
import Packages from "./pages/Packages";
import Schedule from "./pages/Schedule";
import Appointments from "./pages/Appointments";
import FinancialTransactions from "./pages/FinancialTransactions";
import MedicalGuides from "./pages/MedicalGuides";
import ProfessionalPayouts from "./pages/ProfessionalPayouts";
import BillingBatches from "./pages/BillingBatches";
import FinancialReports from "./pages/FinancialReports";
import Reports from "./pages/Reports";
import PaymentMethods from "./pages/PaymentMethods";
import InsuranceReimbursements from "./pages/InsuranceReimbursements";
import CashFlow from "./pages/CashFlow";
import SeoSettings from "./pages/SeoSettings";
import Blog from "./pages/Blog";
import Convenios from "./pages/Convenios";
import EspecialidadePage from "./pages/Especialidade";
import BlogPost from "./pages/BlogPost";
import SubleasedRooms from "./pages/SubleasedRooms";
import Rooms from "./pages/Rooms";
import Prontuarios from "./pages/Prontuarios";
import ProntuarioDetail from "./pages/ProntuarioDetail";

import ScheduleConfig from "./pages/ScheduleConfig";
import ClinicProfile from "./pages/ClinicProfile";
import TeamUsers from "./pages/TeamUsers";
import Settings from "./pages/Settings";
import MeuSite from "./pages/MeuSite";
import { ReadOnlyGate } from "@/components/layout/ReadOnlyGate";

import NotFound from "./pages/NotFound";
// Patient Portal
import LandingPage from "./pages/LandingPage";
import ProfessionalPublic from "./pages/ProfessionalPublic";
import EquipePublic from "./pages/EquipePublic";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PainelMigracao from "./pages/PainelMigracao";

import CookieBanner from "@/components/CookieBanner";
import PatientAuth from "./pages/patient/PatientAuth";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientBooking from "./pages/patient/PatientBooking";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientHistory from "./pages/patient/PatientHistory";
// Professional Portal
import ProfessionalDashboard from "./pages/professional/ProfessionalDashboard";
import ProfessionalSchedule from "./pages/professional/ProfessionalSchedule";
import ProfessionalPatients from "./pages/professional/ProfessionalPatients";
import ProfessionalPatientRecord from "./pages/professional/ProfessionalPatientRecord";
import ProfessionalPayoutsPortal from "./pages/professional/ProfessionalPayouts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GlobalRealtimeBridge />
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/convenios" element={<Convenios />} />
            <Route path="/especialidades/:slug" element={<EspecialidadePage />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/equipe" element={<EquipePublic />} />
            <Route path="/equipe/:id" element={<ProfessionalPublic />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            

            
            
            {/* Patient Auth Routes */}
            <Route path="/login" element={<PatientAuthProvider><PatientAuth mode="login" /></PatientAuthProvider>} />
            <Route path="/cadastro" element={<PatientAuthProvider><PatientAuth mode="signup" /></PatientAuthProvider>} />
            
            {/* Patient Portal Routes */}
            <Route element={<PatientAuthProvider><PatientLayout /></PatientAuthProvider>}>
              <Route path="/dashboard" element={<PatientDashboard />} />
              <Route path="/agendamentos" element={<PatientAppointments />} />
              <Route path="/agendar" element={<PatientBooking />} />
              <Route path="/meus-dados" element={<PatientProfile />} />
              <Route path="/historico" element={<PatientHistory />} />
              <Route path="/configuracoes" element={<Settings />} />
            </Route>
            
            {/* Professional Portal Routes */}
            <Route element={<AuthProvider><ProfessionalLayout /></AuthProvider>}>
              <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
              <Route path="/professional/agenda" element={<ProfessionalSchedule />} />
              <Route path="/professional/agendamentos" element={<Appointments />} />
              <Route path="/professional/escalas" element={<ScheduleConfig />} />
              <Route path="/professional/pacientes" element={<ProfessionalPatients />} />
              <Route path="/professional/pacientes/:patientId" element={<ProfessionalPatientRecord />} />
              <Route path="/professional/cadastro-pacientes" element={<Patients />} />
              <Route path="/professional/guias" element={<MedicalGuides />} />
              <Route path="/professional/repasses" element={<ProfessionalPayoutsPortal />} />
              <Route path="/professional/configuracoes" element={<Settings />} />
            </Route>


            {/* Staff/Admin Routes */}
            <Route path="/admin/auth" element={<AuthProvider><Auth /></AuthProvider>} />
            <Route element={<AuthProvider><MainLayout /></AuthProvider>}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/pacientes" element={<ReadOnlyGate moduleKey="pacientes"><Patients /></ReadOnlyGate>} />
              <Route path="/admin/prontuarios" element={<ReadOnlyGate moduleKey="prontuarios"><Prontuarios /></ReadOnlyGate>} />
              <Route path="/admin/prontuarios/:patientId" element={<ReadOnlyGate moduleKey="prontuarios"><ProntuarioDetail /></ReadOnlyGate>} />
              <Route path="/admin/profissionais" element={<ReadOnlyGate moduleKey="profissionais"><Professionals /></ReadOnlyGate>} />
              <Route path="/admin/procedimentos" element={<ReadOnlyGate moduleKey="procedimentos"><Procedures /></ReadOnlyGate>} />
              <Route path="/admin/convenios" element={<ReadOnlyGate moduleKey="convenios"><HealthInsurances /></ReadOnlyGate>} />
              <Route path="/admin/administradoras" element={<ReadOnlyGate moduleKey="administradoras"><Administrators /></ReadOnlyGate>} />
              <Route path="/admin/especialidades" element={<ReadOnlyGate moduleKey="especialidades"><Specialties /></ReadOnlyGate>} />
              <Route path="/admin/pacotes" element={<ReadOnlyGate moduleKey="pacotes"><Packages /></ReadOnlyGate>} />
              <Route path="/admin/agenda" element={<ReadOnlyGate moduleKey="agenda"><Schedule /></ReadOnlyGate>} />
              <Route path="/admin/agendamentos" element={<ReadOnlyGate moduleKey="agendamentos"><Appointments /></ReadOnlyGate>} />
              <Route path="/admin/financeiro" element={<ReadOnlyGate moduleKey="financeiro"><FinancialTransactions /></ReadOnlyGate>} />
              <Route path="/admin/fluxo-caixa" element={<ReadOnlyGate moduleKey="fluxo-caixa"><CashFlow /></ReadOnlyGate>} />
              <Route path="/admin/guias" element={<ReadOnlyGate moduleKey="guias"><MedicalGuides /></ReadOnlyGate>} />
              <Route path="/admin/repasses" element={<ReadOnlyGate moduleKey="repasses"><ProfessionalPayouts /></ReadOnlyGate>} />
              <Route path="/admin/repasse-convenios" element={<ReadOnlyGate moduleKey="repasse-convenios"><InsuranceReimbursements /></ReadOnlyGate>} />
              <Route path="/admin/lotes-faturamento" element={<ReadOnlyGate moduleKey="lotes-faturamento"><BillingBatches /></ReadOnlyGate>} />
              <Route path="/admin/relatorios-financeiros" element={<ReadOnlyGate moduleKey="relatorios-financeiros"><FinancialReports /></ReadOnlyGate>} />
              <Route path="/admin/relatorios" element={<ReadOnlyGate moduleKey="relatorios"><Reports /></ReadOnlyGate>} />
              <Route path="/admin/formas-pagamento" element={<ReadOnlyGate moduleKey="formas-pagamento"><PaymentMethods /></ReadOnlyGate>} />

              <Route path="/admin/escalas" element={<ReadOnlyGate moduleKey="escalas"><ScheduleConfig /></ReadOnlyGate>} />
              <Route path="/admin/perfil-clinica" element={<ReadOnlyGate moduleKey="perfil-clinica"><ClinicProfile /></ReadOnlyGate>} />
              <Route path="/admin/equipe" element={<TeamUsers />} />
              <Route path="/admin/meu-site" element={<ReadOnlyGate moduleKey="meu-site"><MeuSite /></ReadOnlyGate>} />
              <Route path="/admin/seo" element={<ReadOnlyGate moduleKey="seo"><SeoSettings /></ReadOnlyGate>} />
              <Route path="/admin/blog" element={<ReadOnlyGate moduleKey="blog"><Blog /></ReadOnlyGate>} />
              <Route path="/admin/salas-sublocadas" element={<ReadOnlyGate moduleKey="salas-sublocadas"><SubleasedRooms /></ReadOnlyGate>} />
              <Route path="/admin/salas" element={<ReadOnlyGate moduleKey="salas"><Rooms /></ReadOnlyGate>} />

              
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieBanner />
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
