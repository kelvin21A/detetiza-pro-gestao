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
CREATE TRIGGER appointments_insert
INSTEAD OF INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointments_insert_trigger();

CREATE TRIGGER appointments_update
INSTEAD OF UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointments_update_trigger();

CREATE TRIGGER appointments_delete
INSTEAD OF DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointments_delete_trigger();