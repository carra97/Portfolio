# Portfolio — Santiago Carrattini

Sitio personal y, más adelante, un chatbot que responde sobre mi perfil profesional.
El repositorio es parte del portfolio: está escrito como código de producción y este
README funciona además como registro público de decisiones (ADR). Cada decisión que
sigue tiene el porqué, no solo el qué.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Zod · Vercel.
Sin base de datos, sin CMS, sin librería de estado.

---

## Decisiones

### 1. Contenido en JSON tipado, no en un CMS ni en MDX

El contenido del sitio sale de un dossier único (`contenido/perfil-publico.md`, fuera de
este repo) y se materializa en `content/profile.<lang>.json`, validado contra el esquema
Zod de `lib/content/schema.ts` en tiempo de compilación.

**Por qué:** el contenido cambia pocas veces por año y siempre lo edita una sola persona.
Un CMS agrega un servicio, un costo y un modo de falla en runtime para resolver un
problema que acá no existe. MDX daría más libertad de la que quiero: el objetivo es
justamente que el contenido no pueda decir nada que el dossier no diga.

**Trade-off:** editar contenido requiere un commit. Es aceptable —y hasta deseable— porque
deja cada cambio de una afirmación pública en el historial de Git.

**Cómo se hace cumplir:** el esquema Zod es la fuente única y los tipos se derivan con
`z.infer`. Antes había dos declaraciones —las interfaces de `types/` y el JSON— unidas por
un `as unknown as Profile`: un doble cast no valida nada, le dice al compilador "confiá en
mí" sobre un archivo que se edita a mano. Hoy el JSON se parsea al importar el módulo, o
sea en build, y una violación rompe `npm run build` indicando el campo exacto. Costo en
runtime: cero, porque todas las páginas se prerenderizan.

`createContentLoader` (`lib/content/loader.ts`) es una factory genérica sobre el esquema:
perfil, case studies y —cuando exista— el corpus del chatbot comparten parseo, cacheo y
mensaje de error sin repetir una línea ni castear.

### 2. Union types en lugar de strings sueltos donde una regla depende del valor

`ProjectStatus`, `TestimonialRelation`, `SkillCategory` y `Lang` son uniones cerradas.

**Por qué:** cada uno gobierna una decisión de render. `ProjectStatus: 'archived'` implica
que el proyecto **no se enlaza** — es una regla explícita del dossier, y codificarla en el
tipo hace que la haga cumplir el compilador y no la memoria de quien edita el JSON.
`TestimonialRelation` garantiza que toda recomendación declare la relación de quien la
escribió: que dos personas a las que lideré avalen mi liderazgo dice algo que una
recomendación de un par no dice, y esa etiqueta es la mitad del valor del testimonio.

En cambio, `stack` y `tech` quedan como `string[]`: son listas abiertas, cambian seguido y
no gobiernan ninguna decisión de render. Cerrarlas sería burocracia sin beneficio.

### 3. Sin RAG en el chatbot — a propósito

El corpus completo del perfil entra holgadamente en la ventana de contexto del modelo.

**Por qué no:** un retrieval agregaría un índice, un modelo de embeddings, un pipeline de
ingesta y un modo de falla nuevo —recuperar el chunk equivocado— a cambio de nada. La
regla es que RAG se justifica cuando el corpus **no** entra en la ventana. Este no es el caso.

**Cuándo cambiaría:** si el corpus creciera más allá de lo que conviene enviar en cada
llamada, o si el costo por request lo volviera relevante. Ninguna de las dos condiciones
se cumple hoy, y sostengo la decisión hasta que se cumpla alguna.

### 4. Proveedor de LLM detrás de una interfaz

`LLM_PROVIDER` selecciona la implementación; el resto del código no sabe cuál está activa.
Default: `anthropic`.

**Por qué:** el proveedor es la dependencia con más probabilidad de cambiar —por precio,
por disponibilidad o por calidad— y es la más fácil de aislar. La fachada cuesta una
interfaz y un registry; migrar sin ella cuesta tocar el endpoint entero. Es el único punto
donde acepto indirección por adelantado, y lo acepto porque el eje de cambio está
identificado, no supuesto.

### 5. El sitio tiene que funcionar con el chatbot caído

El chat es un agregado, no la estructura. `chatEnabled` exige tres condiciones a la vez:
kill switch encendido, clave del proveedor presente y backend de rate limit configurado.
Si falta cualquiera, el chat no se habilita y el sitio se sirve completo.

**Por qué el rate limit es condición de arranque y no una mejora:** un endpoint de LLM
sin límite de gasto es una factura abierta a cualquiera que descubra la URL. Es preferible
un portfolio sin chat que un chat que se pueda usar como cómputo gratuito.

### 6. Validación de entorno con Zod, fallando en build

`lib/env.ts` resuelve dos requisitos que se contradicen:

1. El repo es público y tiene que compilar recién clonado, sin ninguna credencial.
2. Un valor presente pero malformado no puede llegar a producción como un `href` roto.

La solución es que **nada sea obligatorio pero todo valide su forma cuando está presente**.
Ausencia = degradación prevista; presencia inválida = build roto.

La consecuencia visible es deliberada: sin `CONTACT_PHONE_E164`, el botón de WhatsApp
simplemente no se renderiza. Nunca se emite un `wa.me/` o un `mailto:` vacío, que es peor
que no tener botón porque parece funcionar.

`lib/env.ts` importa `server-only`: usarlo desde un Client Component es un error de
compilación, no una fuga de credenciales al bundle.

### 7. Datos de contacto por variables de entorno

Email y teléfono se leen del entorno y se resuelven en Server Components.

**Por qué:** mantiene los datos personales fuera del historial de Git, que es permanente y
público. **No los oculta del sitio:** quedan visibles en el HTML renderizado, que es
exactamente lo que se busca — son un CTA.

El teléfono queda **fuera del JSON-LD** a propósito: los datos estructurados son el primer
lugar que raspan los agregadores y no aportan nada al SEO de un portfolio personal.

### 8. Routing `[lang]` desde el día uno, con un solo idioma publicado

`LOCALES` contiene hoy solo `es`. El segmento `[lang]` y `generateStaticParams` ya están.

**Por qué:** publicar un `/en` traducido a medias es peor que no tenerlo, pero agregar el
segmento después implicaría cambiar todas las URLs de un sitio ya indexado. El costo de
tener la estructura desde el principio es cero; el de agregarla después, no. Sumar inglés
es agregar un JSON y un elemento al array.

El layout raíz vive en `app/[lang]/layout.tsx` porque es el único lugar donde se puede
poner el `lang` correcto en `<html>` — que es un requisito de accesibilidad, no un detalle.
Por eso la redirección desde `/` se hace en `proxy.ts` y no en una página raíz que no existe.

### 9. Server Components por defecto; dos componentes cliente, con motivo

`'use client'` aparece exactamente dos veces: el toggle de tema y los controles del
carrusel. Ninguno de los dos renderiza contenido —ambos operan sobre markup que ya vino
del servidor—, así que el sitio se lee entero con JavaScript deshabilitado.

**Por qué:** un portfolio es contenido. El JS que no se envía es el que no puede fallar, no
hay que hidratar y no cuesta batería en un teléfono. Cuando llegue el chat será el tercero,
con su estado local — sin store global ni rerenders del sitio entero.

### 10. Imágenes sin optimizador

`images: { unoptimized: true }`. Las tres fotos son fijas, se sirven ya dimensionadas y
recomprimidas, todas llevan `width`/`height` explícitos para reservar el espacio y evitar
layout shift, y las que están bajo el pliegue van con `loading="lazy"` (Next no lo agrega
solo en un `<img>` nativo). El optimizador de Vercel resolvería un problema que no tengo, a cambio de
costo por transformación.

### 11. CSP con `'unsafe-inline'` en `script-src`, declarado y no disimulado

`next.config.ts` define CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options` y `Permissions-Policy`.

La política **permite scripts inline**. Next.js emite uno por página (el payload de React
Server Components) y el sitio suma el suyo —el que aplica el tema antes del primer paint,
para que quien eligió modo claro no vea un flash oscuro—, así que una política por hash
habría que recalcularla por página y por build. La alternativa correcta, un nonce por
request generado en el proxy, vuelve dinámicas todas las páginas: se pagaría un servidor
por request para mitigar XSS en un sitio sin entrada de usuario ni contenido de terceros.

En desarrollo la política agrega `'unsafe-eval'` y `ws:`: React en modo dev usa `eval()`
para reconstruir stack traces y Turbopack necesita el websocket de hot-reload. La distinción
la hace `process.env.NODE_ENV`, que fija Next — no una variable que alguien tenga que
acordarse de setear, así que la relajación no puede filtrarse a producción por olvido.

Lo que la política **sí** garantiza es donde está el valor real acá: ningún origen externo
puede cargar nada —script, fuente, imagen o conexión—. Si alguna vez se cuela un
`<script src>` ajeno, el navegador lo bloquea. `connect-src` se revisa cuando exista el
endpoint del chatbot.

### 12. Rutas reales, no una página larga con anclas

El sitio son cinco rutas —`/es`, `/es/experience`, `/es/projects`, `/es/about-me`,
`/es/contact`— más una por case study. Antes era una sola página con ocho secciones
enlazadas por `#experiencia`.

**Por qué:** un fragmento no es una URL. `/es#experiencia` es el mismo documento que `/es`:
no se indexa aparte, no aparece en resultados y no se comparte diciendo "mirá esto". Además
el HTML incluía las ocho secciones aunque el visitante leyera una, y ocho secciones
seguidas se leen como un volcado. La landing pasó de ~2.100 a ~630 palabras.

**Trade-off:** ver todo el perfil ahora requiere navegar. Se compensa con la ficha "De un
vistazo" en el hero —rol, seniority, especialidad, equipo, modalidad e idiomas sin scroll—
y con un enlace al final de cada bloque de la landing hacia su página completa.

### 13. Registro de páginas y registro de secciones

`lib/pages/registry.ts` declara qué páginas existen, su segmento de URL y **qué secciones
muestra cada una, en qué orden**. `lib/sections/registry.tsx` declara cómo se renderiza
cada sección. Nav, sitemap, `canonical`, numeración de eyebrows y composición de cada
página salen de ahí.

**Por qué:** el orden, los ids, la numeración "01".."08" y las etiquetas del nav vivían en
tres lugares a la vez —el JSX de la página, el array `nav` del JSON y el record
`sections`—. Mover una sección eran tres ediciones coordinadas, y ninguna desincronización
rompe el build: el síntoma era un link apuntando a algo que ya no existía. Hoy agregar una
sección es una entrada en un array.

**Por qué registro y no factory:** una factory sirve para elegir una implementación entre
varias intercambiables —el proveedor de LLM, o el cargador de contenido genérico—. Acá se
enumera un conjunto fijo conocido en compilación; una factory sería indirección que no
absorbe ninguna variabilidad.

**Limitación honesta:** el App Router deriva la ruta del nombre de carpeta, así que el
registro no *crea* la URL, la *nombra*. Lo que garantiza es que renombrar un segmento sea
una línea y una carpeta, en vez de una cacería por seis archivos.

### 14. Carrusel de recomendaciones sobre scroll-snap nativo

En mobile las tres recomendaciones eran tres tarjetas apiladas en la sección que más pesa
como prueba social. Ahora es un carrusel horizontal; en ≥768px vuelve a ser grilla de tres,
porque ahí el ancho sobra y esconder contenido sería una pérdida neta.

**Cómo:** el carrusel no renderiza el contenido. Los ítems llegan como `children` ya
renderizados en el servidor y el componente cliente solo los envuelve. Las tres
recomendaciones están completas en el HTML inicial: Google las indexa y un lector de
pantalla las lee las tres sin tocar un control. Sin JavaScript sigue funcionando —
`overflow-x` + `scroll-snap` son CSS y el swipe es nativo—; los controles son una mejora
encima, no el mecanismo.

**Alternativa descartada:** Embla o Swiper, 10-35 KB para mover tres tarjetas. Lo que dan
de más —loop, autoplay, drag con inercia— es justamente lo que no queremos.

**Contrapartida asumida:** lo que está fuera de vista se lee menos. Por eso los controles
declaran posición ("Recomendación 2 de 3"), los puntos tienen área táctil de 24px (WCAG
2.2 · 2.5.8) y la relación de quien recomienda se muestra siempre.

### 15. Redirects permanentes de las URLs viejas

`/:lang/proyectos/:slug` → `/:lang/projects/:slug`, 308. El sitio ya estaba publicado
cuando se unificaron los segmentos en inglés, así que esas URLs pueden estar indexadas o
compartidas. Sin el redirect serían un 404 y se perdería la señal de SEO acumulada.

---

## Estructura

```
app/[lang]/            una carpeta por ruta pública; el segmento lo nombra lib/pages/registry
app/sitemap.ts         generado desde el registro de rutas y el contenido
components/layout/     armazón: Nav, PageShell, PageHeader, Section, Footer, ThemeToggle
components/sections/   una sección de contenido cada uno; no saben en qué página viven
components/ui/         primitivas sin contenido propio (Carousel)
content/               el contenido, en JSON, una vez por idioma
lib/content/           esquema Zod, factory de cargadores, cargadores concretos
lib/pages/             registro de páginas, navegación y metadata
lib/sections/          registro de secciones
types/                 re-export de los tipos derivados del esquema; no se declara nada acá
```

Agregar una sección: un componente en `components/sections/`, una entrada en
`lib/sections/registry.tsx` y su id en la página que la muestre.
Agregar una página: una entrada en `lib/pages/registry.ts`, la carpeta bajo `app/[lang]/`
y su metadata en `content/profile.<lang>.json`.

---

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar los valores locales
npm run dev
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | `tsc --noEmit` |

## Deploy

Vercel, **Root Directory `.`** — el repositorio Git es este directorio `web/`. La raíz del
proyecto local (dossier, plan, prompts) queda fuera del repo a propósito: es material de
trabajo, no producto.

Variables a configurar en Vercel: las de `.env.example`. Ninguna es obligatoria para que el
build pase; su ausencia degrada funcionalidad de forma prevista.

## Licencia

MIT — ver `LICENSE`. El código es reutilizable; el contenido del perfil, no.
