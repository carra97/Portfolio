import type { Profile } from '@/types/profile';

/**
 * Nada de grilla de íconos: aplana los hobbies y los vuelve intercambiables. Cada uno
 * lleva una línea con contenido real (DISENO.md §7 / plan §3.7). La robótica es el
 * único destacado —es la señal más fuerte del set: hardware + software + iteración— y
 * es el único con foto.
 */
export function Hobbies({ items }: { items: Profile['hobbies'] }) {
  const lead = items.find((hobby) => hobby.emphasis === 'lead');
  const rest = items.filter((hobby) => hobby.emphasis !== 'lead');

  return (
    <div className="grid gap-12 md:grid-cols-[1fr_300px] md:gap-16">
      <div className="space-y-8">
        {lead && (
          <div>
            <h3 className="h3">{lead.name}</h3>
            <p className="measure mt-2 text-pretty">{lead.detail}</p>
          </div>
        )}

        <dl className="space-y-6 border-t border-line pt-8">
          {rest.map((hobby) => (
            <div key={hobby.name}>
              <dt className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
                {hobby.name}
              </dt>
              <dd className="measure mt-1.5 text-pretty">{hobby.detail}</dd>
            </div>
          ))}
        </dl>
      </div>

      <figure className="md:self-start">
        <img
          alt="Rover de dos ruedas con chasis impreso en 3D, placa Arduino, protoboard y sensor ultrasónico HC-SR04"
          className="w-full rounded-xl border border-line"
          height={1200}
          src="/rover-arduino.jpg"
          width={900}
        />
        <figcaption className="small mt-3">
          Rover evita-obstáculos: Arduino, HC-SR04 y chasis impreso.
        </figcaption>
      </figure>
    </div>
  );
}
