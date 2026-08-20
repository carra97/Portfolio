import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { getProfile } from '@/lib/content';
import { env } from '@/lib/env';
import { LOCALES, isSupportedLocale } from '@/lib/i18n';

import '../globals.css';

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * `theme-color` por esquema para la barra del navegador en mobile (DISENO.md §2).
 * Los valores son los mismos tokens `--bg-page` de cada modo.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0c0b0a' },
    { media: '(prefers-color-scheme: light)', color: '#faf7f1' },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};

  const { meta } = getProfile(lang);

  return {
    title: meta.title,
    description: meta.description,
    metadataBase: new URL(env.SITE_URL),
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      type: 'profile',
      locale: lang,
      title: meta.title,
      description: meta.description,
      url: `/${lang}`,
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Se aplica el tema guardado ANTES del primer paint. Si esto corriera en un efecto,
 * quien eligió el modo claro vería un flash oscuro en cada carga. Es la razón por la
 * que un script inline y bloqueante está justificado acá y en ningún otro lugar.
 */
const themeInit = `try{if(localStorage.getItem('theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const { ui } = getProfile(lang);

  return (
    <html className={`${GeistSans.variable} ${GeistMono.variable}`} lang={lang}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <a
          className="sr-only rounded-md bg-accent px-4 py-2 text-accent-on focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
          href="#contenido"
        >
          {ui.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
