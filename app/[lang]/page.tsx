import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/layout/JsonLd';
import { PageShell } from '@/components/layout/PageShell';
import { AboutTeaser } from '@/components/sections/AboutTeaser';
import { Hero } from '@/components/sections/Hero';
import { getProfile } from '@/lib/content/profile';
import { isSupportedLocale } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/pages/metadata';

/**
 * Landing.
 *
 * Es una síntesis, no un índice: hero con la ficha de un vistazo, el rol actual, los
 * proyectos que tienen case study y la prueba social. Todo lo demás vive en su propia
 * ruta y se llega por el nav o por el enlace al pie de cada bloque.
 *
 * El JSON-LD `Person` va solo acá: es la página canónica de la identidad. Repetirlo en
 * las cinco rutas no agrega señal y multiplica el riesgo de que dos versiones digan
 * cosas distintas.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildPageMetadata('home', lang);
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const profile = getProfile(lang);

  return (
    <>
      <JsonLd profile={profile} />
      <PageShell
        after={<AboutTeaser about={profile.about} lang={lang} ui={profile.ui} />}
        header={<Hero hero={profile.hero} lang={lang} ui={profile.ui} />}
        lang={lang}
        page="home"
        profile={profile}
      />
    </>
  );
}
