import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El sitio estático no necesita el optimizador de imágenes de Vercel: las tres
  // fotos son fijas y se sirven ya dimensionadas. Evitarlo mantiene el costo en cero.
  images: { unoptimized: true },
  // Cabeceras de seguridad. CSP se agrega cuando exista el endpoint de chat: definirla
  // ahora sin conocer los orígenes reales llevaría a una política laxa de por vida.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
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
