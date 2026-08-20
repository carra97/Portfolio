import type { Profile, TestimonialRelation } from '@/types/profile';

/**
 * La relación entre quien recomienda y Santiago es la mitad del valor del testimonio:
 * que dos personas a las que lideró avalen su liderazgo dice algo que una recomendación
 * de un par no dice. Por eso la etiqueta es obligatoria en el tipo y se renderiza
 * siempre, no como adorno opcional.
 */
export function Testimonials({
  items,
  labels,
}: {
  items: Profile['testimonials'];
  labels: Record<TestimonialRelation, string>;
}) {
  return (
    <ul className="grid gap-8 md:grid-cols-3">
      {items.map((testimonial) => (
        <li
          key={testimonial.author}
          className="flex flex-col rounded-xl border border-line bg-surface p-6"
        >
          <blockquote className="flex-1 text-pretty">“{testimonial.quote}”</blockquote>
          <figcaption className="mt-5 border-t border-line pt-4">
            <p className="text-heading">
              {testimonial.url ? (
                <a className="prose-link" href={testimonial.url} rel="noopener noreferrer" target="_blank">
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
    </ul>
  );
}
