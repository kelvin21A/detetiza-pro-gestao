-- Add missing columns to service_calls table to match the appointments view
ALTER TABLE public.service_calls
ADD COLUMN IF NOT EXISTS actual_duration INTEGER,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT[],
ADD COLUMN IF NOT EXISTS priority TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
ADD COLUMN IF NOT EXISTS value TEXT;

-- Update the appointments view to include the new columns
CREATE OR REPLACE VIEW public.appointments AS
SELECT
  id,
  organization_id,
  client_id,
  team_id,
  title,
  description,
  service_type,
  scheduled_date,
  completed_date,
  status,
  actual_duration,
  address,
  notes,
  photos,
  priority,
  signature_url,
  estimated_duration,
  value,
  created_at,
  updated_at
FROM
  public.service_calls;