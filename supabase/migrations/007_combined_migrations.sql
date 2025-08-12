-- Combine all migrations into a single file for easier deployment

-- First, add missing columns to service_calls table
ALTER TABLE public.service_calls
ADD COLUMN IF NOT EXISTS actual_duration INTEGER,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT[],
ADD COLUMN IF NOT EXISTS priority TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
ADD COLUMN IF NOT EXISTS value TEXT;

-- Create the appointments view
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

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT ON public.appointments TO anon;

-- Create RLS policies for the view
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments' AND policyname = 'Users can view appointments from their organization'
  ) THEN
    CREATE POLICY "Users can view appointments from their organization" 
    ON public.appointments FOR SELECT 
    TO authenticated 
    USING (organization_id = auth.jwt() ->> 'organization_id'::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments' AND policyname = 'Users can insert appointments into their organization'
  ) THEN
    CREATE POLICY "Users can insert appointments into their organization" 
    ON public.appointments FOR INSERT 
    TO authenticated 
    WITH CHECK (organization_id = auth.jwt() ->> 'organization_id'::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments' AND policyname = 'Users can update appointments from their organization'
  ) THEN
    CREATE POLICY "Users can update appointments from their organization" 
    ON public.appointments FOR UPDATE 
    TO authenticated 
    USING (organization_id = auth.jwt() ->> 'organization_id'::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments' AND policyname = 'Users can delete appointments from their organization'
  ) THEN
    CREATE POLICY "Users can delete appointments from their organization" 
    ON public.appointments FOR DELETE 
    TO authenticated 
    USING (organization_id = auth.jwt() ->> 'organization_id'::text);
  END IF;
END $$;

-- Create trigger functions to handle CRUD operations on the appointments view

-- Function to handle INSERT operations
CREATE OR REPLACE FUNCTION public.appointments_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.service_calls (
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
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.organization_id,
    NEW.client_id,
    NEW.team_id,
    NEW.title,
    NEW.description,
    NEW.service_type,
    NEW.scheduled_date,
    NEW.completed_date,
    NEW.status,
    NEW.actual_duration,
    NEW.address,
    NEW.notes,
    NEW.photos,
    NEW.priority,
    NEW.signature_url,
    NEW.estimated_duration,
    NEW.value,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle UPDATE operations
CREATE OR REPLACE FUNCTION public.appointments_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.service_calls SET
    organization_id = NEW.organization_id,
    client_id = NEW.client_id,
    team_id = NEW.team_id,
    title = NEW.title,
    description = NEW.description,
    service_type = NEW.service_type,
    scheduled_date = NEW.scheduled_date,
    completed_date = NEW.completed_date,
    status = NEW.status,
    actual_duration = NEW.actual_duration,
    address = NEW.address,
    notes = NEW.notes,
    photos = NEW.photos,
    priority = NEW.priority,
    signature_url = NEW.signature_url,
    estimated_duration = NEW.estimated_duration,
    value = NEW.value,
    updated_at = COALESCE(NEW.updated_at, now())
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle DELETE operations
CREATE OR REPLACE FUNCTION public.appointments_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.service_calls WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the triggers on the appointments view
DO $$ 
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS appointments_insert ON public.appointments;
  DROP TRIGGER IF EXISTS appointments_update ON public.appointments;
  DROP TRIGGER IF EXISTS appointments_delete ON public.appointments;
  
  -- Create new triggers
  CREATE TRIGGER appointments_insert
  INSTEAD OF INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_insert_trigger();

  CREATE TRIGGER appointments_update
  INSTEAD OF UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_update_trigger();

  CREATE TRIGGER appointments_delete
  INSTEAD OF DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_delete_trigger();
END $$;