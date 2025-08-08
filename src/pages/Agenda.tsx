import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export function Agenda() {
  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Agenda Gerencial</h1>
          <p className="text-muted-foreground">Visualize e gerencie os agendamentos de serviços.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Corpo da Agenda */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          {/* Barra de Ferramentas do Calendário */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline">Hoje</Button>
              <span className="text-lg font-semibold">Julho 2024</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost">Mês</Button>
              <Button variant="ghost">Semana</Button>
              <Button variant="ghost">Dia</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">O calendário será carregado aqui.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

