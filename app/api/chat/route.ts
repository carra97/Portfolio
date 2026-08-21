import { createLlmProvider } from '@/lib/chat/provider-factory';
import { clientIdentifier, createRateLimiter } from '@/lib/chat/rate-limit';
import { chatRequestSchema } from '@/lib/chat/request-schema';
import { buildSystemPrompt } from '@/lib/chat/system-prompt';
import { LlmProviderError } from '@/lib/chat/types';
import { chatEnabled } from '@/lib/env';

/**
 * Endpoint del chat.
 *
 * El orden de las etapas es la política de seguridad, y es el orden en el que están
 * escritas: **kill switch → validación → rate limit → proveedor.** Cada una es más cara
 * que la anterior, así que un request abusivo muere lo antes posible y sin costo. Mover
 * el rate limit después de la llamada al modelo lo volvería decorativo.
 *
 * Respuestas de error en texto plano y sin detalle interno: quien llama no necesita saber
 * qué proveedor hay detrás ni por qué falló. El detalle va a los logs del servidor.
 */

/**
 * Node y no Edge. El motivo es `server-only` + el `import` de los JSON de contenido:
 * el corpus se arma en el proceso a partir de los mismos módulos que renderizan el
 * sitio. En Edge habría que duplicar el corpus como asset, que es exactamente la
 * segunda copia que `lib/chat/corpus.ts` existe para evitar.
 */
export const runtime = 'nodejs';

/** Tope de salida. La otra mitad del control de gasto; la de entrada está en el schema. */
const MAX_OUTPUT_TOKENS = 700;

export async function POST(request: Request): Promise<Response> {
  // 1 · Kill switch. `chatEnabled` exige a la vez: switch encendido, clave del proveedor
  //     y backend de rate limit. Si falta cualquiera, el chat no existe.
  if (!chatEnabled) {
    return text('El chat no está disponible.', 503);
  }

  // 2 · Validación. Antes de tocar Redis y mucho antes de tocar el modelo.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return text('Cuerpo inválido.', 400);
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return text('Pedido inválido.', 400);
  }

  // 3 · Rate limit por IP.
  const limiter = createRateLimiter();
  const verdict = await limiter.check(clientIdentifier(request.headers));
  if (!verdict.allowed) {
    return new Response('Demasiados mensajes. Probá de nuevo en un rato.', {
      status: 429,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'retry-after': String(verdict.retryAfterSeconds),
      },
    });
  }

  // 4 · Proveedor. El sistema se construye en el servidor y el input del usuario viaja
  //     aparte, en `messages`. Nunca se concatenan.
  const provider = createLlmProvider();
  const system = buildSystemPrompt(parsed.data.lang);

  /**
   * **El primer fragmento se pide ANTES de responder, y no es un detalle de estilo.**
   *
   * `provider.stream()` es un generador asíncrono: invocarlo no ejecuta ni una línea del
   * cuerpo, solo construye el generador. El `try/catch` que antes lo envolvía por lo
   * tanto no podía atrapar nada — ni una clave inválida, ni un 429 del proveedor, ni un
   * modelo inexistente. Todos esos errores aparecían recién en el primer `next()`, o sea
   * dentro del stream, cuando el 200 ya estaba enviado y el status ya no se podía
   * cambiar. El síntoma era el peor de los posibles: 200 con cuerpo vacío, sin error
   * visible para el visitante y sin status útil para monitorear.
   *
   * Adelantando el primer `next()`, todo lo que falle antes del primer token se convierte
   * en el status HTTP que corresponde (503 configuración, 502 el resto). Lo que falle
   * después sigue siendo irrecuperable por definición, y se maneja abajo.
   *
   * Lo que cuesta: las cabeceras salen recién cuando el modelo produjo su primer token,
   * no al aceptar el pedido. Es un costo nominal — no había nada útil para mostrar antes
   * de ese token y el widget ya estaba en estado de carga.
   */
  const iterator = provider
    .stream({
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      messages: parsed.data.messages,
      system,
    })
    [Symbol.asyncIterator]();

  let first: IteratorResult<string>;
  try {
    first = await iterator.next();
  } catch (error) {
    return providerFailure(error);
  }

  /**
   * Se responde texto plano en streaming, no SSE ni el protocolo de ninguna librería.
   * El cliente hace `fetch` y lee el `ReadableStream` con `TextDecoder`: sin formato que
   * parsear, sin dependencia compartida entre servidor y cliente, y `connect-src 'self'`
   * de la CSP lo cubre sin tocar nada.
   */
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(first.value));

        while (true) {
          const next = await iterator.next();
          if (next.done) break;
          controller.enqueue(encoder.encode(next.value));
        }
      } catch (error) {
        // El stream ya empezó: el status 200 se envió y no se puede cambiar. Lo único
        // honesto es cerrar dejando visible lo que sí llegó — el cliente muestra el
        // texto parcial y ofrece reintentar.
        console.error('[chat] fallo durante el stream', error);
      } finally {
        controller.close();
      }
    },

    /**
     * Si el visitante cierra el widget o navega, hay que cortar del lado del proveedor.
     * Sin esto, dejar de leer no cancela nada: el generador queda suspendido en su
     * `await` con la conexión al proveedor abierta y el `reader` sin liberar. `return()`
     * dispara su bloque `finally`, que es donde vive esa limpieza.
     */
    async cancel() {
      await iterator.return?.();
    },
  });

  return new Response(stream, {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
      // Evita que un proxy intermedio acumule la respuesta y rompa el streaming.
      'x-accel-buffering': 'no',
    },
  });
}

function providerFailure(error: unknown): Response {
  if (error instanceof LlmProviderError) {
    console.error(`[chat] proveedor falló (${error.reason})`, error.message);
    // Cuota agotada y credenciales rotas son problemas de configuración, no del
    // visitante: 503 y a revisar el deploy. El resto, 502.
    const status = error.reason === 'quota' || error.reason === 'auth' ? 503 : 502;
    return text('No pude responder en este momento.', status);
  }

  console.error('[chat] error inesperado', error);
  return text('No pude responder en este momento.', 502);
}

function text(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
