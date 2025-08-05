import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users2, Edit, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useTeams } from '@/hooks/useTeams';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function Equipes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { teams, isLoading, isError, deleteTeam } = useTeams();

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    return teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [teams, searchTerm]);

  const handleDelete = async (id: string) => {
    await deleteTeam(id);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-12 bg-red-50 p-6 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Erro ao carregar equipes
          </h3>
          <p className="text-red-700">
            Não foi possível buscar os dados. Tente novamente mais tarde.
          </p>
        </div>
      );
    }

    if (filteredTeams.length === 0) {
      return (
        <div className="text-center py-12">
          <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe cadastrada'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Tente ajustar sua busca' : 'Adicione a primeira equipe no botão acima.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Users2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg text-foreground">{team.name}</CardTitle>
                    </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/equipes/${team.id}/editar`)}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a equipe e seus dados associados.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(team.id)} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {team.description || 'Nenhuma descrição fornecida.'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-red-600">Gestão de Equipes</h2>
        <Button onClick={() => navigate('/equipes/nova')}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Equipe
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          disabled={isLoading || isError}
        />
      </div>

      {renderContent()}
    </div>
  );
}
