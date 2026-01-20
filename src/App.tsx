import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<MainLayout />}>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
