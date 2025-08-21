"use client";
import React, { useEffect, useMemo, useState } from "react";
import { loadSettings, saveSettings, type SettingsV1 } from "@/lib/persistence/browser";

export default function SettingsPanel() {
  const initial = useMemo(() => loadSettings(), []);
  const [settings, setSettings] = useState<SettingsV1>(initial);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="font-medium">Configuración</div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm items-center">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Idioma</span>
          <select
            className="rounded border p-2 bg-background"
            value={settings.language}
            onChange={(e) => setSettings((s) => ({ ...s, language: e.target.value }))}
          >
            <option value="es">Español</option>
            <option value="en">Inglés</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Tema</span>
          <select
            className="rounded border p-2 bg-background"
            value={settings.theme}
            onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value as SettingsV1["theme"] }))}
          >
            <option value="system">Sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Modelo por defecto</span>
          <input
            className="rounded border p-2"
            placeholder="google/gemini-2.5-flash-lite"
            value={settings.defaultModel ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, defaultModel: e.target.value }))}
          />
        </label>
      </div>
    </div>
  );
}
