'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

import type { ChatMessage } from '@/lib/chat/types';

/**
 * Widget del chat.
 *
 * Cuatro decisiones que vale registrar:
 *
 * **Estado local, nada global.** Toda la conversación vive en este componente. No hay
 * store, no hay contexto, no hay nada que haga rerenderizar el sitio cuando alguien
 * escribe. El chat es un agregado; si se cae o no se monta, la página no se entera.
 *
 * **El transcript NO es una región `aria-live`.** Es el error habitual: marcar el hilo
 * como `live` hace que un lector de pantalla lea cada fragmento a medida que llega y
 * convierte una respuesta en una ametralladora. Acá la región viva es una línea de
 * estado invisible que anuncia "respondiendo" y después "respuesta lista"; el texto se
 * lee navegando, cuando la persona quiere.
 *
 * **Se lee el stream con `TextDecoder`, sin protocolo.** El endpoint devuelve texto
 * plano. Sin SSE, sin parser compartido, sin dependencia entre cliente y servidor más
 * allá de "esto son bytes UTF-8".
 *
 * **El error preserva lo que llegó.** Si el stream se corta a mitad de camino, el texto
 * parcial queda en pantalla y aparece el reintento. Borrarlo sería descartar información
 * que puede ser útil, y además esconde que algo falló.
 */

export interface ChatLabels {
  readonly close: string;
  readonly disclaimer: string;
  readonly error: string;
  readonly intro: string;
  readonly launcher: string;
  readonly placeholder: string;
  readonly ready: string;
  readonly retry: string;
  readonly send: string;
  readonly thinking: string;
  readonly title: string;
}

type Status = 'error' | 'idle' | 'streaming';

export function Chat({ labels, lang }: { labels: ChatLabels; lang: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Al abrir, el foco va al campo: quien llegó con teclado no debería tener que tabular
  // por todo el panel para escribir.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape cierra, como cualquier panel superpuesto.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // El scroll sigue a la respuesta mientras llega.
  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, status]);

  // Si el componente se desmonta con un stream abierto, se cancela: sin esto queda un
  // fetch huérfano escribiendo en un estado que ya no existe.
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (history: readonly ChatMessage[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('streaming');
      setMessages([...history, { content: '', role: 'assistant' }]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ lang, messages: history }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          setMessages((current) => appendToLast(current, chunk));
        }

        setStatus('idle');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('[chat]', error);
        setStatus('error');
      }
    },
    [lang],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || status === 'streaming') return;

    setDraft('');
    void send([...messages.filter(hasContent), { content, role: 'user' }]);
  };

  const retry = () => {
    // Se descarta el turno vacío o parcial del asistente y se reintenta con el mismo
    // historial de usuario. No se reescribe la pregunta: era válida.
    const history = messages.filter((message) => message.role === 'user' || hasContent(message));
    const lastUser = [...history].reverse().find((message) => message.role === 'user');
    if (!lastUser) return;

    const upToLastUser = history.slice(0, history.lastIndexOf(lastUser) + 1);
    void send(upToLastUser);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <section
          aria-label={labels.title}
          className="flex h-[min(70dvh,32rem)] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/40"
          role="dialog"
        >
          <header className="flex items-start justify-between gap-4 border-b border-line p-4">
            <div>
              <p className="eyebrow">{labels.title}</p>
              <p className="small mt-1 text-pretty">{labels.intro}</p>
            </div>
            <button
              aria-label={labels.close}
              className="shrink-0 rounded-md border border-line px-2 py-0.5 text-muted transition-colors duration-150 hover:border-line-strong hover:text-heading"
              onClick={() => setOpen(false)}
              type="button"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4" ref={transcriptRef}>
            {messages.filter(hasContent).map((message, index) => (
              <p
                key={index}
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-lg bg-accent-bg px-3 py-2 text-sm text-heading'
                    : 'max-w-[92%] text-sm text-pretty'
                }
              >
                {message.content}
              </p>
            ))}

            {status === 'streaming' && !messages.some(isStreamingAssistant) && (
              <p className="small">{labels.thinking}</p>
            )}

            {status === 'error' && (
              <div className="rounded-lg border border-line p-3">
                <p className="small text-pretty">{labels.error}</p>
                <button className="prose-link mt-2 text-sm" onClick={retry} type="button">
                  {labels.retry}
                </button>
              </div>
            )}
          </div>

          {/* Región viva de estado, no el transcript: anuncia que hay actividad sin leer
              cada fragmento a medida que llega. */}
          <p aria-live="polite" className="sr-only">
            {status === 'streaming' ? labels.thinking : status === 'idle' && messages.length > 0 ? labels.ready : ''}
          </p>

          <form className="border-t border-line p-3" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="chat-input">
              {labels.placeholder}
            </label>
            <textarea
              className="w-full resize-none rounded-md border border-line bg-page px-3 py-2 text-sm text-heading outline-none placeholder:text-muted focus-visible:border-line-strong"
              id="chat-input"
              maxLength={1000}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter envía, Shift+Enter hace salto de línea. Es lo que espera
                // cualquiera que haya usado un chat.
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSubmit(event);
                }
              }}
              placeholder={labels.placeholder}
              ref={inputRef}
              rows={2}
              value={draft}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-mono text-[0.6875rem] leading-tight tracking-[0.08em] text-muted">
                {labels.disclaimer}
              </p>
              <button
                className="shrink-0 rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-accent-on transition-colors duration-150 hover:bg-accent-hover disabled:opacity-40"
                disabled={status === 'streaming' || draft.trim() === ''}
                type="submit"
              >
                {labels.send}
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        aria-expanded={open}
        className="rounded-md border border-line bg-surface px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-heading shadow-lg shadow-black/30 transition-colors duration-150 hover:border-line-strong hover:text-accent"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? labels.close : labels.launcher}
      </button>
    </div>
  );
}

function hasContent(message: ChatMessage): boolean {
  return message.content.trim().length > 0;
}

function isStreamingAssistant(message: ChatMessage): boolean {
  return message.role === 'assistant' && hasContent(message);
}

function appendToLast(messages: readonly ChatMessage[], chunk: string): readonly ChatMessage[] {
  const last = messages.at(-1);
  if (!last || last.role !== 'assistant') return [...messages, { content: chunk, role: 'assistant' }];
  return [...messages.slice(0, -1), { content: last.content + chunk, role: 'assistant' }];
}
