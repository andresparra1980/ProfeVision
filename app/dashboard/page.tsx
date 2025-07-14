import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Users,
  BarChart3,
  Zap,
} from "lucide-react";
import { DevelopmentOverlay } from "@/components/shared/development-overlay";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido a ProfeVision, tu plataforma de gestión de exámenes.
        </p>
      </div>

      <DevelopmentOverlay>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Exámenes creados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 desde el último mes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Estudiantes evaluados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">348</div>
              <p className="text-xs text-muted-foreground">
                +42 desde el último mes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Promedio general</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78.3%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% desde el último mes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Tiempo ahorrado</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24h 36m</div>
              <p className="text-xs text-muted-foreground">
                +3h desde el último mes
              </p>
            </CardContent>
          </Card>
        </div>
      </DevelopmentOverlay>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <DevelopmentOverlay className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad reciente</CardTitle>
              <CardDescription>
                Últimas actividades en tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 rounded-md border p-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Examen de Matemáticas creado</p>
                  <p className="text-xs text-muted-foreground">
                    Has creado un nuevo examen de Matemáticas para 9° grado.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">Hace 2 horas</div>
              </div>
              <div className="flex items-center gap-4 rounded-md border p-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Grupo de estudiantes añadido</p>
                  <p className="text-xs text-muted-foreground">
                    Has añadido 24 estudiantes a la clase de Física.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">Hace 1 día</div>
              </div>
              <div className="flex items-center gap-4 rounded-md border p-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Examen calificado</p>
                  <p className="text-xs text-muted-foreground">
                    Has calificado el examen de Biología para 32 estudiantes.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">Hace 3 días</div>
              </div>
            </CardContent>
          </Card>
        </DevelopmentOverlay>
        <DevelopmentOverlay className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Próximos exámenes</CardTitle>
              <CardDescription>
                Exámenes programados para los próximos días
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1 rounded-md border p-4">
                <p className="text-sm font-medium">Química - 10° Grado</p>
                <p className="text-xs text-muted-foreground">22 de Mayo, 2024</p>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-full w-[75%] rounded-full bg-primary"></div>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-md border p-4">
                <p className="text-sm font-medium">Historia - 11° Grado</p>
                <p className="text-xs text-muted-foreground">24 de Mayo, 2024</p>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-full w-[40%] rounded-full bg-primary"></div>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-md border p-4">
                <p className="text-sm font-medium">Física - 9° Grado</p>
                <p className="text-xs text-muted-foreground">27 de Mayo, 2024</p>
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