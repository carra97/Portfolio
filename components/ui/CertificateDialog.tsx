'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Certification } from '@/types/profile';

/**
 * Visor de certificados en diálogo modal.
 *
 * **Por qué `<dialog>` nativo y no un div con `position: fixed`.** El elemento del
 * navegador trae resueltas, y bien, cuatro cosas que una implementación casera suele
 * hacer a medias: atrapa el foco dentro del diálogo, cierra con Escape, vuelve el foco
 * al disparador al cerrar, y marca el resto de la página como inerte para lectores de
 * pantalla. Nada de eso es JavaScript nuestro. El componente pesa lo que pesa el estado
 * de "cuál está abierto".
 *
 * **Degradación sin JavaScript.** El disparador es un `<a href>` a la imagen: sin JS
 * hace lo que hace cualquier enlace y muestra el certificado. Con JS interceptamos el
 * click y abrimos el modal. Los controles son la mejora, no el mecanismo — el mismo
 * criterio que el carrusel.
 *
 * **Por qué un solo diálogo y no uno por certificado.** Trece diálogos en el DOM para
 * mostrar uno son doce elementos muertos. Este componente posee el estado de cuál está
 * abierto y renderiza una sola instancia.
 *
 * **Todos los certificados se pueden mirar, y los que además tienen verificación del
 * emisor la ofrecen adentro del diálogo.** No son alternativas: la imagen responde
 * "¿qué dice?" y el enlace del emisor responde "¿es cierto?". Un certificado servido
 * desde este dominio no prueba nada por sí solo —lo publicamos nosotros—; uno servido
 * por HackerRank o EF SET, sí.
 *
 * La imagen se monta recién al abrir: 874 KB de certificados no se descargan porque
 * alguien llegó a la sección de formación.
 */

interface CertificateDialogLabels {
  readonly close: string;
  readonly fullSize: string;
  readonly open: string;
  readonly verify: string;
}

export function CertificateList({
  certifications,
  labels,
}: {
  certifications: readonly Certification[];
  labels: CertificateDialogLabels;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Certification | null>(null);

  const open = useCallback((certification: Certification) => {
    setActive(certification);
    dialogRef.current?.showModal();
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  // `close` también lo dispara Escape, que no pasa por nuestro handler: el estado se
  // limpia escuchando el evento del propio elemento, no el click del botón.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => setActive(null);
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

  return (
    <>
      <ul className="space-y-1.5">
        {certifications.map((certification) => (
          <li key={certification.name} className="flex flex-wrap items-baseline gap-x-3">
            {certification.image ? (
              <a
                aria-haspopup="dialog"
                className="prose-link"
                href={`/certificados/${certification.image}`}
                onClick={(event) => {
                  // Sin JS este `preventDefault` no corre y el enlace funciona solo:
                  // el navegador abre la imagen del certificado.
                  event.preventDefault();
                  open(certification);
                }}
              >
                {certification.name}
              </a>
            ) : (
              certification.name
            )}
            {certification.year && (
              <span className="font-mono text-xs tracking-[0.12em] text-muted">
                {certification.year}
              </span>
            )}
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-labelledby="certificate-dialog-title"
        // `m-auto` es necesario: el `<dialog>` nativo se centra con `margin: auto` y el
        // preflight de Tailwind lo pisa con `margin: 0`, dejándolo pegado al borde.
        className="m-auto max-h-[90dvh] w-[min(92vw,900px)] rounded-xl border border-line bg-surface p-0 text-body backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        // Click en el fondo: el backdrop pertenece al propio `<dialog>`, así que un
        // click cuyo target es el diálogo —y no su contenido— vino de afuera.
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        {active && (
          <div className="flex max-h-[90dvh] flex-col">
            <div className="flex items-start justify-between gap-6 border-b border-line p-5">
              <h2 className="h3 text-pretty" id="certificate-dialog-title">
                {active.name}
              </h2>
              <button
                aria-label={labels.close}
                className="-mt-1 shrink-0 rounded-md border border-line px-2.5 py-1 text-muted transition-colors duration-150 hover:border-line-strong hover:text-heading"
                onClick={close}
                type="button"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="overflow-auto p-5">
              {active.image && (
                <img
                  alt={active.name}
                  className="mx-auto w-full rounded-lg border border-line"
                  src={`/certificados/${active.image}`}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-line p-5">
              {/* La verificación del emisor primero: es prueba de un tercero y no se
                  puede falsificar desde este repositorio. La imagen la servimos
                  nosotros, así que vale menos y va después. */}
              {active.verifyUrl && (
                <a
                  className="prose-link text-sm"
                  href={active.verifyUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {labels.verify} →
                </a>
              )}
              {active.image && (
                <a
                  className="prose-link text-sm"
                  href={`/certificados/${active.image}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {labels.fullSize} →
                </a>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
