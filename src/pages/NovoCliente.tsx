import { ClientForm } from '@/components/forms/ClientForm';

const NovoCliente = () => {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Novo Cliente</h1>
        <ClientForm />
      </div>
    </div>
  );
};

export default NovoCliente;
