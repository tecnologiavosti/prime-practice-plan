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
import PaymentMethods from "./pages/PaymentMethods";
import InsuranceReimbursements from "./pages/InsuranceReimbursements";

import ScheduleConfig from "./pages/ScheduleConfig";
import ClinicProfile from "./pages/ClinicProfile";
import TeamUsers from "./pages/TeamUsers";
import NotFound from "./pages/NotFound";
// Patient Portal
import LandingPage from "./pages/LandingPage";
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
import ProfessionalPayouts from "./pages/professional/ProfessionalPayouts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />
            
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
            </Route>
            
            {/* Professional Portal Routes */}
            <Route element={<AuthProvider><ProfessionalLayout /></AuthProvider>}>
              <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
              <Route path="/professional/agenda" element={<ProfessionalSchedule />} />
              <Route path="/professional/pacientes" element={<ProfessionalPatients />} />
              <Route path="/professional/repasses" element={<ProfessionalPayouts />} />
            </Route>

            {/* Staff/Admin Routes */}
            <Route path="/admin/auth" element={<AuthProvider><Auth /></AuthProvider>} />
            <Route element={<AuthProvider><MainLayout /></AuthProvider>}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/pacientes" element={<Patients />} />
              <Route path="/admin/profissionais" element={<Professionals />} />
              <Route path="/admin/procedimentos" element={<Procedures />} />
              <Route path="/admin/convenios" element={<HealthInsurances />} />
              <Route path="/admin/administradoras" element={<Administrators />} />
              <Route path="/admin/especialidades" element={<Specialties />} />
              <Route path="/admin/pacotes" element={<Packages />} />
              <Route path="/admin/agenda" element={<Schedule />} />
              <Route path="/admin/agendamentos" element={<Appointments />} />
              <Route path="/admin/financeiro" element={<FinancialTransactions />} />
              <Route path="/admin/guias" element={<MedicalGuides />} />
              <Route path="/admin/repasses" element={<ProfessionalPayouts />} />
              <Route path="/admin/repasse-convenios" element={<InsuranceReimbursements />} />
              <Route path="/admin/lotes-faturamento" element={<BillingBatches />} />
              <Route path="/admin/relatorios-financeiros" element={<FinancialReports />} />
              <Route path="/admin/formas-pagamento" element={<PaymentMethods />} />
              
              <Route path="/admin/escalas" element={<ScheduleConfig />} />
              <Route path="/admin/perfil-clinica" element={<ClinicProfile />} />
              <Route path="/admin/equipe" element={<TeamUsers />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
