import React from "react";

import ChatPanel from "./components/ChatPanel";
import DocumentContextBar from "./components/DocumentContextBar";
import ResultsView from "./components/ResultsView";
import { AIChatProvider } from "./components/AIChatContext";

export default async function AIExamsCreationChatPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Crear exámenes con IA</h1>
      <p className="text-sm text-muted-foreground">Experiencia de chat para generar bancos de preguntas y resúmenes. Idioma: {locale}</p>

      <div className="space-y-3">
        <DocumentContextBar />
      </div>

      <AIChatProvider>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <ChatPanel />
          <ResultsView />
        </div>
      </AIChatProvider>
    </div>
  );
}
