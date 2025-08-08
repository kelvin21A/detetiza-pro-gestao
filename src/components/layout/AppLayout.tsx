import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { 
  Bell, 
  User, 
  Settings, 
  LayoutDashboard, 
  Users, 
  CalendarCheck2, 
  Phone, 
  Users2 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Usuários",
    href: "/usuarios",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Agendamentos",
    href: "/agendamentos",
    icon: <CalendarCheck2 className="h-5 w-5" />,
  },
  {
    title: "Contato",
    href: "/contato",
    icon: <Phone className="h-5 w-5" />,
  },
  {
    title: "Equipes",
    href: "/equipes",
    icon: <Users2 className="h-5 w-5" />,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: <Settings className="h-5 w-5" />,
  },
];

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset>
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="relative z-10 h-16 flex items-center justify-between px-6 border-b border-border bg-background">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-foreground" />
                {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
              </div>
              
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                  <Bell className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                  <User className="w-5 h-5" />
                </Button>
              </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}