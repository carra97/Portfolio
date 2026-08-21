import { env } from '@/lib/env';
import type { Profile } from '@/types/profile';

/**
 * JSON-LD `Person`.
 *
 * Regla dura del dossier: el teléfono NO entra acá. Los datos estructurados son el
 * primer lugar que raspan los agregadores, y un `telephone` en JSON-LD no aporta nada
 * al SEO de un portfolio personal. El email tampoco: `sameAs` con los perfiles públicos
 * cubre la identidad, que es para lo que sirve este bloque.
 */
export function JsonLd({ profile }: { profile: Profile }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.hero.name,
    jobTitle: profile.hero.headline,
    description: profile.pages.home.description,
    url: env.SITE_URL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Paraná',
      addressRegion: 'Entre Ríos',
      addressCountry: 'AR',
    },
    knowsLanguage: profile.languages.map((language) => language.name),
    sameAs: [
      'https://www.linkedin.com/in/santiago-nicolas-carrattini',
      'https://github.com/carra97',
    ],
  };

  return (
    <script
      type="application/ld+json"
      // El contenido es un objeto que construimos nosotros a partir del JSON tipado,
      // no entrada de usuario. Aun así se escapa `<` para cerrar el vector de inyección
      // por si un campo del dossier alguna vez contuviera markup.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
