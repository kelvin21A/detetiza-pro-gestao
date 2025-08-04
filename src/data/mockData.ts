// Centralized Mock Data for DetetizaPro
// This ensures data consistency across all pages

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cnpj_cpf?: string;
  address?: string;
  status: 'em-dia' | 'proximo-vencimento' | 'vencido';
  last_service_date?: string | null;
  next_service_date?: string | null;
  next_renewal_date?: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  specialties: string[];
  active: boolean;
  team: string;
}

export interface ServiceCall {
  id: string;
  client_id: string;
  client_name: string;
  description: string;
  scheduled_date: string;
  team_member_id: string;
  team_member_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  service_type: 'dedetization' | 'desratization' | 'descupinization' | 'sanitization' | 'fumigation';
  address: string;
  estimated_duration: number;
  notes?: string;
  created_at: string;
}

export interface Contract {
  id: string;
  client_id: string;
  client_name: string;
  service_type: 'dedetization' | 'desratization' | 'descupinization' | 'sanitization' | 'fumigation';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  start_date: string;
  end_date: string;
  value: number;
  payment_frequency: 'monthly' | 'quarterly' | 'yearly';
  created_at: string;
}

export interface Renewal {
  id: string;
  contract_id: string;
  client_id: string;
  client_name: string;
  current_end_date: string;
  proposed_end_date: string;
  current_value: number;
  proposed_value: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  days_remaining: number;
  last_service_date: string;
  created_at: string;
}

// Base clients - all other data references these
export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Restaurante Bom Sabor',
    email: 'contato@bomsabor.com',
    phone: '(11) 3456-7890',
    cnpj_cpf: '12.345.678/0001-90',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    status: 'em-dia',
    last_service_date: '2024-01-15',
    next_renewal_date: '2024-07-15',
    organization_id: 'test-org-id',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    name: 'Padaria Central',
    email: 'admin@padariacentral.com.br',
    phone: '(11) 2345-6789',
    cnpj_cpf: '98.765.432/0001-10',
    address: 'Av. Principal, 456 - São Paulo, SP',
    status: 'proximo-vencimento',
    last_service_date: '2024-01-10',
    next_renewal_date: '2024-02-10',
    organization_id: 'test-org-id',
    created_at: '2023-12-15T09:00:00Z',
    updated_at: '2024-01-10T16:45:00Z'
  },
  {
    id: '3',
    name: 'Supermercado Família',
    email: 'gerencia@superfamilia.com',
    phone: '(11) 4567-8901',
    cnpj_cpf: '11.222.333/0001-44',
    address: 'Rua do Comércio, 789 - São Paulo, SP',
    status: 'vencido',
    last_service_date: '2023-11-20',
    next_renewal_date: '2023-12-20',
    organization_id: 'test-org-id',
    created_at: '2023-11-01T08:00:00Z',
    updated_at: '2023-11-20T11:20:00Z'
  },
  {
    id: '4',
    name: 'Mercadinho da Esquina',
    email: 'contato@mercadinhoda esquina.com',
    phone: '(11) 5678-9012',
    cnpj_cpf: '22.333.444/0001-55',
    address: 'Rua da Esquina, 321 - São Paulo, SP',
    status: 'em-dia',
    last_service_date: '2024-01-05',
    next_renewal_date: '2024-07-05',
    organization_id: 'test-org-id',
    created_at: '2023-10-01T07:00:00Z',
    updated_at: '2024-01-05T10:15:00Z'
  }
];

// Team members
export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'João Silva',
    role: 'Técnico Sênior',
    phone: '(11) 99999-1111',
    email: 'joao@detetizapro.com',
    specialties: ['dedetization', 'desratization'],
    active: true,
    team: 'Equipe Principal'
  },
  {
    id: '2',
    name: 'Maria Santos',
    role: 'Técnica',
    phone: '(11) 99999-2222',
    email: 'maria@detetizapro.com',
    specialties: ['sanitization', 'fumigation'],
    active: true,
    team: 'Equipe Principal'
  },
  {
    id: '3',
    name: 'Pedro Costa',
    role: 'Técnico',
    phone: '(11) 99999-3333',
    email: 'pedro@detetizapro.com',
    specialties: ['descupinization'],
    active: true,
    team: 'Equipe Especializada'
  }
];

// Contracts - linked to existing clients
export const MOCK_CONTRACTS: Contract[] = [
  {
    id: '1',
    client_id: '1',
    client_name: 'Restaurante Bom Sabor',
    service_type: 'dedetization',
    status: 'active',
    start_date: '2024-01-15',
    end_date: '2024-07-15',
    value: 300.00,
    payment_frequency: 'monthly',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    client_id: '2',
    client_name: 'Padaria Central',
    service_type: 'desratization',
    status: 'active',
    start_date: '2024-01-10',
    end_date: '2024-02-10',
    value: 200.00,
    payment_frequency: 'monthly',
    created_at: '2023-12-15T09:00:00Z'
  },
  {
    id: '3',
    client_id: '3',
    client_name: 'Supermercado Família',
    service_type: 'sanitization',
    status: 'expired',
    start_date: '2023-11-20',
    end_date: '2023-12-20',
    value: 400.00,
    payment_frequency: 'monthly',
    created_at: '2023-11-01T08:00:00Z'
  },
  {
    id: '4',
    client_id: '4',
    client_name: 'Mercadinho da Esquina',
    service_type: 'dedetization',
    status: 'active',
    start_date: '2024-01-05',
    end_date: '2024-07-05',
    value: 250.00,
    payment_frequency: 'monthly',
    created_at: '2023-10-01T07:00:00Z'
  }
];

// Service calls - linked to existing clients and team members
export const MOCK_SERVICE_CALLS: ServiceCall[] = [
  {
    id: '1',
    client_id: '1',
    client_name: 'Restaurante Bom Sabor',
    description: 'Dedetização completa - Cozinha e depósito',
    scheduled_date: '2024-02-15T09:00:00Z',
    team_member_id: '1',
    team_member_name: 'João Silva',
    status: 'pending',
    service_type: 'dedetization',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    estimated_duration: 120,
    notes: 'Cliente relatou presença de baratas na cozinha',
    created_at: '2024-02-01T10:00:00Z'
  },
  {
    id: '2',
    client_id: '2',
    client_name: 'Padaria Central',
    description: 'Controle de roedores - Área de produção',
    scheduled_date: '2024-02-18T14:00:00Z',
    team_member_id: '2',
    team_member_name: 'Maria Santos',
    status: 'in_progress',
    service_type: 'desratization',
    address: 'Av. Principal, 456 - São Paulo, SP',
    estimated_duration: 90,
    notes: 'Detectados sinais de roedores no estoque',
    created_at: '2024-02-05T11:00:00Z'
  },
  {
    id: '3',
    client_id: '4',
    client_name: 'Mercadinho da Esquina',
    description: 'Sanitização preventiva - Todo o estabelecimento',
    scheduled_date: '2024-02-20T08:00:00Z',
    team_member_id: '2',
    team_member_name: 'Maria Santos',
    status: 'completed',
    service_type: 'sanitization',
    address: 'Rua da Esquina, 321 - São Paulo, SP',
    estimated_duration: 60,
    notes: 'Serviço realizado com sucesso',
    created_at: '2024-02-10T09:00:00Z'
  }
];

// Renewals - linked to existing contracts and clients
export const MOCK_RENEWALS: Renewal[] = [
  {
    id: '1',
    contract_id: '3',
    client_id: '3',
    client_name: 'Supermercado Família',
    current_end_date: '2023-12-20',
    proposed_end_date: '2024-06-20',
    current_value: 400.00,
    proposed_value: 450.00,
    status: 'pending',
    days_remaining: -45,
    last_service_date: '2023-11-20',
    created_at: '2023-12-15T10:00:00Z'
  },
  {
    id: '2',
    contract_id: '2',
    client_id: '2',
    client_name: 'Padaria Central',
    current_end_date: '2024-02-10',
    proposed_end_date: '2024-08-10',
    current_value: 200.00,
    proposed_value: 220.00,
    status: 'pending',
    days_remaining: 15,
    last_service_date: '2024-01-10',
    created_at: '2024-01-25T14:00:00Z'
  },
  {
    id: '3',
    contract_id: '1',
    client_id: '1',
    client_name: 'Restaurante Bom Sabor',
    current_end_date: '2024-07-15',
    proposed_end_date: '2025-01-15',
    current_value: 300.00,
    proposed_value: 320.00,
    status: 'approved',
    days_remaining: 165,
    last_service_date: '2024-01-15',
    created_at: '2024-01-20T16:00:00Z'
  }
];

// Service types mapping
export const SERVICE_TYPES = {
  dedetization: 'Dedetização',
  desratization: 'Desratização',
  descupinization: 'Descupinização',
  sanitization: 'Sanitização',
  fumigation: 'Fumigação'
};

// Status mappings
export const CLIENT_STATUS = {
  'em-dia': { label: 'Em Dia', color: 'bg-green-500' },
  'proximo-vencimento': { label: 'Próximo Vencimento', color: 'bg-yellow-500' },
  'vencido': { label: 'Vencido', color: 'bg-red-500' }
};

export const SERVICE_CALL_STATUS = {
  'pending': { label: 'Pendente', color: 'bg-yellow-500' },
  'in_progress': { label: 'Em Andamento', color: 'bg-blue-500' },
  'completed': { label: 'Concluído', color: 'bg-green-500' },
  'cancelled': { label: 'Cancelado', color: 'bg-red-500' }
};

export const CONTRACT_STATUS = {
  'active': { label: 'Ativo', color: 'bg-green-500' },
  'expired': { label: 'Expirado', color: 'bg-red-500' },
  'cancelled': { label: 'Cancelado', color: 'bg-gray-500' },
  'pending': { label: 'Pendente', color: 'bg-yellow-500' }
};

export const RENEWAL_STATUS = {
  'pending': { label: 'Pendente', color: 'bg-yellow-500' },
  'approved': { label: 'Aprovado', color: 'bg-green-500' },
  'rejected': { label: 'Rejeitado', color: 'bg-red-500' },
  'completed': { label: 'Concluído', color: 'bg-blue-500' }
};

// Utility functions
export const getClientById = (id: string): Client | undefined => {
  return MOCK_CLIENTS.find(client => client.id === id);
};

export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return MOCK_TEAM_MEMBERS.find(member => member.id === id);
};

export const getContractsByClientId = (clientId: string): Contract[] => {
  return MOCK_CONTRACTS.filter(contract => contract.client_id === clientId);
};

export const getServiceCallsByClientId = (clientId: string): ServiceCall[] => {
  return MOCK_SERVICE_CALLS.filter(call => call.client_id === clientId);
};

export const getRenewalsByClientId = (clientId: string): Renewal[] => {
  return MOCK_RENEWALS.filter(renewal => renewal.client_id === clientId);
};
