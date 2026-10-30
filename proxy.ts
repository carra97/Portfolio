import { NextResponse, type NextRequest } from 'next/server';

import { DEFAULT_LOCALE, LOCALES, isSupportedLocale, type SupportedLocale } from '@/lib/i18n';

/**
 * Redirige `/` (y cualquier ruta sin prefijo de idioma) al locale por defecto.
 *
 * Por qué proxy (antes middleware) y no un `app/page.tsx` con `redirect()`: el layout raíz es
 * `app/[lang]/layout.tsx` — es el único que puede poner el `lang` correcto en `<html>`,
 * que es un requisito de accesibilidad, no un detalle. Con esa estructura no existe
 * una página en la raíz donde poner el redirect.
 *
 * El idioma se negocia por `Accept-Language` (`es` por defecto), y la respuesta lleva
 * `Vary: Accept-Language` para que una cache no le sirva a todos el redirect del primero.
 * Solo decide el destino de un link sin idioma: un link con `/es` o `/en` se respeta.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  const locale = preferredLocale(request.headers.get('accept-language'));
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;

  const response = NextResponse.redirect(url);
  response.headers.set('Vary', 'Accept-Language');
  return response;
}

/**
 * El primer idioma soportado según el orden de preferencia (`q`) del header.
 * `en-US;q=0.8` cuenta como `en`. Sin header o sin coincidencias, el default.
 *
 * ponytail: parser mínimo de `Accept-Language`; si algún día hay variantes regionales
 * (`es-AR` distinto de `es-ES`), usar `Intl.LocaleMatcher` o `@formatjs/intl-localematcher`.
 */
function preferredLocale(header: string | null): SupportedLocale {
  const ranked = (header ?? '')
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => /^\s*q=([\d.]+)/.exec(p)?.[1]).find(Boolean);
      return { lang: tag.trim().slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q);

  return ranked.map((entry) => entry.lang).find(isSupportedLocale) ?? DEFAULT_LOCALE;
}

export const config = {
  // Excluye assets y rutas internas: el middleware solo debe ver navegación de páginas.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
