"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  BookOpen,
  Building2,
  Folders,
  LogOut,
  UserCircle,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/lib/contexts/sidebar-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Definir un tipo más específico para el usuario
interface User {
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
}

interface DashboardSidebarProps {
  user: User;
  handleLogout: () => Promise<void>;
  isLoggingOut: boolean;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Entidades Educativas",
    href: "/dashboard/entities",
    icon: Building2,
  },
  {
    title: "Materias",
    href: "/dashboard/subjects",
    icon: BookOpen,
  },
  {
    title: "Grupos",
    href: "/dashboard/groups",
    icon: Folders,
  },
  {
    title: "Exámenes",
    href: "/dashboard/exams",
    icon: FileText,
  },
  {
    title: "Estudiantes",
    href: "/dashboard/students",
    icon: Users,
  },
  {
    title: "Reportes",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    title: "Configuración",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Manual de Usuario",
    href: "https://docs.profevision.com",
    icon: HelpCircle,
    external: true,
  },
];

export default function DashboardSidebar({ user, handleLogout, isLoggingOut }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, toggleCollapse, isMobile } = useSidebar();

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuario';

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        <span className="sr-only">Toggle Menu</span>
      </Button>

      <div
        className={cn(
          "fixed inset-0 z-40 transform bg-background/80 backdrop-blur-sm transition-all duration-200 md:hidden",
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col justify-between bg-card transition-all duration-200 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div>
          <div className="flex h-16 items-center justify-between px-4">
            {(!isCollapsed || isMobile) && (
              <Link href="/dashboard" className="hidden md:flex items-center space-x-2">
                <span className="text-xl font-bold text-secondary">ProfeVision</span>
              </Link>
            )}
            <div className={cn("flex items-center", isCollapsed && !isMobile ? "mx-auto" : "ml-auto")}>
              {!isMobile && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCollapse}
                        className="hidden md:flex"
                      >
                        {isCollapsed ? 
                          <PanelLeftOpen className="h-5 w-5" /> : 
                          <PanelLeftClose className="h-5 w-5" />
                        }
                        <span className="sr-only">
                          {isCollapsed ? "Expandir menú" : "Contraer menú"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {isCollapsed ? "Expandir menú" : "Contraer menú"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          <nav className={cn("space-y-1 py-6", isCollapsed && !isMobile ? "px-2" : "px-4")}>
            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                    isCollapsed && !isMobile ? "justify-center px-2" : "space-x-2 px-3",
                    "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={isCollapsed && !isMobile ? item.title : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                    isCollapsed && !isMobile ? "justify-center px-2" : "space-x-2 px-3",
                    pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={isCollapsed && !isMobile ? item.title : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                </Link>
              )
            ))}
          </nav>
        </div>

        <div>
          {(!isCollapsed || isMobile) ? (
            <>
              <div className="border-t px-4 py-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-card-foreground truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Link 
                  href="/dashboard/profile" 
                  className={cn(
                    "flex items-center rounded-md px-2 py-1.5 text-sm font-medium transition-colors mb-2",
                    pathname === "/dashboard/profile" 
                      ? "bg-primary/10 text-primary" 
                      : "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  Mi perfil
                </Link>
                <Button 
                  variant="ghost"
                  size="sm" 
                  disabled={isLoggingOut} 
                  onClick={handleLogout}
                  className="w-full justify-start px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </Button>
              </div>

              <div className="border-t p-4">
                <p className="text-xs text-card-foreground">
                  &copy; {new Date().getFullYear()} ProfeVision
                </p>
              </div>
            </>
          ) : (
            <div className="border-t py-4 flex flex-col items-center gap-2">
              <Link
                href="/dashboard/profile"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                  pathname === "/dashboard/profile"
                    ? "bg-primary/10 text-primary"
                    : "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                title="Mi perfil"
              >
                <UserCircle className="h-5 w-5" />
              </Link>
              <Button 
                variant="ghost"
                size="icon" 
                disabled={isLoggingOut} 
                onClick={handleLogout}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
} 