import type { z } from 'zod';

import type { SupportedLocale } from '@/lib/i18n';

/**
 * Factory de cargadores de contenido.
 *
 * Por qué una factory y no dos funciones sueltas: hay N tipos de contenido (perfil,
 * case studies, y mañana el corpus del chatbot) × M locales, y los tres necesitan
 * exactamente lo mismo — parsear el JSON contra su esquema, fallar con un mensaje que
 * diga *qué archivo* y *qué campo*, y no repetir el trabajo. Eso es variabilidad real
 * en un solo eje (el esquema), que es justamente cuando una factory se justifica y no
 * es indirección decorativa: `createContentLoader` es genérico sobre el esquema y
 * devuelve un cargador ya tipado con `z.infer`, sin un solo cast.
 *
 * Estrategia de carga: import estático del JSON, no lectura de disco. Entra al bundle
 * en build time, el sitio se prerenderiza completo y no existe el modo de falla
 * "archivo ausente en runtime".
 *
 * Estrategia de parseo: `eager` por defecto. El parseo corre al importar el módulo,
 * o sea en build, y una violación del esquema rompe `npm run build` en vez de la
 * página. Es la diferencia entre enterarse en CI y enterarse por un recruiter.
 */

export interface ContentLoader<T> {
  /** Todos los locales, ya parseados. Útil para `generateStaticParams` y el sitemap. */
  all(): ReadonlyMap<SupportedLocale, T>;
  get(lang: SupportedLocale): T;
}

export function createContentLoader<TSchema extends z.ZodType>(
  /** Nombre humano del contenido; aparece en el mensaje de error. */
  name: string,
  schema: TSchema,
  sources: Readonly<Record<SupportedLocale, unknown>>,
): ContentLoader<z.infer<TSchema>> {
  const parsed = new Map<SupportedLocale, z.infer<TSchema>>();

  for (const [lang, source] of Object.entries(sources) as [SupportedLocale, unknown][]) {
    const result = schema.safeParse(source);

    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `  · ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
        .join('\n');
      throw new Error(`Contenido inválido en ${name} [${lang}]:\n${detail}`);
    }

    parsed.set(lang, result.data);
  }

  return {
    all: () => parsed,
    get(lang) {
      const content = parsed.get(lang);
      // Inalcanzable si `sources` cubre `SupportedLocale` (lo garantiza el tipo del
      // parámetro), pero `noUncheckedIndexedAccess` obliga a cerrar el caso y un
      // throw explícito es mejor que un `!` que oculta el supuesto.
      if (content === undefined) {
        throw new Error(`Falta el contenido de ${name} para el locale "${lang}"`);
      }
      return content;
    },
  };
}
