-- DetetizaPro Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'technician');
CREATE TYPE contract_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE service_call_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE service_type AS ENUM ('dedetization', 'desratization', 'descupinization', 'sanitization', 'fumigation');

-- Users table (extends auth.users)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'technician',
    phone VARCHAR(20),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    document VARCHAR(20), -- CPF/CNPJ
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    contact_person VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts table
CREATE TABLE contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    service_type service_type NOT NULL,
    status contract_status DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    payment_frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, yearly
    description TEXT,
    terms TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table (predefined services)
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    service_type service_type NOT NULL,
    description TEXT,
    default_price DECIMAL(10,2),
    duration_minutes INTEGER DEFAULT 60,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    specialties TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service calls table
CREATE TABLE service_calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    assigned_team_member_id UUID REFERENCES team_members(id),
    service_type service_type NOT NULL,
    status service_call_status DEFAULT 'pending',
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER DEFAULT 60, -- minutes
    actual_duration INTEGER,
    description TEXT,
    notes TEXT,
    before_photos TEXT[],
    after_photos TEXT[],
    products_used JSONB,
    client_signature TEXT,
    technician_notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'un', -- un, kg, l, ml, etc
    cost_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    current_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory movements table
CREATE TABLE inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    service_call_id UUID REFERENCES service_calls(id),
    movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Renewals table (for tracking contract renewals)
CREATE TABLE renewals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    current_end_date DATE NOT NULL,
    proposed_end_date DATE NOT NULL,
    current_value DECIMAL(10,2) NOT NULL,
    proposed_value DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, completed
    notes TEXT,
    created_by UUID REFERENCES users(id),
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_document ON clients(document);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_service_calls_client_id ON service_calls(client_id);
CREATE INDEX idx_service_calls_status ON service_calls(status);
CREATE INDEX idx_service_calls_scheduled_date ON service_calls(scheduled_date);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_renewals_contract_id ON renewals(contract_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_calls_updated_at BEFORE UPDATE ON service_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default services
INSERT INTO services (name, service_type, description, default_price, duration_minutes) VALUES
('Dedetização Residencial', 'dedetization', 'Controle de pragas urbanas em residências', 150.00, 90),
('Dedetização Comercial', 'dedetization', 'Controle de pragas urbanas em estabelecimentos comerciais', 300.00, 120),
('Desratização', 'desratization', 'Controle de roedores', 200.00, 60),
('Descupinização', 'descupinization', 'Controle de cupins', 400.00, 180),
('Sanitização', 'sanitization', 'Desinfecção de ambientes', 100.00, 45),
('Fumigação', 'fumigation', 'Expurgo de grãos e produtos armazenados', 500.00, 240);

-- Insert default team
INSERT INTO teams (name, description) VALUES
('Equipe Principal', 'Equipe principal de técnicos');

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - can be customized based on requirements)
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Authenticated users can read all clients, contracts, etc. (adjust as needed)
CREATE POLICY "Authenticated users can view clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients" ON clients FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view contracts" ON contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contracts" ON contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contracts" ON contracts FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view service calls" ON service_calls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert service calls" ON service_calls FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update service calls" ON service_calls FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view services" ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view teams" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view team members" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view inventory" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view renewals" ON renewals FOR SELECT TO authenticated USING (true);
