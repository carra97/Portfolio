import 'server-only';

import { env } from '@/lib/env';

/**
 * Rate limiting por IP.
 *
 * **Es condición de arranque del chat, no una mejora posterior.** Un endpoint de LLM sin
 * límite es una factura abierta a cualquiera que descubra la URL: no hace falta un
 * atacante, alcanza con un script curioso. `chatEnabled` en `lib/env.ts` exige que el
 * backend esté configurado para que el endpoint sirva; sin él, el chat queda apagado y
 * el sitio se sirve completo.
 *
 * Dos ventanas y no una, porque acotan abusos distintos:
 * - la de minuto frena la ráfaga (un bucle);
 * - la diaria frena el goteo (mil mensajes espaciados, que la ventana corta no ve).
 *
 * El límite es por IP y eso tiene un techo conocido: detrás de un NAT corporativo varias
 * personas comparten cuota, y una IP rotativa evade. No se persigue: el objetivo no es
 * autenticar, es que el peor caso sea un 429 y no una factura. La otra mitad del control
 * de gasto —el tope de la cuenta del proveedor— vive fuera del código.
 */

export interface RateLimitVerdict {
  readonly allowed: boolean;
  /** Segundos hasta que se libere la cuota. Va en `Retry-After`. */
  readonly retryAfterSeconds: number;
}

export interface RateLimiter {
  readonly name: string;
  check(identifier: string): Promise<RateLimitVerdict>;
}

interface Window {
  readonly limit: number;
  readonly seconds: number;
}

/** Ráfaga y goteo. Conservador a propósito: se afloja con datos, no con optimismo. */
const WINDOWS: readonly Window[] = [
  { limit: 8, seconds: 60 },
  { limit: 60, seconds: 60 * 60 * 24 },
];

const ALLOWED: RateLimitVerdict = { allowed: true, retryAfterSeconds: 0 };

/**
 * Factory del limitador.
 *
 * Misma justificación que la del proveedor de LLM: se elige una implementación entre
 * varias intercambiables, según configuración que solo existe en runtime.
 *
 * **Se memoiza a propósito, y no es cosmética.** La primera versión construía el
 * limitador dentro del handler, o sea una vez por request. Con el backend en Redis no se
 * notaba —el estado vive afuera—, pero el limitador en memoria nacía con el contador
 * vacío en cada llamada y por lo tanto no limitaba nada: diez requests seguidos pasaban
 * los diez. El test lo mostró; la lectura del código, no.
 *
 * El alcance del singleton es el módulo, o sea el proceso. En serverless eso significa
 * una instancia, que es exactamente el motivo por el que el limitador en memoria sirve
 * para desarrollo y no para producción.
 */
let limiter: RateLimiter | null = null;

export function createRateLimiter(): RateLimiter {
  if (limiter) return limiter;

  const hasBackend = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
  limiter = hasBackend ? createUpstashRateLimiter() : createMemoryRateLimiter();
  return limiter;
}

/**
 * Contador en Redis vía la API REST de Upstash (la misma que expone Vercel KV).
 *
 * Por HTTP y sin cliente de Redis: el runtime serverless abre y cierra por request, así
 * que una conexión TCP persistente no aporta y sí agrega una dependencia.
 *
 * Ventana fija y no deslizante: dos comandos (`INCR` + `EXPIRE`) contra los cinco o seis
 * de un sorted set. La contrapartida real es que en el borde entre ventanas se pueden
 * colar hasta 2× el límite; para el propósito —que nadie use esto como cómputo gratis—
 * es irrelevante, y si alguna vez deja de serlo se cambia solo este archivo.
 *
 * **Si Redis falla, se permite el request.** Es la decisión incómoda y va explicada: el
 * modo de falla contrario —negar todo cuando el contador no responde— apaga el chat ante
 * cualquier hipo de red del proveedor de cache. Con tope de gasto configurado en la
 * cuenta del LLM, el riesgo de dejar pasar durante una caída de Redis está acotado; sin
 * tope de gasto, esta decisión sería incorrecta. Por eso el tope es requisito de deploy.
 */
function createUpstashRateLimiter(): RateLimiter {
  return {
    name: 'upstash',

    async check(identifier) {
      for (const window of WINDOWS) {
        const key = `chat:${identifier}:${window.seconds}:${Math.floor(Date.now() / (window.seconds * 1000))}`;

        try {
          const count = await incrementWithExpiry(key, window.seconds);
          if (count > window.limit) {
            return { allowed: false, retryAfterSeconds: window.seconds };
          }
        } catch {
          return ALLOWED;
        }
      }

      return ALLOWED;
    },
  };
}

async function incrementWithExpiry(key: string, seconds: number): Promise<number> {
  const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      // `NX` para no reiniciar el TTL en cada request: sin eso la ventana se extiende
      // sola mientras haya tráfico y nunca expira.
      ['EXPIRE', key, String(seconds), 'NX'],
    ]),
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`Upstash respondió ${response.status}`);

  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) throw new Error('Respuesta inesperada');

  const first = payload[0] as { result?: unknown };
  if (typeof first?.result !== 'number') throw new Error('INCR no devolvió un número');

  return first.result;
}

/**
 * Contador en memoria. **Solo desarrollo.**
 *
 * En producción es inservible y conviene decir por qué en vez de dejarlo pasar como si
 * fuera un fallback aceptable: cada instancia serverless tiene su propio proceso, así
 * que el contador se fragmenta entre instancias y se reinicia en cada arranque en frío.
 * El límite efectivo pasa a ser "8 por minuto por instancia", que no es un límite.
 *
 * Que exista igual tiene sentido: permite desarrollar y testear el camino de 429 sin
 * levantar un Redis. Que no llegue a producción lo garantiza `chatEnabled`, que exige
 * `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` para habilitar el chat.
 */
function createMemoryRateLimiter(): RateLimiter {
  const counters = new Map<string, { count: number; expiresAt: number }>();

  return {
    name: 'memory',

    async check(identifier) {
      const now = Date.now();

      // Limpieza oportunista: sin esto el Map crece sin techo en un proceso largo.
      for (const [key, entry] of counters) {
        if (entry.expiresAt <= now) counters.delete(key);
      }

      for (const window of WINDOWS) {
        const key = `${identifier}:${window.seconds}`;
        const entry = counters.get(key);

        if (!entry || entry.expiresAt <= now) {
          counters.set(key, { count: 1, expiresAt: now + window.seconds * 1000 });
          continue;
        }

        entry.count += 1;
        if (entry.count > window.limit) {
          return {
            allowed: false,
            retryAfterSeconds: Math.ceil((entry.expiresAt - now) / 1000),
          };
        }
      }

      return ALLOWED;
    },
  };
}

/**
 * Identificador del cliente.
 *
 * `x-forwarded-for` puede venir con varias IPs; la primera es la del cliente y el resto
 * son proxies. Es un header falsificable en general, pero detrás de Vercel lo reescribe
 * la plataforma, que es el único despliegue soportado.
 *
 * Sin header, todos caen en un mismo balde. Es a propósito: un balde compartido limita
 * de más a algunos, pero no deja ningún request sin contar — que es el modo de falla que
 * importa evitar.
 */
export function clientIdentifier(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first && first.length > 0 ? first : 'unknown';
}
