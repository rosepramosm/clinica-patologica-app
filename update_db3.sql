-- Agregar nuevas columnas médicas a la tabla de pacientes
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS age TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS referring_doctor TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS sample_origin TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS clinical_summary TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS clinical_diagnosis TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS macroscopic_diagnosis TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS microscopic_diagnosis TEXT DEFAULT '';
