-- 1. Crear tabla de Tipos de Muestra
CREATE TABLE IF NOT EXISTS public.sample_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price_usd NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sample_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo el acceso temporalmente a sample_types" ON public.sample_types FOR ALL USING (true) WITH CHECK (true);

-- 2. Insertar algunos datos por defecto
INSERT INTO public.sample_types (name, price_usd) VALUES 
('Biopsia Pequeña', 30.00),
('Biopsia Mediana', 50.00),
('Biopsia Grande', 80.00),
('Citología', 15.00);

-- 3. Actualizar la tabla de pacientes existente con las nuevas columnas
-- Si la tabla patients ya existía, usamos ALTER. 
-- (Si da error porque la columna ya existe, puedes ignorarlo).
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS sample_type_id UUID REFERENCES public.sample_types(id),
ADD COLUMN IF NOT EXISTS amount_usd NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_bs NUMERIC(10, 2) DEFAULT 0;
