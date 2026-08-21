import type { Profile } from '@/types/profile';

/**
 * Ficha de escaneo rápido.
 *
 * **Por qué es una tarjeta y no una lista suelta:** medido sobre una versión anterior, en
 * un teléfono de 390×844 la ficha empezaba en el píxel 646 y terminaba en el 1232 — o sea,
 * quien entraba veía el nombre, el titular y el CTA, y la información que realmente busca
 * quedaba abajo del pliegue. Encerrarla en una superficie con borde la vuelve un objeto
 * visual que se distingue del texto corrido, y no un párrafo más.
 *
 * **Una banda horizontal, no una columna lateral.** La ficha ocupa el ancho completo
 * debajo del texto del hero. En pantallas anchas eso la acomoda en tres columnas por dos
 * filas, que es como se lee una lista de pares clave-valor; como columna lateral angosta,
 * cada valor se partía en dos o tres renglones y además obligaba a rellenar el hueco que
 * quedaba al lado del texto. Apilada en un teléfono, es exactamente la misma tarjeta.
 *
 * `<dl>` y no una grilla de tarjetas: es una lista de pares clave-valor y ese es el
 * elemento que existe para eso. Un lector de pantalla anuncia la relación término →
 * definición sin que haya que inventar `aria-label`s.
 *
 * Nombre accesible propio (`aria-labelledby`) porque vive dentro del `<header>` del hero,
 * que ya está nombrado por el `<h1>`: sin esto sería un grupo de datos colgando del nombre
 * de la persona.
 */
export function QuickFacts({
  facts,
  label,
}: {
  facts: Profile['hero']['quickFacts'];
  label: string;
}) {
  return (
    <section
      aria-labelledby="quick-facts-title"
      className="rise mt-12 rounded-xl border border-line bg-surface p-6 md:mt-14 md:p-8"
      style={{ animationDelay: '300ms' }}
    >
      <h2 className="eyebrow" id="quick-facts-title">
        {label}
      </h2>

      <dl className="mt-6 grid gap-x-12 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="border-t border-line pt-4">
            <dt className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
              {fact.label}
            </dt>
            <dd className="mt-1.5 text-pretty text-heading">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
