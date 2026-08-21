import Link from 'next/link';
import { routes } from '@/lib/routes';
import type { SupportedLocale } from '@/lib/i18n';
import type { Profile } from '@/types/profile';

/**
 * Puente del hub hacia `/[lang]/about-me`.
 *
 * No es una sección numerada a propósito: es un enlace, no contenido. Y va después de
 * la evidencia profesional porque ese es el orden en que se lee un perfil — primero
 * "sabe hacer esto", después "quién es". Invertirlo era el problema que tenía el sitio.
 *
 * La cita es `about.principle`, que ya está en el dossier. No se redacta un resumen
 * nuevo: sería texto en primera persona de Santiago que Santiago no dijo.
 */
export function AboutTeaser({
  about,
  lang,
  ui,
}: {
  about: Profile['about'];
  lang: SupportedLocale;
  ui: Profile['ui'];
}) {
  return (
    <section aria-label={ui.aboutTeaserEyebrow} className="border-t border-line">
      <div className="reveal mx-auto max-w-[1120px] px-6 py-20 md:px-10 md:py-28">
        <p className="eyebrow">{ui.aboutTeaserEyebrow}</p>
        <blockquote className="measure mt-4 border-l-2 border-accent pl-6 text-pretty text-[1.375rem] leading-[1.45] text-heading">
          {about.principle}
        </blockquote>
        <p className="mt-8">
          <Link className="prose-link" href={routes.about(lang)}>
            {ui.aboutCta} →
          </Link>
        </p>
      </div>
    </section>
  );
}
