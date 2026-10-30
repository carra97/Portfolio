import { GeistMono } from 'geist/font/mono';
import { Schibsted_Grotesk } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { Chat } from '@/components/chat/Chat';
import { publicAsset } from '@/lib/assets';
import { getCaseStudies } from '@/lib/content/case-studies';
import { getProfile } from '@/lib/content/profile';
import { chatEnabled, env } from '@/lib/env';
import { LOCALES, isSupportedLocale } from '@/lib/i18n';
import { getPages, pageHref } from '@/lib/pages/registry';

import '../globals.css';

/**
 * Schibsted Grotesk para todo el texto; Geist Mono queda para estados, fechas y código
 * (DISENO.md §3, Rev. 5). `next/font` la sirve desde el propio dominio, así que la CSP
 * (`font-src 'self'`) no cambia.
 */
const schibsted = Schibsted_Grotesk({
  display: 'swap',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-schibsted',
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * `theme-color` para la barra del navegador en mobile (DISENO.md §2).
 *
 * Uno solo, el del oscuro, y no uno por `prefers-color-scheme`: el sitio no sigue al
 * sistema, así que con el sistema en claro la barra quedaba clara sobre una página
 * oscura. Quien elige el claro lo actualiza `ThemeToggle` al montar.
 */
export const viewport: Viewport = {
  /**
   * Teclado virtual.
   *
   * El panel del chat está anclado al borde inferior. Sin esto, en Android el teclado se
   * dibuja ENCIMA del contenido y tapa el campo de texto justo cuando se lo va a usar.
   * `resizes-content` hace que el viewport se achique al abrirse el teclado, así que el
   * panel se reacomoda solo — la altura ya está en `dvh`, que es la unidad que sigue ese
   * cambio.
   *
   * En navegadores que no lo soportan simplemente se ignora, así que no hay nada que
   * detectar ni ninguna rama que mantener.
   */
  interactiveWidget: 'resizes-content',
  themeColor: '#0c0b0a',
};

/**
 * Solo lo que comparten TODAS las rutas del idioma. Título, descripción y canonical
 * los define cada página: con dos rutas públicas y los case studies, dejarlos acá
 * significaba que una página que se olvidara de sobrescribirlos heredaba el canonical
 * del hub — el tipo de error de SEO que nadie ve hasta que Google deduplica.
 */
export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  robots: { index: true, follow: true },
};

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

  const profile = getProfile(lang);
  const { ui } = profile;

  /**
   * Lista blanca de rutas enlazables dentro de las respuestas del chat, derivada del
   * mismo registro que arma la navegación y el sitemap. Es la contraparte en el cliente
   * del mapa que el corpus le pasa al modelo: el modelo puede *nombrar* una ruta, pero
   * solo se convierte en link si el sitio realmente la sirve.
   */
  const chatRoutes = [
    ...getPages().map((page) => pageHref(page.id, lang)),
    ...getCaseStudies(lang).map((study) => `/${lang}/projects/${study.slug}`),
    ...(profile.hero.resumeUrl ? [profile.hero.resumeUrl] : []),
  ];

  /**
   * Avatar de Raukar. Se resuelve en build: si el archivo no está, `publicAsset` devuelve
   * `null` y el widget cae al monograma en vez de pedir una imagen que responde 404.
   */
  const chatAvatar = {
    base: publicAsset('raukar.webp') ?? publicAsset('raukar.png'),
  };

  return (
    /**
     * `suppressHydrationWarning` acá y en ningún otro lado.
     *
     * El script de `themeInit` corre **antes** de que React hidrate y escribe
     * `data-theme` en este mismo elemento. Eso es intencional —es lo que evita el flash
     * de tema— pero significa que el DOM que React encuentra al hidratar no coincide con
     * el HTML que mandó el servidor, y React lo reporta como error de hidratación.
     *
     * No se está tapando un bug: se está declarando que la diferencia es deliberada y
     * está acotada a los atributos de este nodo. La propiedad no se propaga a los hijos,
     * así que cualquier otra desincronización del árbol sigue avisando.
     */
    <html
      className={`${schibsted.variable} ${GeistMono.variable}`}
      lang={lang}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <a
          className="sr-only rounded-md bg-accent px-4 py-2 text-accent-on focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
          href="#content"
        >
          {ui.skipToContent}
        </a>
        {children}

        {/*
          El chat vive en el layout y no en `PageShell`, y eso es funcional, no estético.
          Un layout del App Router persiste mientras se navega entre sus rutas hijas: acá
          el widget NO se desmonta al ir de `/es` a `/es/projects`, así que la
          conversación se mantiene y un stream en curso sigue llegando mientras la persona
          navega el sitio. Montado en la página, cada `<Link>` lo desmontaba, se abortaba
          el `fetch` y la respuesta se perdía a mitad de generación.

          `chatEnabled` exige a la vez el kill switch encendido, la clave del proveedor y
          el backend de rate limit: sin las tres no se envía ni un byte de JavaScript del
          widget y el sitio se sirve completo.
        */}
        {chatEnabled && (
          <Chat
            avatar={chatAvatar}
            labels={{
              close: ui.chatClose,
              disclaimer: ui.chatDisclaimer,
              error: ui.chatError,
              greeting: ui.chatGreeting,
              launcher: ui.chatLauncher,
              placeholder: ui.chatPlaceholder,
              ready: ui.chatReady,
              retry: ui.chatRetry,
              send: ui.chatSend,
              thinking: ui.chatThinking,
              title: ui.chatTitle,
            }}
            lang={lang}
            routes={chatRoutes}
          />
        )}
      </body>
    </html>
  );
}
