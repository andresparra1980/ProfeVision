'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  Users,
  BarChart3,
  Zap,
} from 'lucide-react';
import { DevelopmentOverlay } from '@/components/shared/development-overlay';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('main.title')}</h1>
        <p className="text-muted-foreground">{t('main.welcome')}</p>
      </div>

      <DevelopmentOverlay>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{t('main.metrics.examsCreated')}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 {t('main.metrics.sinceLastMonth')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{t('main.metrics.studentsEvaluated')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">348</div>
              <p className="text-xs text-muted-foreground">+42 {t('main.metrics.sinceLastMonth')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{t('main.metrics.averageScore')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78.3%</div>
              <p className="text-xs text-muted-foreground">+2.1% {t('main.metrics.sinceLastMonth')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{t('main.metrics.timeSaved')}</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24h 36m</div>
              <p className="text-xs text-muted-foreground">+3h {t('main.metrics.sinceLastMonth')}</p>
            </CardContent>
          </Card>
        </div>
      </DevelopmentOverlay>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <DevelopmentOverlay className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('main.recentActivity')}</CardTitle>
              <CardDescription>{t('main.recentActivityDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 rounded-md border p-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('main.activity.examCreated')}</p>
                  <p className="text-xs text-muted-foreground">{t('main.activity.examCreatedDesc')}</p>
                </div>
                <div className="text-xs text-muted-foreground">{t('main.activity.ago2h')}</div>
              </div>
              <div className="flex items-center gap-4 rounded-md border p-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('main.activity.groupAdded')}</p>
                  <p className="text-xs text-muted-foreground">{t('main.activity.groupAddedDesc')}</p>
                </div>
                <div className="text-xs text-muted-foreground">{t('main.activity.ago1d')}</div>
              </div>
              <div className="flex items-center gap-4 rounded-md border p-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('main.activity.examGraded')}</p>
                  <p className="text-xs text-muted-foreground">{t('main.activity.examGradedDesc')}</p>
                </div>
                <div className="text-xs text-muted-foreground">{t('main.activity.ago3d')}</div>
              </div>
            </CardContent>
          </Card>
        </DevelopmentOverlay>
        <DevelopmentOverlay className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('main.upcomingExams')}</CardTitle>
              <CardDescription>{t('main.upcomingExamsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1 rounded-md border p-4">
                <p className="text-sm font-medium">{t('main.upcoming.chemistry')}</p>
                <p className="text-xs text-muted-foreground">{t('main.upcoming.chemistryDate')}</p>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-full w-[75%] rounded-full bg-primary"></div>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-md border p-4">
                <p className="text-sm font-medium">{t('main.upcoming.history')}</p>
                <p className="text-xs text-muted-foreground">{t('main.upcoming.historyDate')}</p>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-full w-[40%] rounded-full bg-primary"></div>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-md border p-4">
                <p className="text-sm font-medium">{t('main.upcoming.physics')}</p>
                <p className="text-xs text-muted-foreground">{t('main.upcoming.physicsDate')}</p>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-full w-[10%] rounded-full bg-primary"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </DevelopmentOverlay>
      </div>
    </div>
  );
} 