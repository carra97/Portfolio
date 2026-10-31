import Link from 'next/link';
import { ReplayOnView } from '@/components/ui/ReplayOnView';
import type { SupportedLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import type { Profile } from '@/types/profile';

/**
 * Carátula del expediente: los datos de escaneo rápido, el extracto y los botones.
 *
 * **Por qué un bloque propio y no una lista suelta:** medido sobre una versión anterior,
 * en un teléfono de 390×844 la ficha empezaba en el píxel 646 y terminaba en el 1232 — o
 * sea, quien entraba veía el nombre, el titular y el CTA, y la información que realmente
 * busca quedaba abajo del pliegue. Tiene que leerse como un objeto, no como un párrafo más.
 *
 * **Un formulario de mesa de entradas, no una tarjeta** (Rev. 6). Campos con rótulo
 * chico y valor, separados por filetes como en un formulario impreso, y un sello de
 * estado encima. En modo claro es papel manila; en oscuro, la misma estructura sobre la
 * superficie. Los filetes los dibuja el `gap` de 1px sobre el color de línea: ninguna
 * celda necesita saber si es la primera de su fila.
 *
 * `<dl>` porque son pares clave-valor. Nombre accesible propio (`aria-labelledby`)
 * porque vive dentro del `<header>` del hero, que ya está nombrado por el `<h1>`.
 */
export function QuickFacts({
  hero,
  lang,
  ui,
}: {
  hero: Profile['hero'];
  lang: SupportedLocale;
  ui: Profile['ui'];
}) {
  return (
    <section
      aria-labelledby="quick-facts-title"
      className="relative mt-12 border border-line-strong bg-surface md:mt-14"
    >
      <h2 className="sr-only" id="quick-facts-title">
        {ui.quickFactsLabel}
      </h2>

      {/* ponytail: la grilla de 6 columnas reparte 5 datos en 3 + 2. Con otra cantidad
          la última fila queda con un hueco; si cambia, ajustar el `nth-child`. */}
      <dl className="grid gap-px bg-line md:grid-cols-6">
        {hero.quickFacts.map((fact) => (
          <div
            key={fact.label}
            className="bg-surface px-5 py-4 md:col-span-2 md:px-6 md:[&:nth-child(n+4)]:col-span-3"
          >
            <dt className="label">{fact.label}</dt>
            <dd className="mt-0.5 text-pretty text-heading">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-5 border-t border-line px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:px-6">
        <div>
          <p className="label">{ui.extractLabel}</p>
          <p className="mt-0.5 max-w-[52ch] text-pretty text-heading">{hero.extract}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

      {/* Monta sobre el borde superior sin tapar ningún campo. */}
      <ReplayOnView className="absolute -top-9 right-4 md:-top-11 md:right-6">
        <p className="stamp stamp-drop bg-surface">
          <span>{hero.stamp.label}</span>
          <span>{hero.stamp.note}</span>
        </p>
      </ReplayOnView>
    </section>
  );
}
