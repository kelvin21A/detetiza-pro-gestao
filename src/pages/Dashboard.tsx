import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { CheckCircle, Clock, ClipboardList } from "lucide-react";

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          title="Serviços Concluídos no Mês"
          value={45}
          icon={CheckCircle}
          iconColor="text-primary"
        />
        <DashboardCard
          title="Clientes Próximos do Vencimento"
          value={12}
          icon={Clock}
          iconColor="text-primary"
        />
        <DashboardCard
          title="Chamados em Andamento"
          value={8}
          icon={ClipboardList}
          iconColor="text-primary"
        />
      </div>
      
      {/* Área Central para Gráficos */}
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Gráficos e Métricas
        </h3>
        <p className="text-muted-foreground">
          Área destinada para gráficos de tendências e métricas detalhadas
        </p>
      </div>
    </AppLayout>
  );
}