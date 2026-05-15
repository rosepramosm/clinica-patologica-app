-- Crea la tabla de pacientes
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    received_by TEXT NOT NULL,
    sample_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita RLS (Row Level Security) - opcional pero recomendado
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Crea una política para permitir todas las operaciones (solo para desarrollo/pruebas)
CREATE POLICY "Permitir todo el acceso temporalmente"
ON public.patients
FOR ALL
USING (true)
WITH CHECK (true);
