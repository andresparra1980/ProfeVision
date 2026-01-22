'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Crown,
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
  Shield,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { UsageIndicator } from "@/components/shared/usage-indicator";
import { useTierLimits } from "@/lib/hooks/useTierLimits";
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations, useLocale } from 'next-intl';
import { logoFont } from '@/lib/fonts';
import { LanguageSwitcherDashboard } from '@/components/shared/language-switcher-dashboard';
import { supabase } from '@/lib/supabase/client';

// Definir un tipo más específico para el usuario
interface User {
  id?: string;
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
  const locale = useLocale();
  const [isAdmin, setIsAdmin] = useState(false);
  const { usage } = useTierLimits();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  const handleUpgradeClick = () => {
    if (!user.email) return;
    const productId = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_MONTHLY;
    const checkoutUrl = `/api/polar/checkout?products=${productId}&customerEmail=${encodeURIComponent(user.email)}`;
    window.location.href = checkoutUrl;
  };

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) return;

      try {
        const { data } = await supabase
          .from('profesores')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        setIsAdmin(data?.subscription_tier === 'admin');
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

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
      title: t('navigation.subscription', { defaultValue: 'Mi Plan' }),
      href: '/dashboard/subscription',
      icon: Crown,
    },
    // Admin item - only shown if isAdmin
    ...(isAdmin ? [{
      title: t('navigation.admin', { defaultValue: 'Admin' }),
      href: '/dashboard/admin',
      icon: Shield,
    }] : []),
    {
      title: t('navigation.settings'),
      href: '/dashboard/settings',
      icon: Settings,
    },
    {
      title: t('navigation.userManual', { defaultValue: 'Manual de Usuario' }),
      href: `https://docs.profevision.com/${locale}/docs`,
      icon: HelpCircle,
      external: true,
    },
  ];

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || t('user.defaultName', { defaultValue: 'Usuario' });

  return (
    <TooltipProvider>
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
          "fixed inset-y-0 left-0 z-40 flex flex-col justify-between bg-card transition-all duration-200 md:static md:translate-x-0 overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div>
          <div className="flex h-16 items-center justify-between px-4">
            {(!isCollapsed || isMobile) && (
              <Link href="/" className="hidden md:flex items-center space-x-2">
                <div className="relative">
                  <span className={`font-bold text-xl text-secondary dark:text-secondary ${logoFont}`}>ProfeVision</span>
                  <div className="absolute  -right-1 text-[8px] dark:text-white font-bold px-1 py-0.5 rounded-full leading-none">
                    Beta
                  </div>
                </div>
              </Link>
            )}
            <div className={cn("flex items-center", isCollapsed && !isMobile ? "mx-auto" : "ml-auto")}>
              {!isMobile && (
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
              )}
            </div>
          </div>

          <nav className={cn("space-y-1 py-6", isCollapsed && !isMobile ? "px-2" : "px-4")}>
            {navItems.map((item) => (
              item.external ? (
                isCollapsed && !isMobile ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                          "justify-center px-2",
                          "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                      "space-x-2 px-3",
                      "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </a>
                )
              ) : (
                isCollapsed && !isMobile ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={item.href as any}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                          "justify-center px-2",
                          pathname === item.href
                            ? "bg-primary/10 text-primary"
                            : "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    key={item.href}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={item.href as any}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                      "space-x-2 px-3",
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                )
              )
            ))}
          </nav>
        </div>

        <div>
          {(!isCollapsed || isMobile) ? (
            <>
              {/* Credits & Usage Section */}
              {usage && (
                <div className="px-4 py-3 border-t border-border/50">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <UsageIndicator
                        label={t('credits.aiGenerations', { defaultValue: 'Generaciones AI' })}
                        used={usage.ai_generation.used}
                        limit={usage.ai_generation.limit}
                        hideLabel={false}
                        className="text-xs"
                      />
                      <UsageIndicator
                        label={t('credits.exams', { defaultValue: 'Escaneos' })}
                        used={usage.scans.used}
                        limit={usage.scans.limit}
                        hideLabel={false}
                        className="text-xs"
                      />
                    </div>

                    {usage.tier.name === 'free' && (
                      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
                            size="sm"
                          >
                            {t('credits.upgradeToPlus', { defaultValue: 'Actualizar a Plus' })}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                              <Crown className="h-6 w-6 text-purple-500" />
                              {t('upgrade.title', { defaultValue: 'Mejora tu Plan a Plus' })}
                            </DialogTitle>
                            <DialogDescription>
                              {t('upgrade.description', { defaultValue: 'Desbloquea todo el potencial de ProfeVision y elimina los límites.' })}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">{t('upgrade.benefits', { defaultValue: 'Beneficios incluidos:' })}</h4>
                              <ul className="text-sm text-muted-foreground space-y-2 mt-2">
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-green-500" />
                                  {t('upgrade.benefit1', { defaultValue: 'Generaciones AI Ilimitadas' })}
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-green-500" />
                                  {t('upgrade.benefit2', { defaultValue: 'Escaneos y Calificaciones Ilimitadas' })}
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="h-4 w-4 text-green-500" />
                                  {t('upgrade.benefit3', { defaultValue: 'Acceso prioritario a nuevas funciones' })}
                                </li>
                              </ul>
                            </div>
                          </div>

                          <DialogFooter>
                            <Button onClick={handleUpgradeClick} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0">
                              {t('upgrade.cta', { defaultValue: 'Obtener Plus Ahora' })}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              )}

              {/* Language Switcher */}
              <div className="px-4 py-3">
                <LanguageSwitcherDashboard />
              </div>

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
                <p className={`text-xs text-card-foreground ${logoFont}`}>
                  &copy; {new Date().getFullYear()} ProfeVision
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Language Switcher - Collapsed Version */}
              <LanguageSwitcherDashboard collapsed />

              <div className="border-t py-4 flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/dashboard/profile"
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                        pathname === "/dashboard/profile"
                          ? "bg-primary/10 text-primary"
                          : "text-card-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <UserCircle className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t('user.myProfile', { defaultValue: 'Mi perfil' })}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isLoggingOut}
                      onClick={handleLogout}
                      className="text-destructive hover:bg-destructive/10 text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t('user.logout', { defaultValue: 'Cerrar sesión' })}
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
} 