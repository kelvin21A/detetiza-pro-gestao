-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewals ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin'
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin (admin or super_admin)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'super_admin')
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TENANTS TABLE POLICIES
-- =============================================

-- Super admins can see all tenants, others can only see their own
CREATE POLICY "tenants_select_policy" ON tenants
  FOR SELECT USING (
    is_super_admin() OR 
    id = get_current_tenant_id()
  );

-- Only super admins can insert tenants
CREATE POLICY "tenants_insert_policy" ON tenants
  FOR INSERT WITH CHECK (is_super_admin());

-- Only super admins can update tenants
CREATE POLICY "tenants_update_policy" ON tenants
  FOR UPDATE USING (is_super_admin());

-- Only super admins can delete tenants
CREATE POLICY "tenants_delete_policy" ON tenants
  FOR DELETE USING (is_super_admin());

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can see users from their tenant, super admins see all
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    is_super_admin() OR 
    tenant_id = get_current_tenant_id() OR
    id = auth.uid()
  );

-- Admins can insert users in their tenant, super admins anywhere
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (
    is_super_admin() OR 
    (is_admin() AND tenant_id = get_current_tenant_id())
  );

-- Users can update their own profile, admins can update users in their tenant
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (
    is_super_admin() OR
    id = auth.uid() OR
    (is_admin() AND tenant_id = get_current_tenant_id())
  );

-- Only super admins and tenant admins can delete users
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE USING (
    is_super_admin() OR
    (is_admin() AND tenant_id = get_current_tenant_id())
  );

-- =============================================
-- CLIENTS TABLE POLICIES
-- =============================================

-- Users can only see clients from their tenant
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Users can insert clients in their tenant
CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

-- Users can update clients in their tenant
CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

-- Only admins can delete clients
CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

-- =============================================
-- SERVICES TABLE POLICIES
-- =============================================

-- Users can see services from their tenant
CREATE POLICY "services_select_policy" ON services
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Only admins can manage services
CREATE POLICY "services_insert_policy" ON services
  FOR INSERT WITH CHECK (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

CREATE POLICY "services_update_policy" ON services
  FOR UPDATE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

CREATE POLICY "services_delete_policy" ON services
  FOR DELETE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

-- =============================================
-- CONTRACTS TABLE POLICIES
-- =============================================

-- Users can see contracts from their tenant
CREATE POLICY "contracts_select_policy" ON contracts
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Users can insert contracts in their tenant
CREATE POLICY "contracts_insert_policy" ON contracts
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

-- Users can update contracts in their tenant
CREATE POLICY "contracts_update_policy" ON contracts
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

-- Only admins can delete contracts
CREATE POLICY "contracts_delete_policy" ON contracts
  FOR DELETE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

-- =============================================
-- TEAMS TABLE POLICIES
-- =============================================

-- Users can see teams from their tenant
CREATE POLICY "teams_select_policy" ON teams
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Only admins can manage teams
CREATE POLICY "teams_insert_policy" ON teams
  FOR INSERT WITH CHECK (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

CREATE POLICY "teams_update_policy" ON teams
  FOR UPDATE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

CREATE POLICY "teams_delete_policy" ON teams
  FOR DELETE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

-- =============================================
-- TEAM_MEMBERS TABLE POLICIES
-- =============================================

-- Users can see team members from their tenant
CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Only admins can manage team members
CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT WITH CHECK (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

-- =============================================
-- SERVICE_CALLS TABLE POLICIES
-- =============================================

-- Users can see service calls from their tenant
CREATE POLICY "service_calls_select_policy" ON service_calls
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Users can insert service calls in their tenant
CREATE POLICY "service_calls_insert_policy" ON service_calls
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

-- Users can update service calls in their tenant (or assigned to them)
CREATE POLICY "service_calls_update_policy" ON service_calls
  FOR UPDATE USING (
    tenant_id = get_current_tenant_id() AND 
    (is_admin() OR assigned_to = auth.uid())
  );

-- Only admins can delete service calls
CREATE POLICY "service_calls_delete_policy" ON service_calls
  FOR DELETE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

-- =============================================
-- PRODUCTS TABLE POLICIES
-- =============================================

-- Users can see products from their tenant
CREATE POLICY "products_select_policy" ON products
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Users can insert products in their tenant
CREATE POLICY "products_insert_policy" ON products
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

-- Users can update products in their tenant
CREATE POLICY "products_update_policy" ON products
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

-- Only admins can delete products
CREATE POLICY "products_delete_policy" ON products
  FOR DELETE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

-- =============================================
-- INVENTORY_MOVEMENTS TABLE POLICIES
-- =============================================

-- Users can see inventory movements from their tenant
CREATE POLICY "inventory_movements_select_policy" ON inventory_movements
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Users can insert inventory movements in their tenant
CREATE POLICY "inventory_movements_insert_policy" ON inventory_movements
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

-- Users can update inventory movements in their tenant
CREATE POLICY "inventory_movements_update_policy" ON inventory_movements
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

-- Only admins can delete inventory movements
CREATE POLICY "inventory_movements_delete_policy" ON inventory_movements
  FOR DELETE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );

-- =============================================
-- RENEWALS TABLE POLICIES
-- =============================================

-- Users can see renewals from their tenant
CREATE POLICY "renewals_select_policy" ON renewals
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Users can insert renewals in their tenant
CREATE POLICY "renewals_insert_policy" ON renewals
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

-- Users can update renewals in their tenant
CREATE POLICY "renewals_update_policy" ON renewals
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

-- Only admins can delete renewals
CREATE POLICY "renewals_delete_policy" ON renewals
  FOR DELETE USING (
    tenant_id = get_current_tenant_id() AND is_admin()
  );
