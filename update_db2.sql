-- Agregar nuevas columnas a la tabla de pacientes
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS patient_id_card TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Por Pagar',
ADD COLUMN IF NOT EXISTS total_paid_usd_equivalent NUMERIC(10, 2) DEFAULT 0;

-- Si había registros viejos, inicializamos su pago equivalente a lo que ya traían (asumiendo que en ese momento Bs no importaba mucho o ya estaban pagados)
-- Actualizamos a 'Pagado' si el amount_usd es mayor o igual al precio de la muestra (esto es aproximado para registros pasados)
-- (No te preocupes por este paso si es una base de datos nueva)
