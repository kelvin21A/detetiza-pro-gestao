import TeamForm from '@/components/forms/TeamForm';

const NovaEquipe = () => {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Nova Equipe</h1>
        <TeamForm />
      </div>
    </div>
  );
};

export default NovaEquipe;
