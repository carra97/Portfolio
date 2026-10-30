'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';

import type { ChatMessage } from '@/lib/chat/types';

/**
 * Widget del chat.
 *
 * Cuatro decisiones que vale registrar:
 *
 * **Estado local, nada global — y montado en el layout, no en la página.** Toda la
 * conversación vive en este componente: no hay store, no hay contexto, no hay nada que
 * haga rerenderizar el sitio cuando alguien escribe.
 *
 * Que se monte en `app/[lang]/layout.tsx` y no en `PageShell` es lo que hace que eso
 * alcance. Un layout del App Router **persiste mientras se navega entre sus rutas
 * hijas**: el componente no se desmonta al ir de `/es` a `/es/projects`, así que la
 * conversación sigue ahí y —lo que más importa— un stream en curso no se corta. Montado
 * en la página, cada navegación lo desmontaba, el efecto de limpieza abortaba el `fetch`
 * y la respuesta se perdía a mitad de generación.
 *
 * La alternativa habría sido serializar a `sessionStorage` y restaurar al montar. Es más
 * código, más superficie (la conversación queda escrita en el navegador) y **no resuelve
 * el caso que importa**: el stream abortado igual se pierde. Persistir sirve para
 * sobrevivir a una recarga completa, que es un problema distinto y hoy no está resuelto.
 *
 * El límite conocido: cambiar de idioma cruza el segmento `[lang]`, así que ahí sí se
 * remonta y la conversación empieza de nuevo. Es defendible — cambió el idioma en el que
 * se estaba hablando.
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
  /**
   * Presentación de Raukar, mostrada al abrir el panel.
   *
   * **Es un string del contenido, no una respuesta del modelo.** Generarla costaría una
   * llamada, tokens y un segundo de espera para producir un texto que siempre dice lo
   * mismo — y que además podría salir distinto cada vez, que es justo lo contrario de lo
   * que se quiere de una presentación. Se renderiza como burbuja del asistente pero
   * **no entra en `messages`**: no es historial, así que nunca viaja a la API como un
   * turno que el modelo no dijo.
   */
  readonly greeting: string;
  readonly launcher: string;
  readonly placeholder: string;
  readonly ready: string;
  readonly retry: string;
  readonly send: string;
  readonly thinking: string;
  readonly title: string;
}

export interface AvatarSources {
  /** Pose en reposo. Sin esto, el avatar cae al monograma. */
  readonly base: string | null;
}

export interface ChatProps {
  readonly avatar: AvatarSources;
  readonly labels: ChatLabels;
  readonly lang: string;
  /**
   * Rutas del sitio que se convierten en links dentro de las respuestas.
   *
   * **Es una lista blanca, y ese es todo el punto.** Se enlaza únicamente lo que el
   * registro de páginas declara: no se parsea texto buscando algo con forma de URL, así
   * que el modelo no puede producir un link a un dominio externo ni a una ruta que no
   * exista. Si inventa `/es/blog`, sale como texto y se ve que está mal — que es
   * exactamente el comportamiento que se quiere.
   */
  readonly routes: readonly string[];
}

type Status = 'error' | 'idle' | 'streaming';

export function Chat({ avatar, labels, lang, routes }: ChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const linkify = useMemo(() => createLinkifier(routes), [routes]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** Si la persona está leyendo el final del hilo. Ver el efecto de scroll. */
  const pinnedRef = useRef(true);

  // Al abrir, el foco va al campo: quien llegó con teclado no debería tener que tabular
  // por todo el panel para escribir.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /**
   * Cerrar devuelve el foco al lanzador. El panel se desmonta con el foco adentro; sin
   * esto el foco cae al `<body>` y quien navega con teclado vuelve al principio de la
   * página (WCAG 2.4.3).
   */
  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  // Escape cierra, como cualquier panel superpuesto.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  /**
   * El scroll sigue a la respuesta solo si la persona ya estaba al final. Si subió a
   * releer, cada fragmento nuevo la arrastraba de vuelta abajo en mitad de la lectura.
   */
  useEffect(() => {
    const node = transcriptRef.current;
    if (node && pinnedRef.current) node.scrollTop = node.scrollHeight;
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
    // Quien manda un mensaje quiere ver la respuesta: vuelve a seguir el final.
    pinnedRef.current = true;
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
            {/* Solo el avatar y el nombre. La presentación va como primera burbuja del
                hilo: decir lo mismo en la cabecera y adentro es la clase de repetición
                que hace que un asistente se sienta un formulario. */}
            <div className="flex items-center gap-2.5">
              <Avatar
                size="sm"
                sources={avatar}
                state={status === 'streaming' ? 'thinking' : 'idle'}
              />
              <p className="eyebrow">{labels.title}</p>
            </div>
            <button
              aria-label={labels.close}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line text-muted transition-colors duration-150 hover:border-line-strong hover:text-heading"
              onClick={close}
              type="button"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </header>

          <div
            className="flex-1 space-y-4 overflow-y-auto p-4"
            onScroll={(event) => {
              // 48px de tolerancia: un scroll que quedó a un renglón del final sigue
              // contando como "al final".
              const node = event.currentTarget;
              pinnedRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
            }}
            ref={transcriptRef}
          >
            <p className="max-w-[92%] text-sm text-pretty">{labels.greeting}</p>

            {messages.filter(hasContent).map((message, index) => (
              <p
                key={index}
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-lg bg-accent-bg px-3 py-2 text-sm text-heading'
                    : 'max-w-[92%] text-sm text-pretty'
                }
              >
                {message.role === 'assistant' ? linkify(message.content) : message.content}
              </p>
            ))}

            {/*
              Indicador de espera. Se muestra desde que se manda el mensaje hasta que
              llega el primer fragmento de texto — a partir de ahí el texto que aparece
              ES la señal de que algo está pasando, y dejar los puntos puestos sería
              ruido duplicado.

              Antes esto era una línea de texto chica y se perdía. Tres puntos con
              rebote es el lenguaje que ya entiende cualquiera que haya usado un chat, y
              se ve sin necesidad de leer. Va con el avatar en estado "pensando", que es
              lo que ata la espera a quién está respondiendo.

              `aria-hidden` a propósito: la espera ya se anuncia en la región de estado
              de más abajo. Anunciarla dos veces es peor que no anunciarla.
            */}
            {status === 'streaming' && !messages.some(isStreamingAssistant) && (
              <div aria-hidden="true" className="flex items-center gap-2.5">
                <Avatar size="sm" sources={avatar} state="thinking" />
                <span className="flex items-center gap-1 rounded-full border border-line px-3 py-2.5">
                  {[0, 1, 2].map((index) => (
                    <span
                      className="raukar-dot h-1.5 w-1.5 rounded-full bg-muted"
                      key={index}
                      style={{ animationDelay: `${index * 0.16}s` }}
                    />
                  ))}
                </span>
              </div>
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
              className="w-full resize-none rounded-md border border-line bg-page px-3 py-2 text-sm text-heading placeholder:text-muted"
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
              {/* Es el texto con más peso legal del widget: no puede ser el más chico. */}
              <p className="small leading-snug">
                {labels.disclaimer}
              </p>
              <button
                className="h-11 shrink-0 rounded-md bg-accent px-5 text-sm font-medium text-accent-on transition-colors duration-150 hover:bg-accent-hover disabled:opacity-40"
                disabled={status === 'streaming' || draft.trim() === ''}
                type="submit"
              >
                {labels.send}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Sin saludo proactivo. Existió y tapaba el CTA y la ficha del hero en mobile,
          justo a quien entra por primera vez: un elemento flotante no tapa contenido
          sin que la persona lo pida. La presentación vive adentro del panel. */}
      <button
        aria-expanded={open}
        aria-label={open ? labels.close : labels.launcher}
        className="flex items-center gap-2.5 rounded-full bg-accent py-2 pl-2 pr-4 text-accent-on shadow-xl shadow-black/40 transition-colors duration-150 hover:bg-accent-hover"
        onClick={() => (open ? close() : setOpen(true))}
        ref={launcherRef}
        type="button"
      >
        <Avatar size="md" sources={avatar} tone="inverse" />
        <span className="font-mono text-xs uppercase tracking-[0.12em]">
          {open ? labels.close : labels.launcher}
        </span>
      </button>
    </div>
  );
}

/**
 * Avatar de Raukar.
 *
 * **Decorativo en los lugares donde aparece**, y por eso `aria-hidden`: al lado siempre
 * hay texto que dice quién es. Un `alt` acá solo agregaría ruido a un lector de
 * pantalla, que escucharía el nombre dos veces.
 *
 * **Sin el archivo cae al monograma.** El muñeco es un binario que se agrega aparte del
 * contenido; `publicAsset` resuelve en build si está. Referenciarlo a ciegas dejaría un
 * ícono roto el día que falte, que es peor que no tenerlo.
 *
 * **Quieto en reposo.** Solo se mueve mientras responde, porque ahí el movimiento
 * comunica estado (DISENO.md §5). Un muñeco que respira en una esquina de cada página
 * es un loop permanente compitiendo con la lectura.
 */
const AVATAR_BOX: Readonly<Record<AvatarSize, string>> = {
  md: 'h-10 w-10',
  sm: 'h-8 w-8',
};

type AvatarSize = 'md' | 'sm';
type AvatarState = 'idle' | 'thinking';

function Avatar({
  size,
  sources,
  state = 'idle',
  tone = 'accent',
}: {
  size: AvatarSize;
  sources: AvatarSources;
  state?: AvatarState;
  tone?: 'accent' | 'inverse';
}) {
  const box = AVATAR_BOX[size];
  const motion = state === 'thinking' ? 'raukar-thinking raukar-ring' : '';

  if (!sources.base) {
    const colors = tone === 'inverse' ? 'bg-accent-on/15 text-accent-on' : 'bg-accent-bg text-accent';
    return (
      <span
        aria-hidden="true"
        className={`${box} ${colors} ${motion} relative grid shrink-0 place-items-center rounded-full font-mono text-sm font-medium`}
      >
        R
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${box} ${motion} relative shrink-0`}
    >
      {/* El recorte circular va en un elemento interno: si `overflow-hidden` estuviera en
          el de afuera, se comería el anillo del estado "pensando", que se dibuja por
          fuera del borde. */}
      <span className="relative block h-full w-full overflow-hidden rounded-full bg-accent-bg">
        {/* `<img>` y no `next/image`: el sitio no usa optimizador (README §10) y el
            archivo ya se sirve en su tamaño final. Dimensiones explícitas para que no
            haya salto de layout mientras carga. */}
        {/* `scale-[1.5]`: el dibujo es de cuerpo entero y a 32-40px la cara quedaría
            en veinte píxeles. Se acerca con `transform` en vez de mantener un segundo
            recorte del mismo archivo. */}
        <img
          alt=""
          className="h-full w-full origin-top scale-[1.5] object-cover object-top"
          height={384}
          src={sources.base}
          width={384}
        />
      </span>
    </span>
  );
}

/**
 * Convierte en links las rutas del sitio que aparezcan en una respuesta.
 *
 * **Lista blanca, no detección de URLs.** Solo se enlaza lo que el registro de páginas
 * declara. No hay parseo de "algo que parezca un link", así que el modelo no puede
 * generar un enlace a un dominio externo ni a una ruta inexistente: si inventa algo,
 * queda como texto plano y se nota. Es la diferencia entre enlazar datos verificados y
 * enlazar la salida de un modelo.
 *
 * Las rutas se ordenan de más larga a más corta para que `/es/projects` gane sobre `/es`
 * y no quede media ruta enlazada.
 */
function createLinkifier(routes: readonly string[]): (text: string) => ReactNode {
  const ordered = [...routes].sort((a, b) => b.length - a.length);

  if (ordered.length === 0) return (text) => text;

  const pattern = new RegExp(`(${ordered.map(escapeRegExp).join('|')})`, 'g');
  const known = new Set(ordered);

  return (text: string) => {
    const parts = text.split(pattern);
    if (parts.length === 1) return text;

    return parts.map((part, index) => {
      if (!known.has(part)) return part;

      // El CV es un archivo estático, no una ruta del router: con `<Link>` se intentaría
      // una navegación de cliente hacia algo que no es una página. `<a download>` es lo
      // correcto y además hace lo que la persona espera al pedir el CV.
      if (part.endsWith('.pdf')) {
        return (
          <a className="prose-link" download href={part} key={index}>
            {part}
          </a>
        );
      }

      return (
        <Link className="prose-link" href={part} key={index}>
          {part}
        </Link>
      );
    });
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
