import 'server-only';

import { z } from 'zod';

/**
 * Validación del entorno.
 *
 * Tres requisitos que hay que satisfacer a la vez:
 *
 * 1. El repo es público: alguien tiene que poder clonarlo y correr `npm run build`
 *    sin ninguna credencial. Por eso NADA es obligatorio: todo tiene default.
 * 2. Un valor presente pero malformado tiene que romper el build, no producir un
 *    `href` roto en producción. Por eso cada campo valida su forma cuando NO está vacío.
 * 3. **Una variable definida pero vacía cuenta como ausente.** Esto no es cosmético:
 *    los paneles de deploy (Vercel entre ellos) precargan las claves del `.env.example`
 *    con valor vacío, y `process.env.FOO === ''` NO dispara el `.default()` de Zod —
 *    que solo aplica a `undefined`. Sin este paso, un enum vacío rompe el build en el
 *    primer deploy, que es exactamente cuando menos ganas hay de debuggear esto.
 *
 * La consecuencia visible es deliberada: si `CONTACT_PHONE_E164` está vacía, el botón
 * de WhatsApp no se renderiza y el sitio sigue funcionando con el CTA de email. Un
 * teléfono malformado, en cambio, falla el build. Ausencia = degradación silenciosa
 * y prevista; presencia inválida = error ruidoso.
 *
 * `server-only` garantiza que importar este módulo desde un Client Component sea un
 * error de compilación, no una fuga de credenciales al bundle.
 */

/** Vacío, o E.164: '+' seguido de 8 a 15 dígitos sin espacios ni separadores. */
const phoneE164 = z
  .string()
  .regex(/^(\+[1-9]\d{7,14})?$/, 'CONTACT_PHONE_E164 debe estar en formato E.164, p. ej. +543434251515')
  .default('');

/** Vacío, o algo con forma de email. Validación deliberadamente laxa: no es un login. */
const emailOrEmpty = z
  .string()
  .regex(/^([^@\s]+@[^@\s]+\.[^@\s]+)?$/, 'CONTACT_EMAIL no tiene forma de email')
  .default('');

const envSchema = z.object({
  /** Kill switch del chatbot. Con el chat apagado el sitio debe seguir 100% usable. */
  CHAT_ENABLED: z.enum(['true', 'false']).default('false'),
  CONTACT_EMAIL: emailOrEmpty,
  CONTACT_PHONE_E164: phoneE164,
  /**
   * Proveedor de LLM. La implementación vive detrás de una interfaz común para que
   * cambiar de proveedor no toque nada fuera de `lib/chat/providers/`.
   *
   * El default es `gemini` porque su nivel gratuito hace cumplir el tope de gasto del
   * lado del proveedor: sin medio de pago en la cuenta, el peor caso del sitio es
   * quedarse sin responder, nunca una factura. Eso es justo lo que el limitador de
   * `lib/chat/rate-limit.ts` NO puede garantizar solo, porque falla abierto.
   */
  LLM_PROVIDER: z.enum(['anthropic', 'gemini', 'openai']).default('gemini'),
  ANTHROPIC_API_KEY: z.string().default(''),
  GEMINI_API_KEY: z.string().default(''),
  /**
   * Modelo de Gemini. Configurable por entorno y no fijo en el código, a diferencia del
   * de Anthropic, por una razón concreta: **los modelos del nivel gratuito rotan según
   * el calendario de Google, no el nuestro**. El endpoint corre en Node, así que este
   * valor se lee por invocación: cambiarlo en el panel de deploy toma efecto sin
   * recompilar. Cambiar de modelo obliga a volver a correr `npm run evals`.
   */
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
  OPENAI_API_KEY: z.string().default(''),
  /**
   * Rate limiting por IP. Sin esto configurado, el endpoint de chat debe negarse a
   * servir.
   *
   * Los nombres canónicos son los que **entrega Upstash tal cual**, para que copiar y
   * pegar desde su consola no requiera renombrar nada. `KV_REST_API_*` se sigue
   * aceptando como alias en `withoutEmptyValues`: es lo que inyectaba el viejo Vercel KV
   * y lo que ya está cargado en deploys previos.
   *
   * El alias no es comodidad. Sin él, cargar las variables con el nombre equivocado no
   * produce ningún error: `chatEnabled` queda en `false`, el widget no se renderiza y el
   * sitio se sirve perfecto. **Un fallo silencioso e indistinguible del estado normal**
   * es justo el que más cuesta diagnosticar, y acá se elimina aceptando los dos nombres.
   */
  UPSTASH_REDIS_REST_TOKEN: z.string().default(''),
  UPSTASH_REDIS_REST_URL: z.string().default(''),
  /**
   * URL canónica del sitio. Se valida como URL absoluta porque `metadataBase` la
   * pasa por `new URL()`: un valor con forma inválida tiene que romper acá, con un
   * mensaje claro, y no adentro del generador de metadata.
   */
  SITE_URL: z.string().url('SITE_URL debe ser una URL absoluta, p. ej. https://ejemplo.com')
    .default('https://carrattinisn-dev.com'),
});

/**
 * Nombres alternativos aceptados para una misma variable, en orden de preferencia.
 * El canónico siempre gana; el alias solo se mira si el canónico está ausente o vacío.
 */
const ALIASES: Readonly<Record<string, readonly string[]>> = {
  UPSTASH_REDIS_REST_TOKEN: ['KV_REST_API_TOKEN'],
  UPSTASH_REDIS_REST_URL: ['KV_REST_API_URL'],
};

/**
 * Normaliza el entorno antes de validar. Hace dos cosas:
 *
 * 1. Una clave definida como cadena vacía se trata como ausente, para que el
 *    `.default()` del esquema tenga oportunidad de correr.
 * 2. Si el nombre canónico no está, se prueba con los alias de `ALIASES`.
 */
function withoutEmptyValues(source: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const normalized: Record<string, string | undefined> = {};

  for (const key of Object.keys(envSchema.shape)) {
    const candidates = [key, ...(ALIASES[key] ?? [])];
    const found = candidates
      .map((name) => source[name])
      .find((value) => value !== undefined && value.trim() !== '');

    normalized[key] = found;
  }

  return normalized;
}

const parsed = envSchema.safeParse(withoutEmptyValues(process.env));

if (!parsed.success) {
  // Falla en build, no en runtime. El mensaje enumera cada campo inválido.
  const detail = parsed.error.issues
    .map((issue) => `  · ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Variables de entorno inválidas:\n${detail}`);
}

export const env = Object.freeze(parsed.data);

/** Dígitos sin '+' — el formato que exige wa.me. Cadena vacía si no hay teléfono. */
export const whatsappDigits = env.CONTACT_PHONE_E164.replace(/^\+/, '');

/**
 * El chat solo se considera operativo si está encendido, hay clave del proveedor
 * seleccionado y hay backend de rate limit. Cualquier pieza faltante lo deja apagado:
 * es preferible un sitio sin chat que un endpoint de LLM sin límite de gasto.
 *
 * **Se evalúa en build, no en cada request.** Las páginas se prerenderizan, así que el
 * widget se incluye o no en el HTML estático según el valor que tenía `CHAT_ENABLED` al
 * compilar. La consecuencia hay que tenerla presente: **cambiar la variable exige un
 * redeploy**, no alcanza con tocarla en el panel. A cambio, con el chat apagado no se
 * envía ni un byte de JavaScript del widget — un kill switch en runtime tendría que
 * mandar el componente igual para poder decidir.
 */
/**
 * El backend de rate limit es obligatorio **en producción**. En desarrollo se acepta el
 * limitador en memoria de `lib/chat/rate-limit.ts`.
 *
 * Sin esta distinción el limitador en memoria era código muerto: nunca podía ejecutarse,
 * porque la condición de abajo exigía Redis para habilitar el chat en cualquier entorno.
 * Y la consecuencia práctica era peor que la teórica — para tocar el widget en local
 * había que levantar un Redis, así que en la práctica se tocaba sin rate limit o no se
 * tocaba.
 *
 * Lo que se protege sigue protegido: en producción, sin las credenciales de Upstash, el
 * chat queda apagado y el sitio se sirve completo.
 */
const rateLimitBackendReady =
  Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) ||
  process.env.NODE_ENV === 'development';

const providerKey =
  env.LLM_PROVIDER === 'anthropic'
    ? env.ANTHROPIC_API_KEY
    : env.LLM_PROVIDER === 'gemini'
      ? env.GEMINI_API_KEY
      : env.OPENAI_API_KEY;

/**
 * En desarrollo se acepta que no haya clave: la factory devuelve el proveedor simulado.
 *
 * Sin esta excepción el proveedor simulado era **inalcanzable** —el mismo error que ya
 * tuvimos con el limitador en memoria—: la condición de abajo exigía clave real en
 * cualquier entorno, así que el `createFakeProvider()` de la factory nunca se ejecutaba
 * y el flujo que documenta el README ("levantá el widget sin ninguna credencial") no
 * funcionaba. Una abstracción con un solo implementador ejecutado no está probada.
 *
 * En producción no cambia nada: sin clave el chat queda apagado y el sitio se sirve
 * completo. Lo que NO se quiere es un sitio público respondiendo con texto de mentira.
 */
const providerReady = Boolean(providerKey) || process.env.NODE_ENV === 'development';

export const chatEnabled: boolean =
  env.CHAT_ENABLED === 'true' && rateLimitBackendReady && providerReady;
