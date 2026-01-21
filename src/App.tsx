import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PatientAuthProvider } from "@/contexts/PatientAuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { PatientLayout } from "@/components/patient/PatientLayout";
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
import NotFound from "./pages/NotFound";
// Patient Portal
import PatientLogin from "./pages/patient/PatientLogin";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientBooking from "./pages/patient/PatientBooking";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientHistory from "./pages/patient/PatientHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Staff Routes */}
          <Route path="/auth" element={<AuthProvider><Auth /></AuthProvider>} />
          <Route element={<AuthProvider><MainLayout /></AuthProvider>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pacientes" element={<Patients />} />
            <Route path="/profissionais" element={<Professionals />} />
            <Route path="/procedimentos" element={<Procedures />} />
            <Route path="/convenios" element={<HealthInsurances />} />
            <Route path="/administradoras" element={<Administrators />} />
            <Route path="/especialidades" element={<Specialties />} />
            <Route path="/pacotes" element={<Packages />} />
            <Route path="/agenda" element={<Schedule />} />
            <Route path="/agendamentos" element={<Appointments />} />
            <Route path="/financeiro" element={<FinancialTransactions />} />
            <Route path="/guias" element={<MedicalGuides />} />
            <Route path="/repasses" element={<ProfessionalPayouts />} />
            <Route path="/lotes-faturamento" element={<BillingBatches />} />
            <Route path="/relatorios-financeiros" element={<FinancialReports />} />
            <Route path="/formas-pagamento" element={<PaymentMethods />} />
          </Route>
          
          {/* Patient Portal Routes */}
          <Route path="/paciente/login" element={<PatientAuthProvider><PatientLogin /></PatientAuthProvider>} />
          <Route element={<PatientAuthProvider><PatientLayout /></PatientAuthProvider>}>
            <Route path="/paciente" element={<PatientDashboard />} />
            <Route path="/paciente/agendamentos" element={<PatientAppointments />} />
            <Route path="/paciente/agendar" element={<PatientBooking />} />
            <Route path="/paciente/meus-dados" element={<PatientProfile />} />
            <Route path="/paciente/historico" element={<PatientHistory />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
