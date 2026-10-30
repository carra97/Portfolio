import { TimelineProgress } from '@/components/ui/TimelineProgress';
import type { Profile } from '@/types/profile';

/**
 * Línea de tiempo personal. La fecha al margen, como el resto del expediente; la línea
 * y los puntos en la columna de lectura. El hito activo —el último— en acento; los
 * demás, apagados.
 *
 * **El scroll dispara cada paso** (Rev. 6, pedido de Santiago): cuando un hito llega a
 * cierta altura de la pantalla, el punto amarillo viaja hasta él en un tiempo fijo; el
 * anterior queda gris y el texto se enciende. Es el mismo gesto que el recorrido del
 * home —un estado después del otro—. Cuándo se dispara lo decide `TimelineProgress`;
 * cómo se ve, `globals.css`. Sin JavaScript o con movimiento reducido, queda estática.
 */
export function Journey({ timeline }: { timeline: Profile['about']['timeline'] }) {
  return (
    <TimelineProgress>
      {timeline.map((milestone, index) => {
        const active = index === timeline.length - 1;

        return (
          <li key={milestone.title} className="doc-row">
            <p className="journey-text data md:pt-1">{milestone.at}</p>
            <div
              className={`relative border-l border-line pl-8 ${active ? '' : 'journey-segment pb-10'}`}
            >
              <span
                aria-hidden="true"
                className={`journey-node absolute -left-1 top-2.5 h-2 w-2 rounded-full ${
                  active ? 'bg-accent' : 'bg-line-strong'
                }`}
              />
              <div className="journey-text">
                <h3 className="text-heading">{milestone.title}</h3>
                <p className="measure mt-2 text-pretty">{milestone.body}</p>
              </div>
            </div>
          </li>
        );
      })}
    </TimelineProgress>
  );
}
