import type { LlmProvider, LlmStreamRequest } from '@/lib/chat/types';

/**
 * Proveedor de mentira. No llama a ninguna API.
 *
 * Existe por tres motivos concretos, ninguno decorativo:
 *
 * 1. **El widget se puede desarrollar sin clave.** Streaming, estados de carga, errores
 *    y scroll se prueban contra esto, gratis y en milisegundos.
 * 2. **Los tests del endpoint no gastan.** Validación, rate limit, forma de la respuesta
 *    y manejo de errores se verifican sin tocar el proveedor real.
 * 3. **Es la prueba de que la interfaz sirve.** Una abstracción con una sola
 *    implementación no está probada: recién cuando entra la segunda se ve si el contrato
 *    filtraba detalles del proveedor original. Este fue el segundo.
 *
 * Devuelve el texto de a pedazos y con una pausa entre ellos, para que el widget se
 * ejercite igual que en producción y no parezca instantáneo en desarrollo.
 */
export function createFakeProvider({
  chunkDelayMs = 24,
  reply,
}: {
  chunkDelayMs?: number;
  reply?: (request: LlmStreamRequest) => string;
} = {}): LlmProvider {
  return {
    name: 'fake',

    async *stream(request: LlmStreamRequest) {
      const text = reply ? reply(request) : defaultReply(request);

      // Se emite por palabras y no por caracteres: es lo que más se parece a cómo
      // llegan los deltas reales, y hace visible cualquier bug de concatenación.
      for (const word of text.split(/(\s+)/)) {
        if (chunkDelayMs > 0) await sleep(chunkDelayMs);
        yield word;
      }
    },
  };
}

function defaultReply({ messages }: LlmStreamRequest): string {
  const last = messages.at(-1);
  return [
    'Respuesta simulada del proveedor de desarrollo.',
    last ? `Recibí ${messages.length} turno(s); el último dice: “${last.content.slice(0, 120)}”.` : '',
    'Con una clave configurada, acá respondería el modelo real sobre el perfil de Santiago.',
  ]
    .filter(Boolean)
    .join(' ');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
