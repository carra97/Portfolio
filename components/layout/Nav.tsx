import { ThemeToggle } from '@/components/layout/ThemeToggle';
import type { SupportedLocale } from '@/lib/i18n';
import type { Navigation } from '@/lib/pages/nav';
import { routes } from '@/lib/routes';

/**
 * Navegación sticky. Los labels van en mono con tracking abierto — el mismo tratamiento
 * que los eyebrows de sección (DISENO.md §6), así la navegación lee como metadata del
 * documento y no como una barra de aplicación.
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
        className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-1 px-6 py-2.5 md:flex-nowrap md:gap-6 md:px-10 md:py-3"
      >
        <a
          className="mr-auto font-mono text-sm tracking-[0.12em] text-heading transition-colors duration-150 hover:text-accent md:mr-0"
          href={routes.home(lang)}
        >
          SC
        </a>

        <ul className="nav-fade order-last flex w-full gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] md:order-none md:w-auto md:flex-1 [&::-webkit-scrollbar]:hidden">
          {navigation.destinations.map((item) => (
            <li key={item.href}>
              <a
                aria-current={item.current ? 'page' : undefined}
                className={`block py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-150 hover:text-heading ${
                  item.current ? 'text-accent' : 'text-muted'
                }`}
                href={item.href}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {navigation.cta && (
          <a
            aria-current={navigation.cta.current ? 'page' : undefined}
            className={`shrink-0 rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-150 ${
              navigation.cta.current
                ? 'border-accent text-accent'
                : 'border-line text-heading hover:border-line-strong hover:text-accent'
            }`}
            href={navigation.cta.href}
          >
            {navigation.cta.label}
          </a>
        )}

        <ThemeToggle label={themeLabel} />
      </nav>
    </div>
  );
}
