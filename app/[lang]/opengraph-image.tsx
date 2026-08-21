import { ImageResponse } from 'next/og';

import { getProfile } from '@/lib/content/profile';
import { LOCALES, isSupportedLocale } from '@/lib/i18n';

/**
 * La tarjeta que se ve al compartir el link en LinkedIn o WhatsApp.
 *
 * Generada con `next/og` en vez de diseñada a mano en una imagen: es código versionado,
 * se actualiza sola cuando cambia el dossier, y una por idioma sale gratis. Una PNG
 * exportada a mano queda desactualizada la primera vez que cambia el headline y nadie
 * se entera hasta que alguien comparte el link.
 *
 * Los colores son los tokens de DISENO.md, escritos literales porque este runtime no
 * lee el CSS del sitio.
 */
export const alt = 'Santiago Carrattini — Team Leader & Senior Full Stack Developer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function OpengraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const profile = getProfile(isSupportedLocale(lang) ? lang : 'es');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0C0B0A',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4, color: '#8A857A' }}>
          {profile.hero.eyebrow.toUpperCase()}
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 88, color: '#F2EFE9' }}>
          {profile.hero.name}
        </div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 34, color: '#C49A6C' }}>
          {profile.hero.headline}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 40,
            paddingTop: 32,
            borderTop: '1px solid #262320',
            fontSize: 26,
            color: '#B3AEA4',
          }}
        >
          Node.js · TypeScript · IA aplicada · MCP
        </div>
      </div>
    ),
    size,
  );
}
