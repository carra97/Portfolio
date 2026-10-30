import Link from 'next/link';
import { QuickFacts } from '@/components/sections/QuickFacts';
import { StateFlow } from '@/components/sections/StateFlow';
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
 * **Texto a la izquierda, el diagrama de estados a la derecha, la ficha abajo.** Una
 * versión anterior ponía la ficha en la segunda columna y dejaba un hueco que había que
 * rellenar. El diagrama no rellena: es la tesis del perfil —sistemas que mueven trabajo
 * de un estado al siguiente— dibujada con un trámite real. En un teléfono va debajo de
 * los botones.
 *
 * **El hero queda quieto.** El momento de movimiento del home es el recorrido del
 * diagrama (DISENO.md §5, Rev. 5): un solo momento por página. Una entrada escalonada
 * del texto al mismo tiempo serían dos cosas compitiendo por la misma mirada.
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
    <header className="page pb-14 pt-12 md:pb-20 md:pt-20" id="top">
      <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
        <div>
          <p className="eyebrow">{hero.eyebrow}</p>

          <h1 className="display mt-3">{hero.name}</h1>

          <p className="h3 mt-3 font-normal text-heading">{hero.headline}</p>

          <p className="measure mt-6 text-pretty">{hero.tagline}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link className="btn-primary" href={routes.contact(lang)}>
              {ui.heroContactCta}
            </Link>

            {/* Sin archivo de CV no hay botón. Un enlace de descarga roto es peor que la
                ausencia del botón, porque parece que funciona. Mismo criterio que `lib/env.ts`. */}
            {hero.resumeUrl && (
              <a className="btn-secondary" download href={hero.resumeUrl}>
                {ui.resumeCta}
              </a>
            )}
          </div>
        </div>

        <div className="md:pt-3">
          <StateFlow flow={hero.flow} lang={lang} linkLabel={ui.caseStudyLink} />
        </div>
      </div>

      <QuickFacts facts={hero.quickFacts} label={ui.quickFactsLabel} />
    </header>
  );
}
