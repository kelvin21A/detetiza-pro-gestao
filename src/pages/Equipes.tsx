import { useState } from "react";
import { Plus, Search, Users2, Phone, Mail, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  specialties: string[];
  active: boolean;
  team: string;
}

// Mock data for teams
const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "João Silva",
    role: "Técnico Sênior",
    phone: "(11) 99999-1111",
    email: "joao@detetizapro.com",
    specialties: ["Dedetização", "Desratização"],
    active: true,
    team: "Equipe Principal"
  },
  {
    id: "2",
    name: "Maria Santos",
    role: "Técnica",
    phone: "(11) 99999-2222",
    email: "maria@detetizapro.com",
    specialties: ["Sanitização", "Fumigação"],
    active: true,
    team: "Equipe Principal"
  },
  {
    id: "3",
    name: "Pedro Costa",
    role: "Técnico",
    phone: "(11) 99999-3333",
    email: "pedro@detetizapro.com",
    specialties: ["Descupinização"],
    active: true,
    team: "Equipe Especializada"
  }
];

const SPECIALTIES = [
  "Dedetização",
  "Desratização", 
  "Descupinização",
  "Sanitização",
  "Fumigação"
];

const TEAMS = [
  "Equipe Principal",
  "Equipe Especializada",
  "Equipe Emergência"
];

export default function Equipes() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    specialties: [] as string[],
    team: ""
  });

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      phone: "",
      email: "",
      specialties: [],
      team: ""
    });
    setEditingMember(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.role || !formData.team) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (editingMember) {
      // Update existing member
      setTeamMembers(prev => prev.map(member => 
        member.id === editingMember.id 
          ? { ...member, ...formData, specialties: formData.specialties }
          : member
      ));
      toast({
        title: "Membro atualizado!",
        description: `${formData.name} foi atualizado com sucesso`
      });
    } else {
      // Create new member
      const newMember: TeamMember = {
        id: Date.now().toString(),
        ...formData,
        active: true
      };
      setTeamMembers(prev => [newMember, ...prev]);
      toast({
        title: "Membro adicionado!",
        description: `${formData.name} foi adicionado à equipe`
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      phone: member.phone,
      email: member.email,
      specialties: member.specialties,
      team: member.team
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const member = teamMembers.find(m => m.id === id);
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    toast({
      title: "Membro removido",
      description: `${member?.name} foi removido da equipe`
    });
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  return (
    <AppLayout title="Equipes">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Membro
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? "Editar Membro" : "Novo Membro da Equipe"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Cargo *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Ex: Técnico Sênior"
                />
              </div>

              <div>
                <Label htmlFor="team">Equipe *</Label>
                <Select value={formData.team} onValueChange={(value) => setFormData(prev => ({ ...prev, team: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map(team => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label>Especialidades</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SPECIALTIES.map(specialty => (
                    <Badge
                      key={specialty}
                      variant={formData.specialties.includes(specialty) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSpecialty(specialty)}
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingMember ? "Atualizar" : "Adicionar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, cargo ou equipe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Users2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">{member.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(member)}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(member.id)}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users2 className="w-4 h-4" />
                <span>{member.team}</span>
              </div>
              
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{member.phone}</span>
                </div>
              )}
              
              {member.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}

              {member.specialties.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Especialidades:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.specialties.map(specialty => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum membro encontrado
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente ajustar sua busca" : "Adicione o primeiro membro da equipe"}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
