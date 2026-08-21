import { Carousel } from '@/components/ui/Carousel';
import { interpolate } from '@/lib/format';
import type { SupportedLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import type { Profile } from '@/types/profile';

/**
 * Proyectos destacados en la landing.
 *
 * El criterio de "destacado" no es una bandera nueva en el JSON: **destacado es el que
 * tiene case study**. Un proyecto gana página propia cuando hay decisiones explicadas y
 * autocrítica para contar (lo exige el esquema), así que esa condición ya separa lo que
 * aguanta una lectura profunda de lo que es una línea de CV. Una flag `featured`
 * separada sería un segundo criterio que se puede contradecir con el primero.
 *
 * En mobile va en carrusel, igual que las recomendaciones: tres tarjetas apiladas son
 * tres pantallas de scroll en la sección que tiene que provocar el click. Reutiliza el
 * primitivo `ui/Carousel` — para eso vive en `ui/` y no dentro de `Testimonials`.
 */
export function FeaturedProjects({
  items,
  lang,
  ui,
  labels,
}: {
  items: Profile['projects'];
  labels: Profile['carousels']['projects'];
  lang: SupportedLocale;
  ui: Profile['ui'];
}) {
  const featured = items.filter((project) => project.slug);

  return (
    <div>
      <Carousel
        columns={featured.length >= 3 ? 3 : 2}
        itemCount={featured.length}
        labels={{ ...labels, role: ui.carouselRole }}
      >
        {featured.map((project, index) => (
          <li
            key={project.name}
            aria-label={interpolate(labels.slidePosition, {
              n: index + 1,
              total: featured.length,
            })}
            aria-roledescription={ui.carouselSlideRole}
            className="flex w-[85%] shrink-0 snap-center flex-col justify-between rounded-xl border border-line bg-surface p-6 md:w-auto md:shrink"
            role="group"
          >
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
              {project.period}
            </p>
            <h3 className="h3 mt-2 text-pretty">{project.name}</h3>

            {/* La descripción se recorta a cuatro líneas: la tarjeta es un anzuelo, no
                el contenido. El texto completo sigue en el DOM —lo leen el crawler y un
                lector de pantalla— y a un click está el case study. Sin el recorte, la
                tarjeta más larga define la altura de las tres y la sección volvía a
                pedir pantalla y media de scroll en un teléfono. */}
            <p className="mt-3 line-clamp-4 text-pretty">{project.description}</p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {project.tech.slice(0, 5).map((tech) => (
                <li
                  key={tech}
                  className="rounded-md border border-line px-2.5 py-1 font-mono text-xs text-muted"
                >
                  {tech}
                </li>
              ))}
            </ul>

            {/* `slug` existe por el filtro de arriba, pero el compilador no lo sabe:
                se comprueba en vez de afirmarlo con `!`. */}
            {project.slug && (
              <p className="mt-6 pt-2">
                <a className="prose-link" href={routes.caseStudy(lang, project.slug)}>
                  {ui.caseStudyLink} →
                </a>
              </p>
            )}
          </li>
        ))}
      </Carousel>

      <p className="mt-8">
        <a className="prose-link" href={routes.projects(lang)}>
          {ui.viewProjects} →
        </a>
      </p>
    </div>
  );
}
