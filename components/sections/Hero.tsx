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
 * **El ajuste que importa es de altura, no de contenido.** En la primera versión la ficha
 * existía pero arrancaba en el píxel 646 de un teléfono de 844: técnicamente estaba
 * arriba, prácticamente no se veía. Ahora el ritmo vertical del hero está comprimido y la
 * ficha es una tarjeta que en ≥1024px ocupa la segunda columna, a la misma altura que el
 * nombre. En un teléfono aparece apenas debajo de los CTA, sin un scroll de por medio.
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
      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-16">
        <div>
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
            <a
              className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-on transition-colors duration-150 hover:bg-accent-hover"
              href={routes.contact(lang)}
            >
              {ui.heroContactCta}
            </a>

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
        </div>

        <QuickFacts facts={hero.quickFacts} label={ui.quickFactsLabel} />
      </div>
    </header>
  );
}
