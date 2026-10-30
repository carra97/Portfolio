import type { Profile } from '@/types/profile';

/**
 * Línea de tiempo personal. La fecha al margen, como el resto del expediente; la línea
 * y los puntos en la columna de lectura. El hito activo —el último— en acento; los
 * demás, apagados.
 *
 * **Se recorre con el scroll** (Rev. 6, pedido de Santiago): un punto en acento baja por
 * la línea al ritmo del scroll; cada hito se enciende cuando el punto llega y queda
 * oscuro cuando sigue de largo, y su texto aparece a medida que el punto se acerca. Es
 * el mismo gesto que el recorrido del home —un estado después del otro—.
 *
 * Todo es CSS (`view-timeline` en `globals.css`): sin JavaScript y reversible al subir.
 * Donde no hay soporte, o con movimiento reducido, la línea queda estática como siempre.
 */
export function Journey({ timeline }: { timeline: Profile['about']['timeline'] }) {
  return (
    <ol>
      {timeline.map((milestone, index) => {
        const active = index === timeline.length - 1;

        return (
          <li key={milestone.title} className="journey-item doc-row">
            <p className="journey-text data md:pt-1">{milestone.at}</p>
            <div
              className={`relative border-l border-line pl-8 ${active ? '' : 'journey-segment pb-10'}`}
            >
              <span
                aria-hidden="true"
                className={`journey-node absolute -left-1 top-2.5 h-2 w-2 rounded-full ${
                  active ? 'journey-node-final bg-accent' : 'bg-line-strong'
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
    </ol>
  );
}
