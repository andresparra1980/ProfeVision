'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';

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

export default function DashboardSidebar({ user, handleLogout, isLoggingOut }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, isMobile, isOpen, setIsOpen } = useSidebar();
  const t = useTranslations('dashboard');

  const navItems = [
    {
      title: t('navigation.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: t('navigation.entities', { defaultValue: 'Entidades Educativas' }),
      href: '/dashboard/entities',
      icon: Building2,
    },
    {
      title: t('navigation.subjects'),
      href: '/dashboard/subjects',
      icon: BookOpen,
    },
    {
      title: t('navigation.groups'),
      href: '/dashboard/groups',
      icon: Folders,
    },
    {
      title: t('navigation.exams'),
      href: '/dashboard/exams',
      icon: FileText,
    },
    {
      title: t('navigation.students'),
      href: '/dashboard/students',
      icon: Users,
    },
    {
      title: t('navigation.reports'),
      href: '/dashboard/reports',
      icon: BarChart3,
    },
    {
      title: t('navigation.settings'),
      href: '/dashboard/settings',
      icon: Settings,
    },
    {
      title: t('navigation.userManual', { defaultValue: 'Manual de Usuario' }),
      href: 'https://docs.profevision.com',
      icon: HelpCircle,
      external: true,
    },
  ];

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || t('user.defaultName', { defaultValue: 'Usuario' });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        <span className="sr-only">{t('ui.toggleMenu', { defaultValue: 'Toggle Menu' })}</span>
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
                <div className="relative">
                  <span className="font-bold text-xl text-secondary dark:text-secondary">ProfeVision</span>
                  <div className="absolute  -right-1 text-[8px] dark:text-white font-bold px-1 py-0.5 rounded-full leading-none">
                    Beta
                  </div>
                </div>
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
                          {isCollapsed ? t('ui.expandMenu', { defaultValue: 'Expandir menú' }) : t('ui.collapseMenu', { defaultValue: 'Contraer menú' })}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {isCollapsed ? t('ui.expandMenu', { defaultValue: 'Expandir menú' }) : t('ui.collapseMenu', { defaultValue: 'Contraer menú' })}
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
                  href={item.href as any}
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
                  {t('user.myProfile', { defaultValue: 'Mi perfil' })}
                </Link>
                <Button 
                  variant="ghost"
                  size="sm" 
                  disabled={isLoggingOut} 
                  onClick={handleLogout}
                  className="w-full justify-start px-2 hover:bg-destructive/10 text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? t('user.loggingOut', { defaultValue: 'Cerrando sesión...' }) : t('user.logout', { defaultValue: 'Cerrar sesión' })}
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
                title={t('user.myProfile', { defaultValue: 'Mi perfil' })}
              >
                <UserCircle className="h-5 w-5" />
              </Link>
              <Button 
                variant="ghost"
                size="icon" 
                disabled={isLoggingOut} 
                onClick={handleLogout}
                className="text-destructive hover:bg-destructive/10 text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                title={t('user.logout', { defaultValue: 'Cerrar sesión' })}
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