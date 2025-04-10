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
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { Separator } from "@/components/ui/separator";

interface DashboardSidebarProps {
  user: any;
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
];

export default function DashboardSidebar({ user, handleLogout, isLoggingOut }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between bg-card transition-transform duration-200 md:static md:translate-x-0",
          "border-r border-muted/20 dark:border-muted/40",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/dashboard" className="hidden md:flex items-center space-x-2">
              <span className="text-xl font-bold text-secondary">ProfeVision</span>
            </Link>
            <div className="flex-1 md:flex-none flex justify-end">
              <ModeToggle />
            </div>
          </div>

          <nav className="space-y-1 px-4 py-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <div className="border-t px-4 py-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-card-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Link href="/dashboard/profile" className="mb-2 block w-full">
              <Button variant="ghost" size="sm" className="w-full justify-start px-2">
                <UserCircle className="mr-2 h-4 w-4" />
                Mi perfil
              </Button>
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
        </div>
      </aside>
    </>
  );
} 