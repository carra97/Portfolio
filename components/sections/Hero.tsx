import Link from 'next/link';
import { QuickFacts } from '@/components/sections/QuickFacts';
import type { SupportedLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import type { Profile } from '@/types/profile';

/**
 * Hero.
 *
 * Dejó de ser una portada y pasó a ser la ficha. Quien evalúa un perfil decide en
 * segundos si sigue leyendo, y los datos que usa para decidir —seniority, stack, equipo,
 * modalidad, idiomas— estaban repartidos entre cuatro secciones separadas por casi mil
 * palabras.
 *
 * **Una sola columna, la ficha abajo.** La versión anterior ponía la ficha en una
 * segunda columna a la derecha. El problema no era la ficha sino lo que provocaba: una
 * columna de texto corto contra una tarjeta alta deja un hueco a la izquierda que hay
 * que rellenar con algo, y ese "algo" —el retrato— quedaba flotando sin función. Con la
 * ficha como banda horizontal debajo del texto, no hay hueco que tapar: el texto ocupa
 * su ancho natural de lectura y la ficha ocupa el ancho completo, que es donde una lista
 * de seis pares clave-valor se lee mejor.
 *
 * En un teléfono el comportamiento no cambia: la banda es la misma tarjeta apilada de
 * antes, y los datos siguen entrando arriba del pliegue.
 *
 * Único momento de movimiento protagonista del sitio (DISENO.md §5): entrada escalonada,
 * 60ms entre elementos, una sola vez. Nada acá se mueve en loop.
 */
export function Hero({
  hero,
  lang,
  ui,
}: {
  hero: Profile['hero'];
  lang: SupportedLocale;
  ui: Profile['ui'];
}) {
  return (
    <header
      className="mx-auto max-w-[1120px] px-6 pb-14 pt-12 md:px-10 md:pb-20 md:pt-20"
      id="top"
    >
      <p className="eyebrow rise" style={{ animationDelay: '0ms' }}>
        {hero.eyebrow}
      </p>

      <h1 className="display rise mt-4" style={{ animationDelay: '60ms' }}>
        {hero.name}
      </h1>

      <p
        className="rise mt-3 font-mono text-sm uppercase tracking-[0.12em] text-accent"
        style={{ animationDelay: '120ms' }}
      >
        {hero.headline}
      </p>

      <p className="measure rise mt-6 text-pretty" style={{ animationDelay: '180ms' }}>
        {hero.tagline}
      </p>

      <div
        className="rise mt-8 flex flex-wrap items-center gap-3"
        style={{ animationDelay: '240ms' }}
      >
        <Link
          className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-on transition-colors duration-150 hover:bg-accent-hover"
          href={routes.contact(lang)}
        >
          {ui.heroContactCta}
        </Link>

        {/* Sin archivo de CV no hay botón. Un enlace de descarga roto es peor que la
            ausencia del botón, porque parece que funciona. Mismo criterio que `lib/env.ts`. */}
        {hero.resumeUrl && (
          <a
            className="rounded-md border border-line px-5 py-2.5 transition-colors duration-150 hover:border-line-strong hover:text-heading"
            download
            href={hero.resumeUrl}
          >
            {ui.resumeCta}
          </a>
        )}
      </div>

      <QuickFacts facts={hero.quickFacts} label={ui.quickFactsLabel} />
    </header>
  );
}
