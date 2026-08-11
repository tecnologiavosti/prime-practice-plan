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
          {
            foreignKeyName: "anamnesis_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_attachments: {
        Row: {
          anamnesis_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          section: string
          uploaded_by: string | null
        }
        Insert: {
          anamnesis_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          section: string
          uploaded_by?: string | null
        }
        Update: {
          anamnesis_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          section?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_attachments_anamnesis_id_fkey"
            columns: ["anamnesis_id"]
            isOneToOne: false
            referencedRelation: "anamnesis"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_sessions: {
        Row: {
          appointment_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          session_date: string
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          session_date: string
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          session_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          administrator_id: string | null
          appointment_date: string
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string
          created_by: string | null
          custom_amount: number | null
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
          room_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          administrator_id?: string | null
          appointment_date: string
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          created_by?: string | null
          custom_amount?: number | null
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
          room_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          administrator_id?: string | null
          appointment_date?: string
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          created_by?: string | null
          custom_amount?: number | null
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
          room_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_recurring_parent_id_fkey"
            columns: ["recurring_parent_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_admins: {
        Row: {
          allowed_modules: string[]
          created_at: string
          email: string
          full_name: string
          id: string
          invited_by: string | null
          readonly_modules: string[]
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          allowed_modules?: string[]
          created_at?: string
          email: string
          full_name: string
          id?: string
          invited_by?: string | null
          readonly_modules?: string[]
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          allowed_modules?: string[]
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          invited_by?: string | null
          readonly_modules?: string[]
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
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
      blog_posts: {
        Row: {
          author: string | null
          content: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cash_flow_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          entry_date: string
          entry_type: string
          id: string
          notes: string | null
          payment_method_id: string | null
          receipt_path: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_type: string
          id?: string
          notes?: string | null
          payment_method_id?: string | null
          receipt_path?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          notes?: string | null
          payment_method_id?: string | null
          receipt_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          cnpj: string | null
          created_at: string
          email_contato: string | null
          endereco_completo: string | null
          id: string
          logo_url: string | null
          nome_fantasia: string
          razao_social: string | null
          singleton: boolean
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email_contato?: string | null
          endereco_completo?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia?: string
          razao_social?: string | null
          singleton?: boolean
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email_contato?: string | null
          endereco_completo?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia?: string
          razao_social?: string | null
          singleton?: boolean
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "financial_transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
            referencedColumns: ["id"]
          },
        ]
      }
      health_insurances: {
        Row: {
          active: boolean
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
        Relationships: []
      }
      insurance_administrators_map: {
        Row: {
          administrator_id: string
          billing_rate: number
          created_at: string
          id: string
          insurance_id: string
        }
        Insert: {
          administrator_id: string
          billing_rate?: number
          created_at?: string
          id?: string
          insurance_id: string
        }
        Update: {
          administrator_id?: string
          billing_rate?: number
          created_at?: string
          id?: string
          insurance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_administrators_map_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_administrators_map_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurances"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_reimbursements: {
        Row: {
          created_at: string
          expected_amount: number
          health_insurance_id: string | null
          id: string
          notes: string | null
          receipt_file_path: string | null
          received_amount: number
          reference_month: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected_amount?: number
          health_insurance_id?: string | null
          id?: string
          notes?: string | null
          receipt_file_path?: string | null
          received_amount?: number
          reference_month: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected_amount?: number
          health_insurance_id?: string | null
          id?: string
          notes?: string | null
          receipt_file_path?: string | null
          received_amount?: number
          reference_month?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_reimbursements_health_insurance_id_fkey"
            columns: ["health_insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurances"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_guide_documents: {
        Row: {
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          medical_guide_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          medical_guide_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          medical_guide_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_guide_documents_medical_guide_id_fkey"
            columns: ["medical_guide_id"]
            isOneToOne: false
            referencedRelation: "medical_guides"
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
          {
            foreignKeyName: "medical_guide_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_guides: {
        Row: {
          administrator_id: string | null
          appointment_id: string | null
          attachment_url: string | null
          cid_10: string | null
          clinical_indication: string | null
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
          administrator_id?: string | null
          appointment_id?: string | null
          attachment_url?: string | null
          cid_10?: string | null
          clinical_indication?: string | null
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
          administrator_id?: string | null
          appointment_id?: string | null
          attachment_url?: string | null
          cid_10?: string | null
          clinical_indication?: string | null
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
            foreignKeyName: "medical_guides_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "medical_guides_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_guides_audit: {
        Row: {
          changed_by: string | null
          changed_by_email: string | null
          created_at: string
          guide_id: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
        }
        Insert: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          guide_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
        }
        Update: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          guide_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      package_procedures: {
        Row: {
          created_at: string
          id: string
          package_id: string
          procedure_id: string
          quantity: number
          section_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          procedure_id: string
          quantity?: number
          section_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          procedure_id?: string
          quantity?: number
          section_id?: string | null
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
          {
            foreignKeyName: "package_procedures_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "package_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      package_sections: {
        Row: {
          created_at: string
          id: string
          name: string
          package_id: string
          section_value: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          package_id: string
          section_value?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          package_id?: string
          section_value?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_sections_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "private_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          patient_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          patient_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          patient_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
          created_by: string | null
          document_url: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: string | null
          guardian_cpf: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          guardian_rg: string | null
          has_guardian: boolean
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
          created_by?: string | null
          document_url?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: string | null
          guardian_cpf?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          guardian_rg?: string | null
          has_guardian?: boolean
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
          created_by?: string | null
          document_url?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          guardian_cpf?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          guardian_rg?: string | null
          has_guardian?: boolean
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
          {
            foreignKeyName: "professional_fees_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
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
          {
            foreignKeyName: "professional_insurances_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
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
          {
            foreignKeyName: "professional_payouts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
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
          {
            foreignKeyName: "professional_schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
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
          {
            foreignKeyName: "professional_special_periods_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
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
          cpf: string | null
          created_at: string
          crm: string | null
          email: string | null
          full_name: string
          id: string
          landing_about: string | null
          landing_bio: string | null
          landing_curriculum: string | null
          landing_order: number
          landing_whatsapp: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          rg: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          show_on_landing: boolean
          specialty_id: string | null
          state: string | null
          uf_crm: string | null
          updated_at: string
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          crm?: string | null
          email?: string | null
          full_name: string
          id?: string
          landing_about?: string | null
          landing_bio?: string | null
          landing_curriculum?: string | null
          landing_order?: number
          landing_whatsapp?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          rg?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          show_on_landing?: boolean
          specialty_id?: string | null
          state?: string | null
          uf_crm?: string | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          crm?: string | null
          email?: string | null
          full_name?: string
          id?: string
          landing_about?: string | null
          landing_bio?: string | null
          landing_curriculum?: string | null
          landing_order?: number
          landing_whatsapp?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          rg?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          show_on_landing?: boolean
          specialty_id?: string | null
          state?: string | null
          uf_crm?: string | null
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
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
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
      rooms: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
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
          {
            foreignKeyName: "schedule_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          bing_site_verification: string | null
          created_at: string
          ga4_measurement_id: string | null
          google_site_verification: string | null
          gtm_container_id: string | null
          id: string
          meta_description: string | null
          meta_keywords: string | null
          meta_pixel_id: string | null
          meta_title: string | null
          og_image_url: string | null
          robots_txt: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          bing_site_verification?: string | null
          created_at?: string
          ga4_measurement_id?: string | null
          google_site_verification?: string | null
          gtm_container_id?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_pixel_id?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          robots_txt?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          bing_site_verification?: string | null
          created_at?: string
          ga4_measurement_id?: string | null
          google_site_verification?: string | null
          gtm_container_id?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_pixel_id?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          robots_txt?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
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
      specialty_health_insurances: {
        Row: {
          administrator_id: string | null
          created_at: string
          health_insurance_id: string
          id: string
          specialty_id: string
        }
        Insert: {
          administrator_id?: string | null
          created_at?: string
          health_insurance_id: string
          id?: string
          specialty_id: string
        }
        Update: {
          administrator_id?: string | null
          created_at?: string
          health_insurance_id?: string
          id?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialty_health_insurances_administrator_id_fkey"
            columns: ["administrator_id"]
            isOneToOne: false
            referencedRelation: "administrators"
            referencedColumns: ["id"]
          },
        ]
      }
      subleased_rooms: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          due_day: number | null
          id: string
          monthly_value: number
          name: string
          notes: string | null
          room_number: string | null
          tenant_contact: string | null
          tenant_id: string | null
          tenant_name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          due_day?: number | null
          id?: string
          monthly_value?: number
          name: string
          notes?: string | null
          room_number?: string | null
          tenant_contact?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          due_day?: number | null
          id?: string
          monthly_value?: number
          name?: string
          notes?: string | null
          room_number?: string | null
          tenant_contact?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subleased_rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "subleased_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subleased_tenants: {
        Row: {
          active: boolean
          contact: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          contact?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          contact?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
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
      professionals_public: {
        Row: {
          active: boolean | null
          full_name: string | null
          id: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          specialty_id: string | null
        }
        Insert: {
          active?: boolean | null
          full_name?: string | null
          id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          specialty_id?: string | null
        }
        Update: {
          active?: boolean | null
          full_name?: string | null
          id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          specialty_id?: string | null
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
    }
    Functions: {
      create_daily_appointment_reminders: { Args: never; Returns: undefined }
      current_professional_id: { Args: never; Returns: string }
      exec_sql: { Args: { sql_query: string }; Returns: Json }
      get_landing_professional: {
        Args: { _id: string }
        Returns: {
          full_name: string
          id: string
          landing_about: string
          landing_bio: string
          landing_curriculum: string
          landing_whatsapp: string
          photo_url: string
          specialty_name: string
        }[]
      }
      get_landing_professionals: {
        Args: never
        Returns: {
          full_name: string
          id: string
          landing_bio: string
          photo_url: string
          specialty_name: string
        }[]
      }
      get_landing_stats: {
        Args: never
        Returns: {
          appointments_count: number
          patients_count: number
          professionals_count: number
          specialties_count: number
        }[]
      }
      get_professional_availability: {
        Args: { _end: string; _id: string; _start: string }
        Returns: {
          day: string
          status: string
        }[]
      }
      get_professional_insurances: {
        Args: { _id: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_professionals_for_patients: {
        Args: never
        Returns: {
          active: boolean
          full_name: string
          id: string
          service_type: Database["public"]["Enums"]["service_type"]
          specialty_id: string
        }[]
      }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authorized_admin_email: { Args: { _email: string }; Returns: boolean }
      is_own_patient: { Args: { _patient_id: string }; Returns: boolean }
      notify_staff: {
        Args: {
          _extra_user?: string
          _link: string
          _message: string
          _title: string
          _type?: string
        }
        Returns: undefined
      }
      professional_treats_patient: {
        Args: { _patient_id: string }
        Returns: boolean
      }
      provision_current_user_signup: {
        Args: { p_cpf?: string; p_email: string; p_full_name: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
