import { ReplayOnView } from '@/components/ui/ReplayOnView';
import type { Profile } from '@/types/profile';

/**
 * Línea de tiempo personal. La fecha al margen, como el resto del expediente; la línea
 * y los puntos en la columna de lectura. El hito activo —el último— en acento; los
 * demás, apagados.
 *
 * **Se recorre al bajar** (Rev. 6, pedido de Santiago): cada hito dibuja su tramo de
 * línea, marca su punto y muestra su texto cuando entra en pantalla, y se repite si se
 * vuelve a él (`ReplayOnView`). Es el mismo gesto que el recorrido del home —un estado
 * después del otro—, no un fundido genérico por sección.
 */
export function Journey({ timeline }: { timeline: Profile['about']['timeline'] }) {
  return (
    <ol>
      {timeline.map((milestone, index) => {
        const active = index === timeline.length - 1;

        return (
          <li key={milestone.title}>
            <ReplayOnView className="doc-row">
              <p className="journey-text data md:pt-1">{milestone.at}</p>
              <div className={`journey-line relative pl-8 ${active ? '' : 'pb-10'}`}>
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
            </ReplayOnView>
          </li>
        );
      })}
    </ol>
  );
}
