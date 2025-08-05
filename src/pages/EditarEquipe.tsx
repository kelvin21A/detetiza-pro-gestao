import { useParams } from 'react-router-dom';
import { TeamForm } from '@/components/forms/TeamForm';
import { useTeam } from '@/hooks/useTeams';
import { Loader2 } from 'lucide-react';

const EditarEquipe = () => {
  const { id } = useParams<{ id: string }>();
  const { team, isLoading, isError } = useTeam(id!);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">Erro ao carregar os dados da equipe.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Editar Equipe</h1>
        <TeamForm team={team} />
      </div>
    </div>
  );
};

export default EditarEquipe;
