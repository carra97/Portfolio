import type { MetadataRoute } from 'next';

import { getCaseStudies } from '@/lib/content/case-studies';
import { env } from '@/lib/env';
import { LOCALES } from '@/lib/i18n';
import { routes, staticRoutes } from '@/lib/routes';

/**
 * Sitemap generado, no escrito a mano.
 *
 * Antes era un `public/sitemap.xml` estático con una sola URL y un comentario pidiendo
 * "acordate de agregar el locale acá". Ese tipo de nota es deuda con fecha de
 * vencimiento: los dos case studies ya publicados nunca llegaron al archivo, así que
 * el sitemap describía un sitio que no existía hacía semanas.
 *
 * Ahora se deriva de las mismas fuentes que generan las páginas —`LOCALES`, el registro
 * de rutas y el contenido de case studies—, así que no puede desincronizarse: si una
 * ruta existe, está acá.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const absolute = (path: string) => new URL(path, env.SITE_URL).toString();

  // La prioridad es una señal relativa dentro del propio sitio, no un ranking: la
  // landing primero, después las páginas que responden "qué hizo", y al final el
  // material personal.
  const PRIORITY = {
    about: 0.5,
    contact: 0.6,
    education: 0.7,
    experience: 0.9,
    hobbies: 0.4,
    home: 1,
    projects: 0.9,
  } as const;

  return LOCALES.flatMap((lang) => [
    ...staticRoutes(lang).map((route) => ({
      url: absolute(route.url),
      changeFrequency: 'monthly' as const,
      priority: PRIORITY[route.id],
    })),
    ...getCaseStudies(lang).map((study) => ({
      url: absolute(routes.caseStudy(lang, study.slug)),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    })),
  ]);
}
