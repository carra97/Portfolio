import Link from 'next/link';
import { NavScroller } from '@/components/layout/NavScroller';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LOCALE_NAMES, type SupportedLocale } from '@/lib/i18n';
import type { Navigation } from '@/lib/pages/nav';
import { routes } from '@/lib/routes';

/**
 * Navegación sticky. Sans de 14px en minúscula inicial, apagada: la navegación es
 * índice del documento, no una barra de aplicación. La página actual va en el color de
 * títulos y subrayada —no en el acento, que queda para el CTA y los links del texto—.
 *
 * Los `href` ya vienen resueltos desde `lib/pages/nav.ts`: este componente no sabe en
 * qué página está ni le hace falta. Solo pinta.
 *
 * **Dos jerarquías, no una lista.** Los destinos de lectura viven en una lista que se
 * desliza; contacto se ancla como botón a la derecha. Con siete pestañas la lista mide
 * 699px en un contenedor de 236px: en un teléfono se ven dos, y dejar la acción más
 * valiosa del sitio en la séptima posición era esconderla. La decisión la declara el
 * registro de páginas (`navCta`), no este componente.
 *
 * **Dos filas en pantallas chicas.** Con el monograma, el botón de contacto y el toggle
 * de tema compitiendo por 390px, a la lista de destinos le quedaban 141px: se veía un
 * ítem y medio. Bajándola a su propia fila pasa a disponer de 342px —dos veces y media
 * más— sin sacar nada de la barra. En ≥ md vuelve a una sola fila, donde entra completa.
 *
 * El degradado del borde derecho —`nav-fade`, solo en pantallas chicas— existe porque
 * una lista que se corta limpia no se lee como deslizable: se lee como completa.
 *
 * **El idioma, como un link.** Lleva a la misma página en el otro idioma: un `<a>` con
 * `hrefLang` y `lang`, sin JavaScript. Dice "EN" o "ES" y el nombre completo, en su
 * propio idioma, va en `aria-label`.
 *
 * El monograma "SC" en lugar del retrato: DISENO.md §7.1 es explícito en que la foto
 * de tres cuartos desaparece a 40px.
 */
export function Nav({
  label,
  lang,
  navigation,
  themeLabel,
}: {
  label: string;
  lang: SupportedLocale;
  navigation: Navigation;
  themeLabel: string;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur-md">
      <nav
        aria-label={label}
        className="page flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 md:flex-nowrap md:gap-6 md:py-3"
      >
        <Link
          className="mr-auto font-medium text-heading transition-colors duration-150 hover:text-accent md:mr-0"
          href={routes.home(lang)}
        >
          SC
        </Link>

        <NavScroller
          labels={
            lang === 'en'
              ? { next: 'More sections', previous: 'Previous sections' }
              : { next: 'Más secciones', previous: 'Secciones anteriores' }
          }
        >
          {navigation.destinations.map((item) => (
            <li key={item.href}>
              <Link
                aria-current={item.current ? 'page' : undefined}
                className={`block py-2 text-sm transition-colors duration-150 hover:text-heading ${
                  item.current
                    ? 'text-heading underline decoration-line-strong underline-offset-[6px]'
                    : 'text-muted'
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </NavScroller>

        {navigation.cta && (
          <Link
            aria-current={navigation.cta.current ? 'page' : undefined}
            className={`shrink-0 rounded-md border px-3 py-1.5 text-sm transition-colors duration-150 ${
              navigation.cta.current
                ? 'border-accent text-accent'
                : 'border-line text-heading hover:border-line-strong hover:text-accent'
            }`}
            href={navigation.cta.href}
          >
            {navigation.cta.label}
          </Link>
        )}

        <Link
          aria-label={LOCALE_NAMES[navigation.language.lang]}
          className="-mx-2 shrink-0 px-2 py-1.5 text-sm text-muted uppercase transition-colors duration-150 hover:text-heading"
          href={navigation.language.href}
          hrefLang={navigation.language.lang}
          lang={navigation.language.lang}
        >
          {navigation.language.lang}
        </Link>

        <ThemeToggle label={themeLabel} />
      </nav>
    </div>
  );
}
