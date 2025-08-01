import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor?: string;
}

export function DashboardCard({ title, value, icon: Icon, iconColor = "text-primary" }: DashboardCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Icon className={`w-12 h-12 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}