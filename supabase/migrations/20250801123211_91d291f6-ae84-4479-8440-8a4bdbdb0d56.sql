-- Create organizations table for multi-tenant architecture
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create profiles table linked to organizations
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create clients table (isolated by organization)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cnpj_cpf TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  last_service_date DATE,
  next_renewal_date DATE,
  status TEXT DEFAULT 'em-dia' CHECK (status IN ('em-dia', 'proximo', 'vencido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create teams table (isolated by organization)
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create service calls table (isolated by organization)
CREATE TABLE public.service_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id),
  title TEXT NOT NULL,
  description TEXT,
  service_type TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'agendado', 'em-andamento', 'concluido', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for service calls
ALTER TABLE public.service_calls ENABLE ROW LEVEL SECURITY;

-- Create service terms table (isolated by organization)
CREATE TABLE public.service_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_call_id UUID NOT NULL REFERENCES public.service_calls(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for service terms
ALTER TABLE public.service_terms ENABLE ROW LEVEL SECURITY;

-- Create function to get current user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create RLS policies for organizations
CREATE POLICY "Users can view their own organization" 
ON public.organizations 
FOR SELECT 
USING (id = public.get_user_organization_id());

CREATE POLICY "Users can update their own organization" 
ON public.organizations 
FOR UPDATE 
USING (id = public.get_user_organization_id());

-- Create RLS policies for profiles
CREATE POLICY "Users can view profiles in their organization" 
ON public.profiles 
FOR SELECT 
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create RLS policies for clients
CREATE POLICY "Users can manage clients in their organization" 
ON public.clients 
FOR ALL 
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Create RLS policies for teams
CREATE POLICY "Users can manage teams in their organization" 
ON public.teams 
FOR ALL 
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Create RLS policies for service calls
CREATE POLICY "Users can manage service calls in their organization" 
ON public.service_calls 
FOR ALL 
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Create RLS policies for service terms
CREATE POLICY "Users can manage service terms in their organization" 
ON public.service_terms 
FOR ALL 
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- This function will be called after user signup
  -- The organization will be created during the registration process
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_calls_updated_at
BEFORE UPDATE ON public.service_calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();