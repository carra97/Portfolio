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

  let iterator: AsyncIterable<string>;
  try {
    iterator = provider.stream({
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      messages: parsed.data.messages,
      system,
    });
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
        for await (const chunk of iterator) {
          controller.enqueue(encoder.encode(chunk));
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
