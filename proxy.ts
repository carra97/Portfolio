import { NextResponse, type NextRequest } from 'next/server';

import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n';

/**
 * Redirige `/` (y cualquier ruta sin prefijo de idioma) al locale por defecto.
 *
 * Por qué proxy (antes middleware) y no un `app/page.tsx` con `redirect()`: el layout raíz es
 * `app/[lang]/layout.tsx` — es el único que puede poner el `lang` correcto en `<html>`,
 * que es un requisito de accesibilidad, no un detalle. Con esa estructura no existe
 * una página en la raíz donde poner el redirect.
 *
 * No hay negociación por `Accept-Language`: hoy existe un solo idioma. Cuando entre
 * 'en', la negociación va acá, y con `Vary: Accept-Language` para no envenenar la cache.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Excluye assets y rutas internas: el middleware solo debe ver navegación de páginas.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
