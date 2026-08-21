import 'server-only';

import { createAnthropicProvider } from '@/lib/chat/providers/anthropic';
import { createFakeProvider } from '@/lib/chat/providers/fake';
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

export function createLlmProvider(): LlmProvider {
  switch (env.LLM_PROVIDER) {
    case 'anthropic':
      return env.ANTHROPIC_API_KEY
        ? createAnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, model: ANTHROPIC_MODEL })
        : createFakeProvider();

    // `gemini` y `openai` están en el enum de `lib/env.ts` desde antes que existiera el
    // chat. No se implementan hasta que haga falta: un adaptador escrito "por si acaso"
    // envejece sin que nadie lo ejecute, y el día que se necesite hay que reescribirlo
    // igual contra la API vigente. El fallback los deja andando en desarrollo.
    case 'gemini':
    case 'openai':
      return createFakeProvider();
  }
}
