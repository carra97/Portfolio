import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { PageShell } from '@/components/layout/PageShell';
import { getProfile } from '@/lib/content/profile';
import { LOCALES, isSupportedLocale } from '@/lib/i18n';
import { buildPageMetadata } from '@/lib/pages/metadata';

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildPageMetadata('experience', lang);
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const profile = getProfile(lang);

  return (
    <PageShell
      header={<PageHeader meta={profile.pages.experience} />}
      lang={lang}
      page="experience"
      profile={profile}
    />
  );
}
