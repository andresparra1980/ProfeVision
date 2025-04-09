"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-center bg-card px-6">
      <span className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold text-secondary md:hidden">ProfeVision</span>
      <Button variant="ghost" size="icon" className="ml-auto">
        <Bell className="h-5 w-5" />
        <span className="sr-only">Notificaciones</span>
      </Button>
    </header>
  );
} 