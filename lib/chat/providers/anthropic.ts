import 'server-only';

import {
  LlmProviderError,
  type LlmProvider,
  type LlmStreamRequest,
} from '@/lib/chat/types';

/**
 * Proveedor Anthropic sobre la Messages API, con `fetch` y sin SDK.
 *
 * **Por qué sin SDK.** El proyecto es explícito en no sumar dependencias "por las
 * dudas", y acá se usa exactamente un endpoint, un modo (streaming) y un tipo de evento
 * (`content_block_delta`). El SDK oficial resuelve mucho más que eso —reintentos,
 * paginación, tool use, tipos de toda la API— y nada de eso entra en un chatbot de
 * alcance cerrado. El costo de escribirlo a mano es el parser de SSE de abajo: treinta
 * líneas, contra una dependencia en un repo público que se audita.
 *
 * El trade-off real, sin maquillar: los reintentos y el backoff quedan de nuestro lado.
 * Hoy no hay ninguno —un error del proveedor devuelve error— y está bien: es preferible
 * que el usuario vea "no pude responder, probá de nuevo" a que el servidor reintente
 * solo y multiplique el gasto ante un incidente del proveedor.
 *
 * Si algún día hace falta tool use, streaming de imágenes o batching, la decisión se
 * revisa: ahí el SDK deja de ser sobrecosto y pasa a ser la opción correcta. Cambiar
 * significa reescribir este archivo y ninguno más.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export function createAnthropicProvider({
  apiKey,
  model,
}: {
  apiKey: string;
  model: string;
}): LlmProvider {
  return {
    name: 'anthropic',

    async *stream({ maxOutputTokens, messages, system }: LlmStreamRequest) {
      let response: Response;

      try {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'anthropic-version': API_VERSION,
            'content-type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            max_tokens: maxOutputTokens,
            messages: messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            model,
            stream: true,
            // El corpus y las reglas van como `system`, separados de la conversación.
            // Es la garantía estructural de que el input del usuario no puede
            // reescribir las instrucciones.
            system,
          }),
        });
      } catch (cause) {
        throw new LlmProviderError(`No se pudo contactar a Anthropic: ${String(cause)}`, 'network');
      }

      if (!response.ok || !response.body) {
        throw new LlmProviderError(
          `Anthropic respondió ${response.status}`,
          classifyStatus(response.status),
        );
      }

      yield* readTextDeltas(response.body);
    },
  };
}

function classifyStatus(status: number): LlmProviderError['reason'] {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate-limit';
  // 400 con `credit balance too low` también llega acá; se trata como cuota porque la
  // acción que corresponde es la misma: apagar el chat, no reintentar.
  if (status === 400 || status === 402) return 'quota';
  return 'unknown';
}

/**
 * Parser de SSE.
 *
 * Dos cosas que un `split('\n')` ingenuo hace mal y por eso el buffer:
 * 1. Un chunk de red puede cortar una línea por la mitad; lo que queda incompleto se
 *    guarda hasta que llegue el resto.
 * 2. Los eventos se separan por línea en blanco, pero solo interesan las líneas `data:`.
 *
 * Se ignora todo evento que no sea `content_block_delta` con `text_delta`: los de
 * apertura, uso de tokens y cierre no aportan nada a lo que se muestra. Un
 * `error` del stream sí corta.
 */
async function* readTextDeltas(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newline = buffer.indexOf('\n');
      while (newline !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf('\n');

        if (!line.startsWith('data:')) continue;

        const payload = line.slice(5).trim();
        if (payload === '' || payload === '[DONE]') continue;

        let event: unknown;
        try {
          event = JSON.parse(payload);
        } catch {
          // Un `data:` que no parsea es un bug del proveedor o un corte raro. Se
          // descarta el evento en vez de tirar toda la respuesta: el usuario prefiere
          // una respuesta con un hueco a una pantalla de error.
          continue;
        }

        const text = extractTextDelta(event);
        if (text) yield text;

        if (isStreamError(event)) {
          throw new LlmProviderError('El stream de Anthropic devolvió un error', 'unknown');
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function extractTextDelta(event: unknown): string | null {
  if (typeof event !== 'object' || event === null) return null;
  const record = event as Record<string, unknown>;
  if (record.type !== 'content_block_delta') return null;

  const delta = record.delta;
  if (typeof delta !== 'object' || delta === null) return null;
  const deltaRecord = delta as Record<string, unknown>;
  if (deltaRecord.type !== 'text_delta') return null;

  return typeof deltaRecord.text === 'string' ? deltaRecord.text : null;
}

function isStreamError(event: unknown): boolean {
  return (
    typeof event === 'object' && event !== null && (event as Record<string, unknown>).type === 'error'
  );
}
