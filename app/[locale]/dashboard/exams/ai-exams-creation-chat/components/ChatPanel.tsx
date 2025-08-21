"use client";
import React, { useMemo, useState } from "react";
import { loadSettings, loadLastDocumentContext } from "@/lib/persistence/browser";
import { useAIChat } from "./AIChatContext";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

export default function ChatPanel() {
  const settings = useMemo(() => loadSettings(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { setResult } = useAIChat();

  async function onSend() {
    if (!input.trim()) return;
    const next = [...messages, { role: "user", content: input.trim() } as ChatMessage];
    setMessages(next);
    setInput("");
    setIsSending(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Debes iniciar sesión para usar la IA." },
        ]);
        setIsSending(false);
        return;
      }

      const lastDoc = loadLastDocumentContext();
      const payload = {
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        context: {
          documentId: lastDoc?.documentId ?? null,
          language: settings.language ?? "es",
          questionTypes: ["multiple_choice"],
          difficulty: "mixed",
          taxonomy: [],
        },
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${res.status}. ${errText || "No se pudo generar"}` },
        ]);
        setIsSending(false);
        return;
      }

      const json = await res.json();
      setResult(json);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Resultados generados. Revisa el panel de Resultados." },
      ]);
    } catch (_e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ocurrió un error inesperado. Intenta de nuevo." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="font-medium">Chat</div>
      <div className="h-64 overflow-auto rounded bg-muted/30 p-2 space-y-2 text-sm">
        {messages.length === 0 ? (
          <div className="text-muted-foreground">No hay mensajes. Escribe abajo para comenzar.</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="whitespace-pre-wrap">
              <span className="font-semibold">{m.role === "user" ? "Tú" : m.role === "assistant" ? "Asistente" : "Sistema"}:</span>{" "}
              {m.content}
            </div>
          ))
        )}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          className="flex-1 min-h-20 rounded border p-2 text-sm"
          placeholder="Describe el examen que deseas generar..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="h-10 shrink-0 rounded bg-primary px-3 text-primary-foreground disabled:opacity-50"
          onClick={onSend}
          disabled={isSending || input.trim().length === 0}
        >
          {isSending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
