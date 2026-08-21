import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Nav } from '@/components/layout/Nav';
import { Section } from '@/components/layout/Section';
import type { SupportedLocale } from '@/lib/i18n';
import { buildNav } from '@/lib/pages/nav';
import { getPage, type PageId } from '@/lib/pages/registry';
import { resolveSections } from '@/lib/sections/registry';
import type { Profile } from '@/types/profile';

/**
 * Estructura común de toda página del sitio: nav, encabezado, secciones, footer.
 *
 * Existe por la razón más aburrida y más real: con cinco rutas, el nav, el skip-link,
 * el `<main>` y el footer se repetían cinco veces. La quinta copia es donde una de las
 * cinco se olvida el `id="content"` y el enlace "saltar al contenido" deja de funcionar
 * en esa página — un bug de accesibilidad que no rompe nada visible.
 *
 * Las secciones no se pasan como children: se resuelven desde los dos registros a
 * partir del `page`. Una página concreta no elige qué muestra ni en qué orden; eso lo
 * declara `lib/pages/registry.ts`.
 */
export function PageShell({
  header,
  lang,
  page,
  profile,
  after,
}: {
  /** Bloque de encabezado propio de la página (el hero en el home, un `<h1>` en el resto). */
  header: ReactNode;
  lang: SupportedLocale;
  page: PageId;
  profile: Profile;
  /** Contenido opcional después de las secciones: un CTA de cierre, por ejemplo. */
  after?: ReactNode;
}) {
  const sections = resolveSections(getPage(page).sections, profile);
  const pageHeading = profile.pages[page].heading;

  /**
   * Cuándo el título de una sección es ruido: cuando la página tiene una sola sección
   * —el `<h1>` ya dice de qué trata— o cuando el título repite literalmente ese `<h1>`.
   * Es la diferencia entre "Proyectos / Proyectos" y "Proyectos".
   *
   * La regla vive acá y no en cada página porque es una propiedad de la composición, no
   * de una ruta en particular; si mañana `/experience` queda con una sola sección, se
   * comporta bien sin que nadie se acuerde de tocarla.
   */
  const isRedundantTitle = (title: string) => sections.length === 1 || title === pageHeading;

  return (
    <>
      <Nav
        label={profile.ui.navLabel}
        lang={lang}
        navigation={buildNav(page, lang, profile)}
        themeLabel={profile.ui.themeToggle}
      />

      {header}

      <main id="content">
        {sections.map((section) => {
          const title = profile.sections[section.titleKey];

          return (
            <Section
              key={section.id}
              id={section.id}
              title={title}
              titleHidden={isRedundantTitle(title)}
            >
              {section.render({ lang, profile })}
            </Section>
          );
        })}

        {after}
      </main>

      <Footer lang={lang} name={profile.hero.name} ui={profile.ui} />
    </>
  );
}
