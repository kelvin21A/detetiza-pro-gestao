import React, { useState, useEffect } from 'react';
import { Plus, Building2, Users, Settings, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
  created_at: string;
  settings?: any;
}

interface NewOrganization {
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

const SuperAdmin: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState<NewOrganization>({
    name: '',
    slug: '',
    phone: '',
    email: '',
    address: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  // Carregar organizações
  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
      toast.error('Erro ao carregar organizações');
    } finally {
      setLoading(false);
    }
  };

  // Criar nova detetizadora + admin inicial
  const createOrganization = async () => {
    if (!newOrg.name || !newOrg.slug || !newOrg.adminEmail || !newOrg.adminPassword) {
      toast.error('Preencha todos os campos obrigatórios', {
        style: { background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' }
      });
      return;
    }

    try {
      setLoading(true);

      // 1. Criar organização
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: newOrg.name,
          slug: newOrg.slug,
          phone: newOrg.phone,
          email: newOrg.email,
          address: newOrg.address,
          active: true,
          settings: {
            company_name: newOrg.name,
            theme_color: '#FF3B30',
            renewal_period: 12,
            custom_statuses: [
              'Em orçamento',
              'Aguardando aprovação',
              'Agendado',
              'Em andamento',
              'Concluído',
              'Cancelado'
            ]
          }
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Criar usuário admin no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newOrg.adminEmail,
        password: newOrg.adminPassword,
        email_confirm: true,
        user_metadata: {
          name: newOrg.adminName,
          role: 'admin'
        }
      });

      if (authError) throw authError;

      // 3. Criar perfil do admin
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          organization_id: orgData.id,
          full_name: newOrg.adminName,
          email: newOrg.adminEmail,
          role: 'admin',
          is_super_admin: false,
          active: true,
          must_change_password: true
        });

      if (profileError) throw profileError;

      toast.success(`Detetizadora "${newOrg.name}" criada com sucesso!`);
      setIsDialogOpen(false);
      setNewOrg({
        name: '',
        slug: '',
        phone: '',
        email: '',
        address: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      });
      loadOrganizations();

    } catch (error: any) {
      console.error('Erro ao criar organização:', error);
      toast.error(`Erro ao criar detetizadora: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Alternar status da organização
  const toggleOrganizationStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Status da detetizadora ${!currentStatus ? 'ativado' : 'desativado'}`);
      loadOrganizations();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da detetizadora');
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  // Auto-gerar slug baseado no nome
  const handleNameChange = (name: string) => {
    setNewOrg(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Painel de Controle - ServiceFlow Pro</h1>
            <p className="text-gray-900">Gerenciamento de Empresas Clientes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Nova Empresa Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-black text-xl font-semibold">Cadastrar Nova Empresa</DialogTitle>
                <p className="text-sm text-gray-900 mt-1">Preencha os dados da empresa e do administrador inicial</p>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dados da Empresa */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-black border-b pb-2">Dados da Empresa</h3>
                  
                  <div>
                    <Label htmlFor="name" className="text-black">Nome da Detetizadora *</Label>
                    <Input
                      id="name"
                      value={newOrg.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ex: Dedetizadora ABC"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug" className="text-black">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={newOrg.slug}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="dedetizadora-abc"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-black">Telefone</Label>
                    <Input
                      id="phone"
                      value={newOrg.phone}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-black">E-mail da Empresa</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newOrg.email}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contato@dedetizadora.com"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-black">Endereço</Label>
                    <Input
                      id="address"
                      value={newOrg.address}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, Número - Cidade, Estado"
                      className="border-gray-300"
                    />
                  </div>
                </div>

                {/* Dados do Admin Inicial */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-black border-b pb-2">Admin Inicial</h3>
                  
                  <div>
                    <Label htmlFor="adminName" className="text-black">Nome do Administrador *</Label>
                    <Input
                      id="adminName"
                      value={newOrg.adminName}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, adminName: e.target.value }))}
                      placeholder="Nome completo"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminEmail" className="text-black">E-mail de Login *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={newOrg.adminEmail}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, adminEmail: e.target.value }))}
                      placeholder="admin@dedetizadora.com"
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminPassword" className="text-black">Senha Inicial *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={newOrg.adminPassword}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, adminPassword: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="border-gray-300"
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="text-gray-600">
                      <strong>Importante:</strong> O administrador receberá estas credenciais e será obrigado a alterar a senha no primeiro login.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="border-gray-300"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={createOrganization}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? 'Criando...' : 'Criar Detetizadora'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Organizações */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium">Carregando empresas...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma empresa cadastrada</h3>
            <p className="text-gray-900 mb-4">Comece cadastrando sua primeira empresa cliente</p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeira Empresa
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card key={org.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-black font-semibold">{org.name}</CardTitle>
                    <Badge 
                      variant={org.active ? "default" : "secondary"}
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        org.active 
                          ? 'bg-green-50 text-green-800 border-green-100' 
                          : 'bg-gray-50 text-gray-800 border-gray-200'
                      } border`}
                    >
                      {org.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-900 mt-1">
                    <span className="text-gray-900">ID:</span>
                    <span className="ml-1 font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{org.id.substring(0, 8)}...</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {org.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">E-mail:</span>
                      <span className="ml-2">{org.email}</span>
                    </div>
                  )}
                  {org.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Telefone:</span>
                      <span className="ml-2">{org.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Criada em:</span>
                    <span className="ml-2">
                      {new Date(org.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleOrganizationStatus(org.id, org.active)}
                      className="flex-1 border-gray-300"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {org.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdmin;
