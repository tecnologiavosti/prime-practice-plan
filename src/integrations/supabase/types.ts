export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      administrators: {
        Row: {
          active: boolean
          cnpj: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cnpj?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cnpj?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      anamnesis: {
        Row: {
          allergies: string | null
          appointment_id: string | null
          chief_complaint: string | null
          created_at: string
          current_illness_history: string | null
          current_medications: string | null
          diagnosis: string | null
          family_history: string | null
          id: string
          lifestyle_habits: string | null
          notes: string | null
          past_medical_history: string | null
          patient_id: string
          physical_examination: string | null
          professional_id: string | null
          treatment_plan: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          appointment_id?: string | null
          chief_complaint?: string | null
          created_at?: string
          current_illness_history?: string | null
          current_medications?: string | null
          diagnosis?: string | null
          family_history?: string | null
          id?: string
          lifestyle_habits?: string | null
          notes?: string | null
          past_medical_history?: string | null
          patient_id: string
          physical_examination?: string | null
          professional_id?: string | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          appointment_id?: string | null
          chief_complaint?: string | null
          created_at?: string
          current_illness_history?: string | null
          current_medications?: string | null
          diagnosis?: string | null
          family_history?: string | null
          id?: string
          lifestyle_habits?: string | null
          notes?: string | null
          past_medical_history?: string | null
          patient_id?: string
          physical_examination?: string | null
          professional_id?: string | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string
          created_by: string | null
          end_time: string
          health_insurance_id: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          patient_id: string
          patient_package_id: string | null
          procedure_id: string | null
          professional_id: string
          recurring_parent_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          created_by?: string | null
          end_time: string
          health_insurance_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          patient_id: string
          patient_package_id?: string | null
          procedure_id?: string | null
          professional_id: string
          recurring_parent_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          created_by?: string | null
          end_time?: string
          health_insurance_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          patient_id?: string
          patient_package_id?: string | null
          procedure_id?: string | null
          professional_id?: string
          recurring_parent_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_health_insurance_id_fkey"
            columns: ["health_insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_package_id_fkey"
            columns: ["patient_package_id"]
            isOneToOne: false
            referencedRelation: "patient_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_recurring_parent_id_fkey"
            columns: ["recurring_parent_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_batch_guides: {
        Row: {
          batch_id: string
          created_at: string
          guide_id: string
          id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          guide_id: string
          id?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          guide_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_batch_guides_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "billing_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_batch_guides_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "medical_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_batches: {
        Row: {
          administrator_id: string | null
          batch_number: string
          created_at: string
          health_insurance_id: string | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          status: string
          total_amount: number
          total_guides: number | null
          updated_at: string
        }
        Insert: {
          administrator_id?: string | null
          batch_number: string
          created_at?: string
          health_insurance_id?: string | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: string
          total_amount?: number
          total_guides?: number | null
          updated_at?: string
        }
        Update: {
          administrator_id?: string | null
          batch_number?: string
          created_at?: string
          health_insurance_id?: string | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_amount?: number
          total_guides?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_batches_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_batches_health_insurance_id_fkey"
            columns: ["health_insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurances"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          health_insurance_id: string | null
          id: string
          medical_guide_id: string | null
          notes: string | null
          patient_id: string | null
          patient_package_id: string | null
          payment_date: string | null
          payment_method_id: string | null
          procedure_id: string | null
          professional_id: string | null
          status: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          health_insurance_id?: string | null
          id?: string
          medical_guide_id?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_package_id?: string | null
          payment_date?: string | null
          payment_method_id?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          status?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          health_insurance_id?: string | null
          id?: string
          medical_guide_id?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_package_id?: string | null
          payment_date?: string | null
          payment_method_id?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_health_insurance_id_fkey"
            columns: ["health_insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_medical_guide_id_fkey"
            columns: ["medical_guide_id"]
            isOneToOne: false
            referencedRelation: "medical_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_patient_package_id_fkey"
            columns: ["patient_package_id"]
            isOneToOne: false
            referencedRelation: "patient_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      health_insurances: {
        Row: {
          active: boolean
          administrator_id: string | null
          ans_registration: string | null
          billing_rate: number | null
          code: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          administrator_id?: string | null
          ans_registration?: string | null
          billing_rate?: number | null
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          administrator_id?: string | null
          ans_registration?: string | null
          billing_rate?: number | null
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_insurances_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_guide_items: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          medical_guide_id: string
          notes: string | null
          procedure_id: string | null
          professional_id: string | null
          quantity: number
          service_date: string
          status: string
          total_value: number
          unit_value: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          medical_guide_id: string
          notes?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          quantity?: number
          service_date?: string
          status?: string
          total_value?: number
          unit_value?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          medical_guide_id?: string
          notes?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          quantity?: number
          service_date?: string
          status?: string
          total_value?: number
          unit_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_guide_items_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guide_items_medical_guide_id_fkey"
            columns: ["medical_guide_id"]
            isOneToOne: false
            referencedRelation: "medical_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guide_items_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guide_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_guides: {
        Row: {
          appointment_id: string | null
          created_at: string
          guide_date: string
          guide_number: string
          health_insurance_id: string | null
          id: string
          notes: string | null
          patient_id: string
          procedure_id: string | null
          professional_id: string | null
          quantity: number | null
          status: string
          total_value: number | null
          unit_value: number | null
          updated_at: string
          validity_date: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          guide_date?: string
          guide_number: string
          health_insurance_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          procedure_id?: string | null
          professional_id?: string | null
          quantity?: number | null
          status?: string
          total_value?: number | null
          unit_value?: number | null
          updated_at?: string
          validity_date?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          guide_date?: string
          guide_number?: string
          health_insurance_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          procedure_id?: string | null
          professional_id?: string | null
          quantity?: number | null
          status?: string
          total_value?: number | null
          unit_value?: number | null
          updated_at?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_guides_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guides_health_insurance_id_fkey"
            columns: ["health_insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guides_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guides_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guides_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      package_procedures: {
        Row: {
          created_at: string
          id: string
          package_id: string
          procedure_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          procedure_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          procedure_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_procedures_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "private_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_procedures_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_packages: {
        Row: {
          active: boolean
          created_at: string
          id: string
          notes: string | null
          package_id: string
          patient_id: string
          purchase_date: string
          sessions_used: number
          total_sessions: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          package_id: string
          patient_id: string
          purchase_date?: string
          sessions_used?: number
          total_sessions: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          package_id?: string
          patient_id?: string
          purchase_date?: string
          sessions_used?: number
          total_sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "private_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_packages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          active: boolean
          address: string | null
          address_complement: string | null
          address_number: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: string | null
          health_insurance_id: string | null
          id: string
          insurance_card_number: string | null
          neighborhood: string | null
          notes: string | null
          phone: string | null
          phone_secondary: string | null
          preferred_service_type:
            | Database["public"]["Enums"]["consultation_type"]
            | null
          rg: string | null
          state: string | null
          updated_at: string
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: string | null
          health_insurance_id?: string | null
          id?: string
          insurance_card_number?: string | null
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          phone_secondary?: string | null
          preferred_service_type?:
            | Database["public"]["Enums"]["consultation_type"]
            | null
          rg?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          health_insurance_id?: string | null
          id?: string
          insurance_card_number?: string | null
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          phone_secondary?: string | null
          preferred_service_type?:
            | Database["public"]["Enums"]["consultation_type"]
            | null
          rg?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_health_insurance_id_fkey"
            columns: ["health_insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurances"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      private_packages: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          total_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          total_price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      procedure_insurance_prices: {
        Row: {
          created_at: string
          health_insurance_id: string
          id: string
          price: number
          procedure_id: string
        }
        Insert: {
          created_at?: string
          health_insurance_id: string
          id?: string
          price?: number
          procedure_id: string
        }
        Update: {
          created_at?: string
          health_insurance_id?: string
          id?: string
          price?: number
          procedure_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_insurance_prices_health_insurance_id_fkey"
            columns: ["health_insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_insurance_prices_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          name: string
          private_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name: string
          private_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          private_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      professional_fees: {
        Row: {
          active: boolean
          created_at: string
          fee_type: string
          fixed_value: number | null
          id: string
          per_procedure_value: number | null
          percentage_value: number | null
          procedure_id: string | null
          professional_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          fee_type: string
          fixed_value?: number | null
          id?: string
          per_procedure_value?: number | null
          percentage_value?: number | null
          procedure_id?: string | null
          professional_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          fee_type?: string
          fixed_value?: number | null
          id?: string
          per_procedure_value?: number | null
          percentage_value?: number | null
          procedure_id?: string | null
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_fees_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_fees_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_insurances: {
        Row: {
          created_at: string
          health_insurance_id: string
          id: string
          professional_id: string
        }
        Insert: {
          created_at?: string
          health_insurance_id: string
          id?: string
          professional_id: string
        }
        Update: {
          created_at?: string
          health_insurance_id?: string
          id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_insurances_health_insurance_id_fkey"
            columns: ["health_insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_insurances_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_payouts: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          medical_guide_id: string | null
          notes: string | null
          payment_date: string | null
          payout_amount: number
          procedure_id: string | null
          professional_id: string
          reference_date: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          medical_guide_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payout_amount?: number
          procedure_id?: string | null
          professional_id: string
          reference_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          medical_guide_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payout_amount?: number
          procedure_id?: string | null
          professional_id?: string
          reference_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_payouts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_payouts_medical_guide_id_fkey"
            columns: ["medical_guide_id"]
            isOneToOne: false
            referencedRelation: "medical_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_payouts_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_payouts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_schedules: {
        Row: {
          active: boolean
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          professional_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          slot_duration_minutes: number
          start_time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          professional_id: string
          service_type?: Database["public"]["Enums"]["service_type"]
          slot_duration_minutes?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          professional_id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          slot_duration_minutes?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_special_periods: {
        Row: {
          active: boolean
          created_at: string
          day_of_week: number
          end_time: string
          health_insurance_id: string | null
          id: string
          is_private_only: boolean | null
          professional_id: string
          start_time: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_week: number
          end_time: string
          health_insurance_id?: string | null
          id?: string
          is_private_only?: boolean | null
          professional_id: string
          start_time: string
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          end_time?: string
          health_insurance_id?: string | null
          id?: string
          is_private_only?: boolean | null
          professional_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_special_periods_health_insurance_id_fkey"
            columns: ["health_insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_special_periods_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          address: string | null
          birth_date: string | null
          city: string | null
          council_number: string | null
          council_state: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          rg: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          specialty_id: string | null
          state: string | null
          updated_at: string
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          birth_date?: string | null
          city?: string | null
          council_number?: string | null
          council_state?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          rg?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          specialty_id?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          birth_date?: string | null
          city?: string | null
          council_number?: string | null
          council_state?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          rg?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          specialty_id?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          block_date: string
          created_at: string
          end_time: string | null
          id: string
          is_full_day: boolean | null
          professional_id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          block_date: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_full_day?: boolean | null
          professional_id: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          block_date?: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_full_day?: boolean | null
          professional_id?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "administrador"
        | "recepcao"
        | "profissional"
        | "financeiro"
        | "paciente"
      appointment_status:
        | "agendado"
        | "confirmado"
        | "em_atendimento"
        | "finalizado"
        | "cancelado"
        | "faltou"
      consultation_type: "particular" | "convenio" | "pacote"
      service_type: "particular" | "convenio" | "ambos"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "administrador",
        "recepcao",
        "profissional",
        "financeiro",
        "paciente",
      ],
      appointment_status: [
        "agendado",
        "confirmado",
        "em_atendimento",
        "finalizado",
        "cancelado",
        "faltou",
      ],
      consultation_type: ["particular", "convenio", "pacote"],
      service_type: ["particular", "convenio", "ambos"],
    },
  },
} as const
