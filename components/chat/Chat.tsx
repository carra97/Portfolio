'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  /** Saludo proactivo del inicio. Ver `useFirstVisitNudge`. */
  readonly nudge: string;
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
  /**
   * Hoja de seis cuadros del saludo, en una sola imagen horizontal.
   *
   * Es lo que permite mover **la mano** en vez de la figura entera. Los seis vienen de la
   * misma generación y se verificó que lo sean: los pies caen en la misma fila en los
   * seis y la distancia entre los ojos varía un 3%, así que el personaje no salta entre
   * cuadros. Se alinearon por el eje de los ojos antes de armar la hoja.
   *
   * Una imagen y una animación de `background-position`, sin JavaScript: el navegador no
   * tiene que decodificar seis archivos ni sincronizar nada.
   */
  readonly sequence: string | null;
  /**
   * Segundo cuadro con el brazo levantado. Opcional: sin él el saludo se resuelve
   * moviendo la figura entera, que es lo mejor que se puede hacer con un solo dibujo.
   */
  readonly wave: string | null;
}

export interface ChatProps {
  readonly avatar: AvatarSources;
  readonly labels: ChatLabels;
  readonly lang: string;
  /** Ruta del inicio en este idioma. Decide dónde aparece el saludo proactivo. */
  readonly homeHref: string;
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

export function Chat({ avatar, homeHref, labels, lang, routes }: ChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const pathname = usePathname();
  const { dismissNudge, showNudge } = useFirstVisitNudge({
    enabled: pathname === homeHref && !open,
  });

  const linkify = useMemo(() => createLinkifier(routes), [routes]);

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
              onClick={() => setOpen(false)}
              type="button"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4" ref={transcriptRef}>
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

      {/* Saludo proactivo. Aparece solo en el inicio y solo la primera vez; después el
          lanzador queda solo. `role="status"` lo anuncia una vez a un lector de
          pantalla sin robar el foco ni bloquear nada. */}
      {showNudge && !open && (
        <div
          className="flex max-w-[min(86vw,21rem)] items-end gap-2 rounded-xl border border-line bg-surface p-3 shadow-xl shadow-black/30"
          role="status"
        >
          {avatar.sequence ? (
            <span
              aria-hidden="true"
              className="raukar-wave-frames h-28 shrink-0 self-end"
              style={{ backgroundImage: `url(${avatar.sequence})` }}
            />
          ) : (
            <Avatar size="lg" sources={avatar} state="waving" />
          )}
          <button
            className="flex-1 text-left text-sm text-pretty text-heading"
            onClick={() => {
              dismissNudge();
              setOpen(true);
            }}
            type="button"
          >
            {labels.nudge}
          </button>
          <button
            aria-label={labels.close}
            className="-mr-1.5 grid h-11 w-11 shrink-0 place-items-center self-start rounded-md text-muted transition-colors duration-150 hover:text-heading"
            onClick={dismissNudge}
            type="button"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}

      {/* Lanzador con avatar. Antes era un botón de texto sobre `bg-surface`: se perdía
          contra la página. Ahora usa el color de acento y una marca redonda, que es lo
          que hace que se lea como "hay alguien acá" y no como un link más del pie. */}
      <button
        aria-expanded={open}
        aria-label={open ? labels.close : labels.launcher}
        className="flex items-center gap-2.5 rounded-full bg-accent py-2 pl-2 pr-4 text-accent-on shadow-xl shadow-black/40 transition-colors duration-150 hover:bg-accent-hover"
        onClick={() => {
          dismissNudge();
          setOpen((value) => !value);
        }}
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
 * **Decorativo en los tres lugares donde aparece**, y por eso `aria-hidden`: al lado
 * siempre hay texto que dice quién es. Un `alt` acá solo agregaría ruido a un lector de
 * pantalla, que escucharía el nombre dos veces.
 *
 * **Sin el archivo cae al monograma.** El muñeco es un binario que se agrega aparte del
 * contenido; `publicAsset` resuelve en build si está. Referenciarlo a ciegas dejaría un
 * ícono roto el día que falte, que es peor que no tenerlo.
 *
 * La animación vive en CSS (`app/globals.css`) y no en JavaScript: corre en el
 * compositor, pesa cero y ya queda cubierta por el bloque global de
 * `prefers-reduced-motion`, que apaga todo movimiento del sitio de una sola vez.
 */
const AVATAR_BOX: Readonly<Record<AvatarSize, string>> = {
  lg: 'h-16 w-16',
  md: 'h-10 w-10',
  sm: 'h-8 w-8',
};

type AvatarSize = 'lg' | 'md' | 'sm';
type AvatarState = 'idle' | 'thinking' | 'waving';

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
  const motion =
    state === 'thinking'
      ? 'raukar-thinking raukar-ring'
      : state === 'waving'
        ? 'raukar-wave'
        : 'raukar-idle';

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

  /**
   * El saludo real —brazo levantado— necesita el segundo dibujo. Con uno solo el muñeco
   * se inclina y rebota: se lee como entusiasmo, no como una mano saludando.
   */
  const waving = state === 'waving' && Boolean(sources.wave);

  /**
   * Un solo archivo para los tres tamaños, y el recorte lo hace el CSS.
   *
   * El encuadre incluye la mano levantada, que a 64px se lee; a 32px, en cambio, la
   * cabeza quedaría en veinte píxeles y no se reconocería nada. En vez de mantener dos
   * recortes del mismo dibujo —dos archivos que se desincronizan el día que se cambie el
   * personaje— se acerca con `transform`, que además no cuesta un byte de descarga.
   */
  const zoom = size === 'lg' ? '' : 'scale-[1.5]';

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
        <img
          alt=""
          className={`${zoom} h-full w-full origin-top object-cover object-top`}
          height={384}
          src={sources.base}
          width={384}
        />
        {waving && (
          <img
            alt=""
            className={`raukar-frame-wave ${zoom} absolute inset-0 h-full w-full origin-top object-cover object-top`}
            height={384}
            src={sources.wave ?? undefined}
            width={384}
          />
        )}
      </span>
    </span>
  );
}

/** Clave del saludo proactivo. Con prefijo para no chocar con `theme`. */
const NUDGE_KEY = 'raukar:greeted';

/**
 * Recuerda si ya se saludó, con `localStorage` cuando se puede.
 *
 * En modo privado —o con el almacenamiento del sitio bloqueado— leer o escribir puede
 * **tirar excepción**, no devolver `null`. Por eso los dos accesos van en `try/catch` y
 * hay un respaldo en memoria: sin él, el saludo se rompería o reaparecería en cada
 * navegación interna, que es justo lo que se pidió evitar.
 */
let greetedInMemory = false;

function useFirstVisitNudge({ enabled }: { enabled: boolean }): {
  dismissNudge: () => void;
  showNudge: boolean;
} {
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    if (!enabled || greetedInMemory) return;

    try {
      if (window.localStorage.getItem(NUDGE_KEY) === '1') {
        greetedInMemory = true;
        return;
      }
    } catch {
      // Sin almacenamiento se sigue: el respaldo en memoria alcanza para que no moleste
      // durante esta visita.
    }

    // Demora deliberada: apareciendo de entrada compite con la carga de la página y se
    // lee como un pop-up. Un segundo y medio después ya se está mirando el contenido.
    const timer = window.setTimeout(() => setShowNudge(true), 1_500);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  const dismissNudge = useCallback(() => {
    setShowNudge(false);
    greetedInMemory = true;
    try {
      window.localStorage.setItem(NUDGE_KEY, '1');
    } catch {
      // Ya quedó marcado en memoria.
    }
  }, []);

  return { dismissNudge, showNudge };
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
