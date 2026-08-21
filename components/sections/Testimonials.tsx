import { Carousel } from '@/components/ui/Carousel';
import { interpolate } from '@/lib/format';
import type { Profile, TestimonialRelation } from '@/types/profile';

/**
 * Recomendaciones.
 *
 * En mobile eran tres tarjetas apiladas: ~140 palabras de scroll vertical en la
 * sección que más pesa como prueba social y a la que menos gente llegaba. Ahora es un
 * carrusel horizontal —una tarjeta y el borde de la siguiente asomando, que es lo que
 * comunica "hay más" sin necesidad de un control—. En desktop vuelve a ser grilla de
 * tres: ahí el ancho sobra y esconder contenido sería una pérdida neta.
 *
 * Contrapartida honesta: lo que está fuera de vista se lee menos. Por eso los tres
 * testimonios siguen enteros en el HTML (ver `components/ui/Carousel.tsx`) y la
 * relación de quien recomienda se muestra siempre: que dos personas a las que lideró
 * avalen su liderazgo dice algo que una recomendación de un par no dice.
 */
export function Testimonials({
  carousel,
  items,
  labels,
  ui,
}: {
  carousel: Profile['carousels']['testimonials'];
  items: Profile['testimonials'];
  labels: Record<TestimonialRelation, string>;
  ui: Profile['ui'];
}) {
  return (
    <Carousel
      itemCount={items.length}
      labels={{ ...carousel, role: ui.carouselRole }}
    >
      {items.map((testimonial, index) => (
        <li
          key={testimonial.author}
          aria-label={interpolate(carousel.slidePosition, {
            n: index + 1,
            total: items.length,
          })}
          aria-roledescription={ui.carouselSlideRole}
          className="flex w-[85%] shrink-0 snap-center flex-col rounded-xl border border-line bg-surface p-6 md:w-auto md:shrink"
          role="group"
        >
          <blockquote className="flex-1 text-pretty">“{testimonial.quote}”</blockquote>
          <figcaption className="mt-5 border-t border-line pt-4">
            <p className="text-heading">
              {testimonial.url ? (
                <a
                  className="prose-link"
                  href={testimonial.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {testimonial.author}
                </a>
              ) : (
                testimonial.author
              )}
            </p>
            <p className="small mt-0.5">{testimonial.role}</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-accent">
              {labels[testimonial.relation]}
            </p>
          </figcaption>
        </li>
      ))}
    </Carousel>
  );
}
