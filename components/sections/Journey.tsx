import type { Profile } from '@/types/profile';

/**
 * Línea de tiempo personal. La fecha al margen, como el resto del expediente; la línea
 * y los puntos en la columna de lectura. El hito activo —el último— en acento; los
 * demás, apagados.
 */
export function Journey({ timeline }: { timeline: Profile['about']['timeline'] }) {
  return (
    <ol>
      {timeline.map((milestone, index) => {
        const active = index === timeline.length - 1;

        return (
          <li key={milestone.title} className="doc-row">
            <p className="data md:pt-1">{milestone.at}</p>
            <div className={`relative border-l border-line pl-8 ${active ? '' : 'pb-10'}`}>
              <span
                aria-hidden="true"
                className={`absolute -left-1 top-2.5 h-2 w-2 rounded-full ${
                  active ? 'bg-accent' : 'bg-line-strong'
                }`}
              />
              <h3 className="text-heading">{milestone.title}</h3>
              <p className="measure mt-2 text-pretty">{milestone.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
