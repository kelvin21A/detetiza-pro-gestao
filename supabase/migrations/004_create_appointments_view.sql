-- Create a view named 'appointments' that maps to the 'service_calls' table
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
  NULL::integer AS actual_duration,
  NULL::text AS address,
  NULL::text AS notes,
  NULL::text[] AS photos,
  NULL::text AS priority,
  NULL::text AS signature_url,
  NULL::integer AS estimated_duration,
  NULL::text AS value,
  created_at,
  updated_at
FROM
  public.service_calls;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT ON public.appointments TO anon;

-- Create RLS policies for the view
CREATE POLICY "Users can view appointments from their organization" 
ON public.appointments FOR SELECT 
TO authenticated 
USING (organization_id = auth.jwt() ->> 'organization_id'::text);

CREATE POLICY "Users can insert appointments into their organization" 
ON public.appointments FOR INSERT 
TO authenticated 
WITH CHECK (organization_id = auth.jwt() ->> 'organization_id'::text);

CREATE POLICY "Users can update appointments from their organization" 
ON public.appointments FOR UPDATE 
TO authenticated 
USING (organization_id = auth.jwt() ->> 'organization_id'::text);

CREATE POLICY "Users can delete appointments from their organization" 
ON public.appointments FOR DELETE 
TO authenticated 
USING (organization_id = auth.jwt() ->> 'organization_id'::text);