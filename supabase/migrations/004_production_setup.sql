-- =====================================================
-- DetetizaPro - Setup de Produção
-- Execute este script APÓS as migrações 001, 002 e 003
-- =====================================================

-- 1. CRIAR SUPER ADMIN GLOBAL
-- =====================================================

-- Inserir super admin na tabela auth.users (será criado automaticamente no primeiro login)
-- Email: admin@detetizapro.com
-- Senha: senhaadmin123

-- Criar perfil do super admin
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  tenant_id,
  active,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@detetizapro.com',
  'Super Administrador',
  'super_admin',
  NULL, -- Super admin não pertence a nenhum tenant específico
  true,
  true,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- 2. CRIAR TENANT DEMO PARA TESTES
-- =====================================================

-- Inserir tenant demo
INSERT INTO public.tenants (
  id,
  name,
  subdomain,
  settings,
  active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'DetetizaPro Demo',
  'demo',
  jsonb_build_object(
    'company_name', 'DetetizaPro Demo',
    'phone', '(11) 99999-9999',
    'email', 'contato@demo.detetizapro.com',
    'address', 'Rua Demo, 123 - São Paulo, SP',
    'cnpj', '00.000.000/0001-00'
  ),
  true,
  now(),
  now()
) ON CONFLICT (subdomain) DO NOTHING;

-- Obter ID do tenant demo
DO $$
DECLARE
  demo_tenant_id uuid;
  demo_admin_id uuid;
BEGIN
  -- Buscar ID do tenant demo
  SELECT id INTO demo_tenant_id 
  FROM public.tenants 
  WHERE subdomain = 'demo';
  
  -- Criar admin do tenant demo
  demo_admin_id := gen_random_uuid();
  
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    tenant_id,
    active,
    is_super_admin,
    must_change_password,
    created_at,
    updated_at
  ) VALUES (
    demo_admin_id,
    'admin@demo.detetizapro.com',
    'Administrador Demo',
    'admin',
    demo_tenant_id,
    true,
    false,
    true, -- Deve trocar senha no primeiro login
    now(),
    now()
  ) ON CONFLICT (email) DO NOTHING;
  
  -- Criar alguns clientes demo
  INSERT INTO public.clients (
    id,
    tenant_id,
    name,
    email,
    phone,
    document,
    address,
    city,
    state,
    zip_code,
    status,
    created_at,
    updated_at
  ) VALUES 
  (
    gen_random_uuid(),
    demo_tenant_id,
    'João Silva',
    'joao@email.com',
    '(11) 99999-1111',
    '123.456.789-00',
    'Rua das Flores, 123',
    'São Paulo',
    'SP',
    '01234-567',
    'active',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    demo_tenant_id,
    'Maria Santos',
    'maria@email.com',
    '(11) 99999-2222',
    '987.654.321-00',
    'Av. Principal, 456',
    'São Paulo',
    'SP',
    '01234-890',
    'active',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    demo_tenant_id,
    'Empresa ABC Ltda',
    'contato@empresaabc.com',
    '(11) 3333-4444',
    '12.345.678/0001-90',
    'Rua Comercial, 789',
    'São Paulo',
    'SP',
    '01234-123',
    'active',
    now(),
    now()
  ) ON CONFLICT DO NOTHING;
  
  -- Criar equipe demo
  INSERT INTO public.teams (
    id,
    tenant_id,
    name,
    description,
    active,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    demo_tenant_id,
    'Equipe Principal',
    'Equipe principal de técnicos',
    true,
    now(),
    now()
  ) ON CONFLICT DO NOTHING;
  
END $$;

-- 3. CONFIGURAÇÕES DE SEGURANÇA ADICIONAIS
-- =====================================================

-- Função para validar email de super admin
CREATE OR REPLACE FUNCTION public.is_super_admin_email(email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN email = 'admin@detetizapro.com';
END;
$$;

-- Função para obter tenant_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_tenant_id uuid;
BEGIN
  SELECT tenant_id INTO user_tenant_id
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN user_tenant_id;
END;
$$;

-- 4. TRIGGERS PARA AUDITORIA
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplicar trigger em todas as tabelas principais
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'tenants', 'clients', 'contracts', 'service_calls', 'teams', 'team_members', 'services', 'products', 'inventory', 'renewals')
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON public.%s
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END $$;

-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_calls_tenant_id ON public.service_calls(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_calls_status ON public.service_calls(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_calls_scheduled_date ON public.service_calls(scheduled_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_tenant_id ON public.contracts(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_status ON public.contracts(status);

-- 6. CONFIGURAÇÕES FINAIS
-- =====================================================

-- Atualizar estatísticas das tabelas
ANALYZE;

-- Confirmar que RLS está ativo em todas as tabelas
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('tenants') -- tenants não precisa de RLS
  LOOP
    EXECUTE format('ALTER TABLE public.%s ENABLE ROW LEVEL SECURITY;', table_name);
  END LOOP;
END $$;

-- 7. INSERIR DADOS DE CONFIGURAÇÃO
-- =====================================================

-- Configurações globais do sistema
INSERT INTO public.system_config (
  key,
  value,
  description,
  created_at,
  updated_at
) VALUES 
(
  'app_version',
  '1.0.0',
  'Versão atual da aplicação',
  now(),
  now()
),
(
  'maintenance_mode',
  'false',
  'Modo de manutenção ativo/inativo',
  now(),
  now()
),
(
  'max_tenants',
  '100',
  'Número máximo de tenants permitidos',
  now(),
  now()
),
(
  'backup_retention_days',
  '30',
  'Dias de retenção de backup',
  now(),
  now()
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- =====================================================
-- SETUP COMPLETO!
-- =====================================================

-- Exibir informações importantes
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DetetizaPro - Setup de Produção Completo!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'CREDENCIAIS CRIADAS:';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 SUPER ADMIN:';
  RAISE NOTICE '   Email: admin@detetizapro.com';
  RAISE NOTICE '   Senha: senhaadmin123';
  RAISE NOTICE '';
  RAISE NOTICE '🏢 TENANT DEMO:';
  RAISE NOTICE '   Email: admin@demo.detetizapro.com';
  RAISE NOTICE '   Senha: teste123 (deve trocar no primeiro login)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Banco configurado com:';
  RAISE NOTICE '   - Multi-tenant com RLS ativo';
  RAISE NOTICE '   - Índices de performance';
  RAISE NOTICE '   - Triggers de auditoria';
  RAISE NOTICE '   - Dados demo para testes';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Sistema pronto para produção!';
  RAISE NOTICE '========================================';
END $$;
