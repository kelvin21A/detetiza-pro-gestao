import React, { useState, useEffect } from 'react';
import { Plus, User, UserPlus, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'technician';
  active: boolean;
  created_at: string;
  updated_at: string;
}

const Usuarios = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<UserProfile> | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'technician' as const,
    password: '',
    confirmPassword: ''
  });

  // Carregar usuários da organização
  const loadUsers = async () => {
    if (!userProfile?.organization_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar usuários quando o componente montar
  useEffect(() => {
    loadUsers();
  }, [userProfile?.organization_id]);

  // Limpar formulário
  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: 'technician',
      password: '',
      confirmPassword: ''
    });
    setCurrentUser(null);
    setIsEditing(false);
  };

  // Abrir diálogo para adicionar novo usuário
  const handleAddUser = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Abrir diálogo para editar usuário
  const handleEditUser = (user: UserProfile) => {
    setCurrentUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Manipular mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manipular mudança de função (role)
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as 'admin' | 'manager' | 'technician'
    }));
  };

  // Salvar usuário (criar ou atualizar)
  const handleSaveUser = async () => {
    // Validações
    if (!formData.email || !formData.full_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!isEditing && (!formData.password || !formData.confirmPassword)) {
      toast.error('A senha é obrigatória para novos usuários');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }

    try {
      setLoading(true);

      if (isEditing && currentUser) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (error) throw error;

        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            name: formData.full_name,
            role: formData.role
          }
        });

        if (authError) throw authError;

        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            organization_id: userProfile?.organization_id,
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            active: true,
            must_change_password: true
          });

        if (profileError) throw profileError;

        toast.success('Usuário criado com sucesso!');
      }

      // Recarregar lista de usuários e fechar diálogo
      await loadUsers();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} usuário`);
    } finally {
      setLoading(false);
    }
  };

  // Alternar status do usuário (ativo/inativo)
  const toggleUserStatus = async (user: UserProfile) => {
    try {
      setLoading(true);
      const newStatus = !user.active;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          active: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar lista de usuários
      await loadUsers();
      toast.success(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast.error('Erro ao alterar status do usuário');
    } finally {
      setLoading(false);
    }
  };

  // Obter a cor do badge baseado na função (role)
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'technician':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter o texto amigável para a função
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'technician':
        return 'Técnico';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Cabeçalho */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Gerenciamento de Usuários</h1>
            <p className="text-gray-600">Gerencie os usuários da sua empresa</p>
          </div>
          <Button 
            onClick={handleAddUser}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="p-6">
        {loading && users.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando usuários...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum usuário cadastrado</h3>
            <p className="text-gray-500 mb-4">Comece adicionando seu primeiro usuário</p>
            <Button 
              onClick={handleAddUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Usuário
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <Card key={user.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-black">{user.full_name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", getRoleBadgeColor(user.role))}>
                        {getRoleText(user.role)}
                      </div>
                      <div className={cn(
                        "ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        user.active 
                          ? "border-transparent bg-green-100 text-green-800" 
                          : "border-transparent bg-gray-100 text-gray-800"
                      )}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={user.active ? 'outline' : 'default'} 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => toggleUserStatus(user)}
                      >
                        {user.active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo de Novo/Edição de Usuário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nome do usuário"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@exemplo.com"
                className="w-full"
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função *</Label>
              <Select 
                value={formData.role} 
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="technician">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isEditing && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveUser}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? 'Atualizando...' : 'Criando...'}
                </>
              ) : isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;
