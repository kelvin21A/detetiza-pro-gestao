import { ServiceCallForm } from '@/components/forms/ServiceCallForm';

export default function NovoChamado() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Novo Chamado</h1>
        <p className="text-muted-foreground">Preencha os detalhes abaixo para registrar um novo serviço.</p>
      </div>
      <ServiceCallForm />
    </div>
  );
}
