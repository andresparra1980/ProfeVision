"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart, Users, BookOpen, FileText } from "lucide-react";
import { DevelopmentOverlay } from "@/components/shared/development-overlay";

export default function ReportsPage() {
  const stats = [
    {
      title: "Total Exámenes",
      value: "0",
      icon: FileText,
      description: "Exámenes creados",
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Total Estudiantes",
      value: "0",
      icon: Users,
      description: "Estudiantes registrados",
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Total Materias",
      value: "0",
      icon: BookOpen,
      description: "Materias creadas",
      color: "bg-purple-100 text-purple-700",
    },
    {
      title: "Aplicaciones",
      value: "0",
      icon: FileBarChart,
      description: "Exámenes aplicados",
      color: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
        <p className="text-muted-foreground">
          Visualiza estadísticas y análisis del desempeño de tus estudiantes
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
              <CardTitle>Rendimiento por Examen</CardTitle>
              <CardDescription>
                Puntuaciones promedio en exámenes recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border rounded">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Calificaciones</CardTitle>
              <CardDescription>
                Distribución de calificaciones por rango
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border rounded">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DevelopmentOverlay>

      <DevelopmentOverlay>
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Estudiante</CardTitle>
            <CardDescription>
              Análisis del rendimiento individual de los estudiantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 flex items-center justify-center border rounded">
              <p className="text-muted-foreground">No hay datos disponibles</p>
            </div>
          </CardContent>
        </Card>
      </DevelopmentOverlay>
    </div>
  );
} 