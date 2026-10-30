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
 * debajo del texto del hero, con una fila por dato: como columna lateral angosta, cada
 * valor se partía en dos o tres renglones. Apilada en un teléfono, es la misma tarjeta.
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
      className="mt-12 rounded-xl border border-line bg-surface p-6 md:mt-14 md:p-8"
    >
      <h2 className="eyebrow" id="quick-facts-title">
        {label}
      </h2>

      {/* Carátula del expediente: el término al margen y el valor en la columna de
          lectura, una fila por dato. Es la misma grilla que el resto del sitio. */}
      <dl className="mt-4 divide-y divide-line">
        {facts.map((fact) => (
          <div key={fact.label} className="doc-row py-3.5 last:pb-0">
            <dt className="label md:pt-px">{fact.label}</dt>
            <dd className="text-pretty text-heading">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
