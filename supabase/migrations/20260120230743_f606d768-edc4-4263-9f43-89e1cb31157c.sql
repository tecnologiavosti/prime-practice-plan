-- Enum para tipos de atendimento
CREATE TYPE public.service_type AS ENUM ('particular', 'convenio', 'ambos');

-- Enum para status de agendamento
CREATE TYPE public.appointment_status AS ENUM ('agendado', 'confirmado', 'em_atendimento', 'finalizado', 'cancelado', 'faltou');

-- Enum para roles do sistema
CREATE TYPE public.app_role AS ENUM ('administrador', 'recepcao', 'profissional', 'financeiro');

-- Enum para tipo de consulta
CREATE TYPE public.consultation_type AS ENUM ('particular', 'convenio', 'pacote');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de roles do usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de administradoras
CREATE TABLE public.administrators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de convênios
CREATE TABLE public.health_insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  administrator_id UUID REFERENCES public.administrators(id) ON DELETE SET NULL,
  ans_registration TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de procedimentos
CREATE TABLE public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  private_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de valores de procedimentos por convênio
CREATE TABLE public.procedure_insurance_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE CASCADE NOT NULL,
  health_insurance_id UUID REFERENCES public.health_insurances(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (procedure_id, health_insurance_id)
);

-- Tabela de especialidades
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de profissionais
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  council_number TEXT,
  council_state TEXT,
  service_type service_type NOT NULL DEFAULT 'ambos',
  active BOOLEAN DEFAULT true NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de convênios atendidos pelo profissional
CREATE TABLE public.professional_insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  health_insurance_id UUID REFERENCES public.health_insurances(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (professional_id, health_insurance_id)
);

-- Tabela de configuração de agenda do profissional
CREATE TABLE public.professional_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  service_type service_type NOT NULL DEFAULT 'ambos',
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de períodos especiais de atendimento (convênio específico, etc)
CREATE TABLE public.professional_special_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  health_insurance_id UUID REFERENCES public.health_insurances(id) ON DELETE CASCADE,
  is_private_only BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de pacientes
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  birth_date DATE,
  gender TEXT,
  phone TEXT,
  phone_secondary TEXT,
  email TEXT,
  address TEXT,
  address_number TEXT,
  address_complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  health_insurance_id UUID REFERENCES public.health_insurances(id) ON DELETE SET NULL,
  insurance_card_number TEXT,
  preferred_service_type consultation_type DEFAULT 'particular',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de pacotes particulares
CREATE TABLE public.private_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de procedimentos incluídos em pacotes
CREATE TABLE public.package_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.private_packages(id) ON DELETE CASCADE NOT NULL,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (package_id, procedure_id)
);

-- Tabela de pacotes comprados por pacientes
CREATE TABLE public.patient_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES public.private_packages(id) ON DELETE CASCADE NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sessions_used INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  consultation_type consultation_type NOT NULL DEFAULT 'particular',
  health_insurance_id UUID REFERENCES public.health_insurances(id) ON DELETE SET NULL,
  patient_package_id UUID REFERENCES public.patient_packages(id) ON DELETE SET NULL,
  status appointment_status NOT NULL DEFAULT 'agendado',
  is_recurring BOOLEAN DEFAULT false,
  recurring_parent_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de fichas de anamnese
CREATE TABLE public.anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  chief_complaint TEXT,
  current_illness_history TEXT,
  past_medical_history TEXT,
  family_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  lifestyle_habits TEXT,
  physical_examination TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de bloqueios de agenda
CREATE TABLE public.schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  block_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_full_day BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_insurance_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_special_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário tem alguma role
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'administrador'));

-- Políticas RLS para user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

-- Políticas para demais tabelas (acesso para usuários autenticados com roles)
CREATE POLICY "Authenticated users can view administrators" ON public.administrators
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage administrators" ON public.administrators
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view health_insurances" ON public.health_insurances
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage health_insurances" ON public.health_insurances
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view procedures" ON public.procedures
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage procedures" ON public.procedures
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view procedure_insurance_prices" ON public.procedure_insurance_prices
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage procedure_insurance_prices" ON public.procedure_insurance_prices
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view specialties" ON public.specialties
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage specialties" ON public.specialties
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view professionals" ON public.professionals
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage professionals" ON public.professionals
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view professional_insurances" ON public.professional_insurances
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage professional_insurances" ON public.professional_insurances
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view professional_schedules" ON public.professional_schedules
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage professional_schedules" ON public.professional_schedules
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view professional_special_periods" ON public.professional_special_periods
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage professional_special_periods" ON public.professional_special_periods
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view patients" ON public.patients
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can manage patients" ON public.patients
  FOR ALL USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'recepcao')
  );

CREATE POLICY "Authenticated users can view private_packages" ON public.private_packages
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage private_packages" ON public.private_packages
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view package_procedures" ON public.package_procedures
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage package_procedures" ON public.package_procedures
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view patient_packages" ON public.patient_packages
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can manage patient_packages" ON public.patient_packages
  FOR ALL USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'recepcao')
  );

CREATE POLICY "Authenticated users can view appointments" ON public.appointments
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can manage appointments" ON public.appointments
  FOR ALL USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'recepcao')
  );

CREATE POLICY "Professionals can update own appointments" ON public.appointments
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'profissional') AND
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can view anamnesis" ON public.anamnesis
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Professionals can manage anamnesis" ON public.anamnesis
  FOR ALL USING (
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'profissional')
  );

CREATE POLICY "Authenticated users can view schedule_blocks" ON public.schedule_blocks
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage schedule_blocks" ON public.schedule_blocks
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_administrators_updated_at BEFORE UPDATE ON public.administrators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_insurances_updated_at BEFORE UPDATE ON public.health_insurances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procedures_updated_at BEFORE UPDATE ON public.procedures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_schedules_updated_at BEFORE UPDATE ON public.professional_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_private_packages_updated_at BEFORE UPDATE ON public.private_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_packages_updated_at BEFORE UPDATE ON public.patient_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anamnesis_updated_at BEFORE UPDATE ON public.anamnesis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para otimização
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_professional ON public.appointments(professional_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_patients_name ON public.patients(full_name);
CREATE INDEX idx_professionals_name ON public.professionals(full_name);
CREATE INDEX idx_professional_schedules_professional ON public.professional_schedules(professional_id);
CREATE INDEX idx_anamnesis_patient ON public.anamnesis(patient_id);
CREATE INDEX idx_anamnesis_appointment ON public.anamnesis(appointment_id);