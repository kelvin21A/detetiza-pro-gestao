-- =============================================
-- SEED DATA FOR INITIAL SETUP
-- =============================================

-- Insert default tenant
INSERT INTO tenants (id, name, slug, is_active, settings) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  'DetetizaPro',
  'detetizapro',
  true,
  '{
    "theme": "default",
    "timezone": "America/Sao_Paulo",
    "currency": "BRL",
    "language": "pt-BR"
  }'
);

-- Insert super admin user (will be created after auth user is created)
-- This is handled by the application after auth.users is populated

-- Insert default services for the tenant
INSERT INTO services (tenant_id, name, type, description, base_price, duration_minutes) VALUES
('00000000-0000-0000-0000-000000000001', 'Dedetização Residencial', 'dedetization', 'Controle de pragas urbanas em residências', 150.00, 120),
('00000000-0000-0000-0000-000000000001', 'Dedetização Comercial', 'dedetization', 'Controle de pragas urbanas em estabelecimentos comerciais', 300.00, 180),
('00000000-0000-0000-0000-000000000001', 'Desratização', 'desratization', 'Controle e eliminação de roedores', 200.00, 90),
('00000000-0000-0000-0000-000000000001', 'Descupinização', 'descupinization', 'Tratamento contra cupins', 400.00, 240),
('00000000-0000-0000-0000-000000000001', 'Sanitização', 'sanitization', 'Desinfecção e sanitização de ambientes', 100.00, 60);

-- Insert default products for inventory
INSERT INTO products (tenant_id, name, brand, category, unit, cost_price, sale_price, current_stock, min_stock) VALUES
('00000000-0000-0000-0000-000000000001', 'Inseticida Spray 500ml', 'SBP', 'Inseticidas', 'unidade', 15.00, 25.00, 50, 10),
('00000000-0000-0000-0000-000000000001', 'Gel Formicida 10g', 'Bayer', 'Formicidas', 'unidade', 8.00, 15.00, 100, 20),
('00000000-0000-0000-0000-000000000001', 'Raticida Pellets 1kg', 'Syngenta', 'Raticidas', 'kg', 45.00, 80.00, 25, 5),
('00000000-0000-0000-0000-000000000001', 'Cupinol Líquido 1L', 'Montana', 'Cupinicidas', 'litro', 35.00, 60.00, 30, 8),
('00000000-0000-0000-0000-000000000001', 'Desinfetante 5L', 'Veja', 'Sanitizantes', 'litro', 12.00, 20.00, 40, 10);

-- Insert default team
INSERT INTO teams (tenant_id, name, description, specialties) VALUES
('00000000-0000-0000-0000-000000000001', 'Equipe Principal', 'Equipe principal de técnicos', ARRAY['dedetization', 'desratization', 'sanitization']::service_type[]);

-- =============================================
-- FUNCTIONS FOR AUTOMATIC TENANT SETUP
-- =============================================

-- Function to create initial tenant setup when a new tenant is created
CREATE OR REPLACE FUNCTION setup_new_tenant(tenant_uuid UUID, tenant_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Insert default services
  INSERT INTO services (tenant_id, name, type, description, base_price, duration_minutes) VALUES
  (tenant_uuid, 'Dedetização Residencial', 'dedetization', 'Controle de pragas urbanas em residências', 150.00, 120),
  (tenant_uuid, 'Dedetização Comercial', 'dedetization', 'Controle de pragas urbanas em estabelecimentos comerciais', 300.00, 180),
  (tenant_uuid, 'Desratização', 'desratization', 'Controle e eliminação de roedores', 200.00, 90),
  (tenant_uuid, 'Descupinização', 'descupinization', 'Tratamento contra cupins', 400.00, 240),
  (tenant_uuid, 'Sanitização', 'sanitization', 'Desinfecção e sanitização de ambientes', 100.00, 60);

  -- Insert default products
  INSERT INTO products (tenant_id, name, brand, category, unit, cost_price, sale_price, current_stock, min_stock) VALUES
  (tenant_uuid, 'Inseticida Spray 500ml', 'SBP', 'Inseticidas', 'unidade', 15.00, 25.00, 50, 10),
  (tenant_uuid, 'Gel Formicida 10g', 'Bayer', 'Formicidas', 'unidade', 8.00, 15.00, 100, 20),
  (tenant_uuid, 'Raticida Pellets 1kg', 'Syngenta', 'Raticidas', 'kg', 45.00, 80.00, 25, 5),
  (tenant_uuid, 'Cupinol Líquido 1L', 'Montana', 'Cupinicidas', 'litro', 35.00, 60.00, 30, 8),
  (tenant_uuid, 'Desinfetante 5L', 'Veja', 'Sanitizantes', 'litro', 12.00, 20.00, 40, 10);

  -- Insert default team
  INSERT INTO teams (tenant_id, name, description, specialties) VALUES
  (tenant_uuid, 'Equipe Principal', 'Equipe principal de técnicos', ARRAY['dedetization', 'desratization', 'sanitization']::service_type[]);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTIONS FOR CONTRACT NUMBER GENERATION
-- =============================================

-- Function to generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  tenant_slug TEXT;
  year_suffix TEXT;
  sequence_num INTEGER;
  contract_number TEXT;
BEGIN
  -- Get tenant slug
  SELECT slug INTO tenant_slug FROM tenants WHERE id = tenant_uuid;
  
  -- Get current year suffix
  year_suffix := TO_CHAR(NOW(), 'YY');
  
  -- Get next sequence number for this tenant and year
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(contract_number FROM '[0-9]+$') AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM contracts 
  WHERE tenant_id = tenant_uuid 
    AND contract_number LIKE UPPER(tenant_slug) || '-' || year_suffix || '-%';
  
  -- Generate contract number: TENANT-YY-NNNN
  contract_number := UPPER(tenant_slug) || '-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN contract_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate service call number
CREATE OR REPLACE FUNCTION generate_call_number(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  tenant_slug TEXT;
  year_suffix TEXT;
  sequence_num INTEGER;
  call_number TEXT;
BEGIN
  -- Get tenant slug
  SELECT slug INTO tenant_slug FROM tenants WHERE id = tenant_uuid;
  
  -- Get current year suffix
  year_suffix := TO_CHAR(NOW(), 'YY');
  
  -- Get next sequence number for this tenant and year
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(call_number FROM '[0-9]+$') AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM service_calls 
  WHERE tenant_id = tenant_uuid 
    AND call_number LIKE 'CH-' || UPPER(tenant_slug) || '-' || year_suffix || '-%';
  
  -- Generate call number: CH-TENANT-YY-NNNN
  call_number := 'CH-' || UPPER(tenant_slug) || '-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN call_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS FOR AUTO-GENERATION
-- =============================================

-- Trigger to auto-generate contract numbers
CREATE OR REPLACE FUNCTION set_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := generate_contract_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_contract_number
  BEFORE INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION set_contract_number();

-- Trigger to auto-generate service call numbers
CREATE OR REPLACE FUNCTION set_call_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.call_number IS NULL OR NEW.call_number = '' THEN
    NEW.call_number := generate_call_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_call_number
  BEFORE INSERT ON service_calls
  FOR EACH ROW
  EXECUTE FUNCTION set_call_number();

-- =============================================
-- VIEWS FOR EASIER DATA ACCESS
-- =============================================

-- View for contract renewals (contracts expiring soon)
CREATE OR REPLACE VIEW contract_renewals AS
SELECT 
  c.id,
  c.tenant_id,
  c.client_id,
  cl.name as client_name,
  cl.phone as client_phone,
  cl.email as client_email,
  c.contract_number,
  c.end_date,
  c.value,
  s.name as service_name,
  s.type as service_type,
  CASE 
    WHEN c.end_date < CURRENT_DATE THEN 'expired'
    WHEN c.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'active'
  END as renewal_status,
  c.end_date - CURRENT_DATE as days_until_expiry
FROM contracts c
JOIN clients cl ON c.client_id = cl.id
JOIN services s ON c.service_id = s.id
WHERE c.status = 'active';

-- View for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  tenant_id,
  (SELECT COUNT(*) FROM clients WHERE tenant_id = t.id AND is_active = true) as active_clients,
  (SELECT COUNT(*) FROM contracts WHERE tenant_id = t.id AND status = 'active') as active_contracts,
  (SELECT COUNT(*) FROM service_calls WHERE tenant_id = t.id AND status = 'scheduled' AND scheduled_date >= CURRENT_DATE) as scheduled_calls,
  (SELECT COUNT(*) FROM service_calls WHERE tenant_id = t.id AND status = 'completed' AND DATE(completed_date) = CURRENT_DATE) as completed_today,
  (SELECT COUNT(*) FROM contract_renewals WHERE tenant_id = t.id AND renewal_status = 'expiring_soon') as expiring_contracts,
  (SELECT COUNT(*) FROM contract_renewals WHERE tenant_id = t.id AND renewal_status = 'expired') as expired_contracts
FROM tenants t;
