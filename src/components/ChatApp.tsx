"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { OrientationCard } from "@/components/OrientationCard";
import type { ChatMessage, TriageResponse } from "@/lib/types";

const STARTERS = ["Dolor de cabeza", "Fiebre", "Dolor abdominal", "Golpe o caída"];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hola. Te ayudo a saber a qué nivel de atención acudir. No diagnostico ni receto. Si te falta el aire, duele el pecho o te sientes muy mal, ve ya a Urgencias.",
};

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [eps, setEps] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;

    const nextMessages = [...messages, { id: crypto.randomUUID(), role: "user" as const, content }];
    setMessages(nextMessages);
    setDraft("");
    setPending(true);
    setResult(null);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eps,
          messages: nextMessages
            .filter((message) => message.id !== "welcome")
            .map(({ role, content: textContent }) => ({ role, content: textContent })),
        }),
      });
      const data = (await response.json()) as TriageResponse;
      setResult(data);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: data.message },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "No pude completar la orientación. Si te sientes mal, busca atención.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  const replies = result?.quickReplies ?? (messages.length === 1 ? STARTERS : []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6">
      <header className="mb-4">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-900">Sistema de salud</p>
        <h1 className="text-3xl font-bold leading-tight text-slate-950">Navegador del paciente</h1>
        <p className="mt-2 text-lg text-slate-800">
          Orientación en lenguaje sencillo. No es un diagnóstico ni una receta.
        </p>
      </header>

      <label className="mb-4 block text-base font-bold text-slate-900">
        EPS (opcional)
        <input
          value={eps}
          onChange={(event) => setEps(event.target.value)}
          placeholder="Ej. Nueva EPS"
          className="mt-1 w-full rounded-xl border-2 border-slate-400 bg-white px-3 py-3 text-lg"
        />
      </label>

      <section aria-live="polite" className="flex flex-1 flex-col gap-3">
        {messages.map((message) => (
          <p
            key={message.id}
            className={
              message.role === "user"
                ? "ml-8 rounded-2xl bg-blue-800 px-4 py-3 text-lg text-white"
                : "mr-8 rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-lg text-slate-950"
            }
          >
            {message.content}
          </p>
        ))}
        {result?.card && <OrientationCard card={result.card} />}
      </section>

      {replies.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {replies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => void send(reply)}
              className="rounded-full border-2 border-blue-900 bg-white px-4 py-2 text-base font-bold text-blue-950"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="mensaje">
          Describe tu malestar
        </label>
        <input
          id="mensaje"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Cuéntame qué sientes"
          className="min-h-14 flex-1 rounded-xl border-2 border-slate-500 bg-white px-3 text-lg"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-blue-900 px-4 text-lg font-bold text-white disabled:opacity-60"
        >
          <Send size={20} aria-hidden />
          Enviar
        </button>
      </form>
    </main>
  );
}
