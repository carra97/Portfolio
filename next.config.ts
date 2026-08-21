import type { NextConfig } from 'next';

/**
 * Content-Security-Policy.
 *
 * **Limitación declarada, no disimulada:** `script-src` incluye `'unsafe-inline'`.
 * Next.js emite scripts inline por página (el payload de React Server Components) y el
 * sitio suma uno propio —el que aplica el tema antes del primer paint—, así que una
 * política por hash habría que recalcularla en cada build y por página. La alternativa
 * correcta es un nonce por request generado en el proxy, pero eso vuelve dinámicas
 * todas las páginas y este sitio se prerenderiza entero: se pagaría el costo de un
 * servidor por request a cambio de mitigar XSS en un sitio sin entrada de usuario ni
 * contenido de terceros.
 *
 * Lo que la política sí garantiza, que es donde está el valor real acá: **ningún
 * origen externo puede cargar nada**. Ni un script, ni una fuente, ni una imagen, ni
 * una conexión. Si alguna vez se cuela un `<script src>` ajeno —una dependencia
 * comprometida, un snippet de analítica pegado sin pensar—, el navegador lo bloquea.
 *
 * Cuando exista el endpoint del chatbot hay que revisar `connect-src`; hoy es `'self'`
 * porque el sitio no habla con nadie más.
 */
/**
 * `'unsafe-eval'` SOLO en desarrollo.
 *
 * React en modo desarrollo usa `eval()` para reconstruir stack traces entre entornos, y
 * Turbopack lo usa para el módulo hot-reload. Sin la directiva, `next dev` se rompe con
 * "eval() is not supported in this environment" — que es la CSP funcionando, no un bug.
 *
 * `process.env.NODE_ENV` lo fija Next: `development` en `next dev`, `production` en
 * `next build`. La política que llega a producción no permite `eval` bajo ninguna
 * circunstancia; la relajación no puede filtrarse al build por olvido, porque no depende
 * de una variable que alguien tenga que acordarse de setear.
 */
const isDevelopment = process.env.NODE_ENV === 'development';

const scriptSrc = isDevelopment
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

/**
 * En desarrollo se agrega `ws:` para el websocket de hot-reload de Turbopack. CSP3
 * define que `'self'` cubre el mismo origen sobre `ws://`, pero el soporte de esa regla
 * varía entre navegadores y un HMR que no conecta se diagnostica mal (parece que el dev
 * server se colgó). En producción `connect-src` queda en `'self'` y nada más.
 */
const connectSrc = isDevelopment ? "connect-src 'self' ws:" : "connect-src 'self'";

const CSP = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  connectSrc,
  // Duplica X-Frame-Options con la directiva moderna: no se puede embeber el sitio.
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Impide que un `<base>` inyectado reescriba todos los enlaces relativos.
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El sitio estático no necesita el optimizador de imágenes de Vercel: las tres fotos
  // son fijas y se sirven ya dimensionadas. Evitarlo mantiene el costo en cero.
  images: { unoptimized: true },

  /**
   * Las URLs de case study eran `/es/proyectos/[slug]` y pasaron a `/es/projects/[slug]`
   * al unificar los segmentos en inglés. El sitio ya está publicado, así que esas URLs
   * pueden estar indexadas o compartidas: sin este redirect permanente serían un 404 y
   * se perdería la señal de SEO acumulada. Se puede quitar cuando los logs muestren
   * que nadie las pide (no antes de unos meses).
   */
  async redirects() {
    return [
      {
        source: '/:lang/proyectos/:slug',
        destination: '/:lang/projects/:slug',
        permanent: true,
      },
      {
        source: '/:lang/proyectos',
        destination: '/:lang/projects',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          {
            // Dos años, subdominios incluidos. Sin `preload`: ese token es un
            // compromiso que se envía a una lista externa y del que cuesta salir;
            // se agrega cuando el dominio esté estable y con HTTPS en todo subdominio.
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
