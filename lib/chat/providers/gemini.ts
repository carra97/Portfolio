import 'server-only';

import {
  LlmProviderError,
  type LlmProvider,
  type LlmStreamRequest,
} from '@/lib/chat/types';

/**
 * Proveedor Gemini sobre la API `generateContent`, con `fetch` y sin SDK.
 *
 * Mismo criterio que el adaptador de Anthropic: un endpoint, un modo (streaming), un
 * tipo de evento. El SDK oficial resuelve mucho más de lo que este chatbot usa.
 *
 * ## Por qué `generateContent` y no la Interactions API
 *
 * Google recomienda la Interactions API para desarrollo nuevo, así que la elección
 * necesita justificación explícita en vez de inercia.
 *
 * La Interactions API es **con estado por defecto**: encadena turnos del lado de Google
 * con `previous_interaction_id`, y su modo sin estado exige devolverle los objetos
 * `steps` que emitió en la respuesta anterior. Este endpoint es sin estado por diseño —
 * el cliente manda la transcripción completa como texto plano y el servidor no guarda
 * nada— así que usarla obligaría a persistir y reenviar estructuras del proveedor, que
 * es exactamente el acoplamiento que `LlmProvider` existe para evitar.
 *
 * `generateContent` toma un array de turnos con rol y texto, que es 1:1 con
 * `ChatMessage[]`. La documentación de Google dice que "sigue completamente soportada" y
 * no anuncia fecha de baja, aunque la marca como legacy. El riesgo asumido es que algún
 * día se dé de baja; el costo de mitigarlo es reescribir **este archivo y ninguno otro**,
 * que es la apuesta que la factory ya hizo.
 *
 * ## Nota de privacidad — aplica al plan gratuito, no al código
 *
 * En el nivel gratuito de la API, Google usa el contenido de los pedidos y respuestas
 * para mejorar sus productos; en el nivel pago, no. El corpus es material ya publicado,
 * así que por ese lado no hay exposición nueva, pero **las preguntas que escriba un
 * visitante sí salen del sitio**. Eso hay que decirlo en la interfaz, no esconderlo.
 */

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Control del razonamiento interno del modelo.
 *
 * La forma del campo depende de la familia: los Gemini 3.x usan `thinkingLevel` y los
 * 2.5 usan `thinkingBudget`. **Por eso lo elige la factory y no este archivo**: acá un
 * `if` por familia se rompería solo cada vez que Google saque una generación nueva, y el
 * pareo modelo↔configuración es configuración, no lógica.
 *
 * Mandar un campo que el modelo no acepta devuelve 400. Es un error de configuración y
 * se comporta como tal: falla ruidoso al primer pedido, y `npm run chat:smoke` lo
 * detecta en dos segundos sin levantar el sitio.
 */
export interface GeminiThinkingConfig {
  readonly thinkingBudget?: number;
  readonly thinkingLevel?: 'high' | 'low' | 'medium' | 'minimal';
}

export function createGeminiProvider({
  apiKey,
  model,
  thinking,
}: {
  apiKey: string;
  model: string;
  thinking?: GeminiThinkingConfig;
}): LlmProvider {
  return {
    name: 'gemini',

    async *stream({ maxOutputTokens, messages, system }: LlmStreamRequest) {
      let response: Response;

      try {
        response = await fetch(`${API_ROOT}/${model}:streamGenerateContent?alt=sse`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            // La clave va en un header y no en `?key=`. La API acepta las dos formas;
            // la query string termina en logs de acceso, en historiales de proxy y en
            // cualquier traza de red que capture URLs. Un header no.
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: messages.map((message) => ({
              // Gemini llama `model` a lo que el resto del sistema llama `assistant`.
              // La traducción vive acá y no se filtra al contrato: `ChatRole` sigue
              // siendo el vocabulario del dominio, no el del proveedor de turno.
              role: message.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: message.content }],
            })),
            generationConfig: {
              maxOutputTokens,
              // Bajo y no cero: es un bot de recuperación de hechos sobre un corpus
              // fijo. La variación no aporta nada y sí agrega riesgo de que redacte
              // alrededor de un dato en vez de citarlo.
              temperature: 0.2,
              ...(thinking ? { thinkingConfig: thinking } : {}),
            },
            // Las reglas y el corpus viajan separados de la conversación. Es la misma
            // garantía estructural que en Anthropic: el input del usuario no puede
            // reescribir las instrucciones porque no comparte campo con ellas.
            systemInstruction: { parts: [{ text: system }] },
          }),
        });
      } catch (cause) {
        throw new LlmProviderError(`No se pudo contactar a Gemini: ${String(cause)}`, 'network');
      }

      if (!response.ok || !response.body) {
        // El cuerpo del error de Google trae el motivo real (`API_KEY_INVALID`,
        // `RESOURCE_EXHAUSTED`, nombre de campo desconocido). Se lee para el log del
        // servidor y para clasificar; nunca sale al cliente — de eso se encarga el
        // handler, que responde un mensaje genérico.
        const detail = await safeReadBody(response);
        throw new LlmProviderError(
          `Gemini respondió ${response.status}: ${detail}`,
          classify(response.status, detail),
        );
      }

      yield* readTextDeltas(response.body);
    },
  };
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return '(sin cuerpo)';
  }
}

/**
 * Clasificación de errores.
 *
 * A diferencia de Anthropic, Gemini devuelve **400 para una clave inválida**, no 401. Un
 * mapeo copiado del otro proveedor trataría una credencial rota como un problema de
 * cuota, y el diagnóstico saldría mal justo el día del primer deploy. Por eso se mira
 * también el cuerpo.
 */
function classify(status: number, detail: string): LlmProviderError['reason'] {
  if (/API_KEY_INVALID|API key not valid/i.test(detail)) return 'auth';
  if (status === 401 || status === 403) return 'auth';
  // 429 en el plan gratuito es el límite diario del proveedor, que acá es una función
  // deseada: el peor caso del sitio es quedarse sin responder, no generar una factura.
  if (status === 429) return 'rate-limit';
  if (status === 402) return 'quota';
  return 'unknown';
}

/**
 * Parser de SSE.
 *
 * Mismo buffer por línea que en el adaptador de Anthropic y por los mismos dos motivos:
 * un chunk de red puede cortar una línea al medio, y solo interesan las líneas `data:`.
 *
 * Lo específico de Gemini es qué se extrae: cada evento es un `GenerateContentResponse`
 * completo y el texto vive en `candidates[0].content.parts[].text`. Las `parts` se
 * concatenan en orden — un mismo evento puede traer más de una.
 *
 * **El caso vacío no se ignora.** Si el modelo bloquea la respuesta por filtros de
 * seguridad, el stream termina bien, con 200 y sin una sola parte de texto. Dejarlo
 * pasar produce lo peor posible: una burbuja en blanco sin explicación. Se detecta y se
 * convierte en error, que el widget sí sabe mostrar y reintentar.
 */
async function* readTextDeltas(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let emitted = false;
  let blockReason: string | null = null;

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
          // descarta el evento y no la respuesta entera: un hueco es mejor que una
          // pantalla de error.
          continue;
        }

        blockReason ??= extractBlockReason(event);

        const text = extractText(event);
        if (text) {
          emitted = true;
          yield text;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!emitted) {
    throw new LlmProviderError(
      `Gemini no devolvió texto${blockReason ? ` (motivo: ${blockReason})` : ''}`,
      'unknown',
    );
  }
}

function extractText(event: unknown): string | null {
  const candidate = firstCandidate(event);
  const parts = asRecord(candidate?.content)?.parts;
  if (!Array.isArray(parts)) return null;

  const text = parts
    .map((part) => asRecord(part)?.text)
    .filter((value): value is string => typeof value === 'string')
    .join('');

  return text.length > 0 ? text : null;
}

/**
 * Motivo del bloqueo, si lo hay. Puede venir en dos lugares distintos: `promptFeedback`
 * cuando lo rechazado es la pregunta, y `finishReason` del candidato cuando lo rechazado
 * es la respuesta a medio generar.
 */
function extractBlockReason(event: unknown): string | null {
  const record = asRecord(event);
  const prompt = asRecord(record?.promptFeedback)?.blockReason;
  if (typeof prompt === 'string') return prompt;

  const finish = firstCandidate(event)?.finishReason;
  if (typeof finish === 'string' && finish !== 'STOP' && finish !== 'MAX_TOKENS') return finish;

  return null;
}

function firstCandidate(event: unknown): Record<string, unknown> | null {
  const candidates = asRecord(event)?.candidates;
  return Array.isArray(candidates) ? asRecord(candidates[0]) : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}
