import 'server-only';

import { createAnthropicProvider } from '@/lib/chat/providers/anthropic';
import { createFakeProvider } from '@/lib/chat/providers/fake';
import { createGeminiProvider, type GeminiThinkingConfig } from '@/lib/chat/providers/gemini';
import type { LlmProvider } from '@/lib/chat/types';
import { env } from '@/lib/env';

/**
 * Factory del proveedor de LLM.
 *
 * **Este es el lugar del sistema donde una factory se justifica**, y vale contrastarlo
 * con los dos registros del sitio: `lib/pages/registry.ts` y `lib/sections/registry.tsx`
 * enumeran conjuntos fijos y conocidos en compilación, así que meterles una factory
 * habría sido indirección sin variabilidad. Acá pasa lo contrario: hay que **elegir una
 * implementación entre varias intercambiables**, la elección depende de configuración
 * que solo existe en runtime, y el eje de cambio está identificado y no supuesto — el
 * proveedor es la dependencia con más probabilidad de cambiar, por precio,
 * disponibilidad o calidad.
 *
 * El resto del sistema no sabe cuál está activo. El endpoint pide un `LlmProvider` y
 * escribe lo que sale; migrar de proveedor es agregar un archivo en `providers/` y un
 * caso en este `switch`.
 *
 * **Degradación deliberada:** sin clave se devuelve el proveedor falso en vez de tirar
 * una excepción. Esto no abre un agujero: `chatEnabled` en `lib/env.ts` exige clave real
 * más backend de rate limit para que el endpoint sirva, así que en producción el chat
 * queda apagado y el sitio se sirve completo. Lo que gana es que alguien que clone el
 * repo pueda levantar el widget y verlo funcionar sin ninguna credencial.
 */

/** Modelo por defecto de Anthropic. Vive acá y no en el proveedor: es configuración. */
const ANTHROPIC_MODEL = 'claude-haiku-4-5';

/**
 * Pareo modelo ↔ configuración de razonamiento para Gemini.
 *
 * La familia 3.x acepta `thinkingLevel` y la 2.5 acepta `thinkingBudget`; mandar el
 * campo de la otra familia devuelve 400. Es una tabla y no un `if` por prefijo de
 * nombre porque el nombre no es contrato: `gemini-3.5-flash-lite` y `gemini-2.5-flash`
 * se parecen lo suficiente como para que una heurística sobre el string funcione hasta
 * el día que no.
 *
 * **Un modelo que no está en la tabla se usa sin `thinkingConfig`.** Omitir el campo
 * siempre es válido; adivinarlo, no. Así, poner en `GEMINI_MODEL` un modelo que salió
 * ayer degrada a "razona por defecto" en vez de romper el chat con un 400.
 */
const GEMINI_THINKING: Readonly<Record<string, GeminiThinkingConfig>> = {
  // Recuperación de hechos sobre un corpus fijo: es el caso que la documentación de
  // Google señala para razonamiento mínimo. Lo que se gana no es costo —el plan
  // gratuito no cobra— sino latencia y tokens de salida que no se comen el tope.
  'gemini-2.5-flash': { thinkingBudget: 0 },
  'gemini-3.5-flash': { thinkingLevel: 'minimal' },
  'gemini-3.5-flash-lite': { thinkingLevel: 'minimal' },
};

export function createLlmProvider(): LlmProvider {
  switch (env.LLM_PROVIDER) {
    case 'anthropic':
      return env.ANTHROPIC_API_KEY
        ? createAnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, model: ANTHROPIC_MODEL })
        : createFakeProvider();

    case 'gemini':
      return env.GEMINI_API_KEY
        ? createGeminiProvider({
            apiKey: env.GEMINI_API_KEY,
            model: env.GEMINI_MODEL,
            thinking: GEMINI_THINKING[env.GEMINI_MODEL],
          })
        : createFakeProvider();

    // `openai` está en el enum de `lib/env.ts` desde antes que existiera el chat. No se
    // implementa hasta que haga falta: un adaptador escrito "por si acaso" envejece sin
    // que nadie lo ejecute, y el día que se necesite hay que reescribirlo igual contra
    // la API vigente. El fallback lo deja andando en desarrollo.
    case 'openai':
      return createFakeProvider();
  }
}
