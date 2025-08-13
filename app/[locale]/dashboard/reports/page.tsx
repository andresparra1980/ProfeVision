"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart, Users, BookOpen, FileText } from "lucide-react";
import { DevelopmentOverlay } from "@/components/shared/development-overlay";
import { useTranslations } from "next-intl";

export default function ReportsPage() {
  const t = useTranslations('dashboard.reports');

  const stats = [
    {
      title: t('stats.totalExams'),
      value: "0",
      icon: FileText,
      description: t('stats.examsCreated'),
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: t('stats.totalStudents'),
      value: "0",
      icon: Users,
      description: t('stats.studentsRegistered'),
      color: "bg-green-100 text-green-700",
    },
    {
      title: t('stats.totalSubjects'),
      value: "0",
      icon: BookOpen,
      description: t('stats.subjectsCreated'),
      color: "bg-purple-100 text-purple-700",
    },
    {
      title: t('stats.applications'),
      value: "0",
      icon: FileBarChart,
      description: t('stats.examsApplied'),
      color: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <DevelopmentOverlay>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.color} rounded-full p-2`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </DevelopmentOverlay>

      <DevelopmentOverlay>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('charts.examPerformance.title')}</CardTitle>
              <CardDescription>
                {t('charts.examPerformance.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border rounded">
                <p className="text-muted-foreground">{t('charts.noDataAvailable')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('charts.gradeDistribution.title')}</CardTitle>
              <CardDescription>
                {t('charts.gradeDistribution.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border rounded">
                <p className="text-muted-foreground">{t('charts.noDataAvailable')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DevelopmentOverlay>

      <DevelopmentOverlay>
        <Card>
          <CardHeader>
            <CardTitle>{t('charts.studentPerformance.title')}</CardTitle>
            <CardDescription>
              {t('charts.studentPerformance.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 flex items-center justify-center border rounded">
              <p className="text-muted-foreground">{t('charts.noDataAvailable')}</p>
            </div>
          </CardContent>
        </Card>
      </DevelopmentOverlay>
    </div>
  );
} 