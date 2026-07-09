DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'appointments','appointment_sessions','patients','professionals','rooms',
    'medical_guides','medical_guide_items','medical_guide_documents',
    'financial_transactions','cash_flow_entries','professional_payouts',
    'insurance_reimbursements','billing_batches','billing_batch_guides',
    'health_insurances','administrators','insurance_administrators_map',
    'procedures','procedure_insurance_prices','specialties','specialty_health_insurances',
    'professional_insurances','professional_fees','professional_schedules',
    'professional_special_periods','schedule_blocks','patient_documents',
    'patient_packages','private_packages','package_sections','package_procedures',
    'anamnesis','anamnesis_attachments','notifications','clinic_settings',
    'blog_posts','seo_settings','subleased_rooms','payment_methods','user_roles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
             WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;