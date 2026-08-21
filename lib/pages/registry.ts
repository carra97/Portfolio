import type { SupportedLocale } from '@/lib/i18n';
import type { SectionId } from '@/lib/sections/registry';

/**
 * Registro de páginas — fuente única de las rutas públicas y de qué contiene cada una.
 *
 * ## Por qué rutas y no anclas
 *
 * El sitio era una sola página de ocho secciones enlazadas con `#experiencia`. Tres
 * problemas concretos, no estéticos:
 *
 * 1. **La URL no es compartible.** `/es#experiencia` es la misma página que `/es`: un
 *    fragmento no se indexa como documento propio, no aparece en resultados de
 *    búsqueda y no se puede mandar en un mensaje diciendo "mirá esto".
 * 2. **Todo pesa siempre.** El HTML incluía las ocho secciones aunque el visitante
 *    leyera una. En mobile eso es scroll y bytes que nadie pidió.
 * 3. **La atención se diluye.** Ocho secciones seguidas se leen como un volcado; cinco
 *    páginas con un propósito cada una se leen como un sitio.
 *
 * ## Cómo se usa
 *
 * Cada página declara su `segment` (el nombre de carpeta bajo `app/[lang]/`), si va al
 * nav y **qué secciones muestra, en qué orden**. El nav, el sitemap, los `canonical` y
 * la composición de cada página salen todos de acá. Agregar una página es una entrada
 * en este array más la carpeta correspondiente.
 *
 * **Limitación honesta:** el App Router deriva la ruta del nombre de carpeta, así que
 * este registro no *crea* la URL, la *nombra*. `assertSegmentsMatchFolders` en los
 * tests —cuando existan— sería la forma de cerrar esa brecha; hoy la cierra el hecho
 * de que una carpeta sin entrada acá queda sin nav, sin sitemap y sin canonical, que
 * es visible en la primera revisión.
 */

export type PageId =
  | 'about'
  | 'contact'
  | 'education'
  | 'experience'
  | 'hobbies'
  | 'home'
  | 'projects';

export interface PageDefinition {
  readonly id: PageId;
  /** Si aparece en la navegación principal. */
  readonly inNav: boolean;
  /**
   * Marca la página como la acción principal del nav: se saca de la lista deslizable y
   * se ancla como botón, siempre visible.
   *
   * Existe porque con siete pestañas la lista mide 699px en un contenedor de 236px: en
   * un teléfono se ven dos, y la séptima —contacto, la acción más valiosa del sitio—
   * quedaba a tres deslizadas de distancia. Es un problema de jerarquía, no de ancho:
   * seis destinos de lectura pueden competir por el espacio, la acción no.
   */
  readonly navCta?: boolean;
  /**
   * Secciones que componen la página, en orden. La numeración de eyebrows se deriva
   * de la posición: no hay "01".."08" escrito a mano en ningún lado.
   */
  readonly sections: readonly SectionId[];
  /** Segmento de URL bajo `/[lang]/`. `null` es la raíz del idioma. */
  readonly segment: string | null;
}

const PAGES: readonly PageDefinition[] = [
  {
    id: 'home',
    inNav: true,
    // Síntesis, no resumen de todo: el rol actual, lo que tiene case study y la prueba
    // social. Cada bloque enlaza a su página. Lo demás no entra: el objetivo de esta
    // página es que en treinta segundos se entienda el perfil y haya por dónde seguir.
    sections: ['current-role', 'featured-projects', 'recommendations'],
    segment: null,
  },
  {
    id: 'experience',
    inNav: true,
    sections: ['experience', 'stack'],
    segment: 'experience',
  },
  {
    id: 'projects',
    inNav: true,
    sections: ['projects'],
    segment: 'projects',
  },
  {
    id: 'education',
    inNav: true,
    sections: ['education'],
    segment: 'education',
  },
  {
    id: 'about',
    inNav: true,
    sections: ['about', 'journey'],
    segment: 'about-me',
  },
  {
    id: 'hobbies',
    inNav: true,
    sections: ['hobbies'],
    segment: 'hobbies',
  },
  {
    id: 'contact',
    inNav: true,
    navCta: true,
    sections: ['contact'],
    segment: 'contact',
  },
];

const BY_ID = new Map(PAGES.map((page) => [page.id, page]));

export function getPage(id: PageId): PageDefinition {
  const page = BY_ID.get(id);
  if (!page) throw new Error(`Página desconocida: "${id}"`);
  return page;
}

export function getPages(): readonly PageDefinition[] {
  return PAGES;
}

export function getNavPages(): readonly PageDefinition[] {
  return PAGES.filter((page) => page.inNav);
}

/** URL de una página. Es la única forma de construir un link interno en el sitio. */
export function pageHref(id: PageId, lang: SupportedLocale): string {
  const { segment } = getPage(id);
  return segment === null ? `/${lang}` : `/${lang}/${segment}`;
}
