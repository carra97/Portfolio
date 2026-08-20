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
este repo) y se materializa en `content/profile.<lang>.json`, validado contra
`types/profile.ts` en tiempo de compilación.

**Por qué:** el contenido cambia pocas veces por año y siempre lo edita una sola persona.
Un CMS agrega un servicio, un costo y un modo de falla en runtime para resolver un
problema que acá no existe. MDX daría más libertad de la que quiero: el objetivo es
justamente que el contenido no pueda decir nada que el dossier no diga.

**Trade-off:** editar contenido requiere un commit. Es aceptable —y hasta deseable— porque
deja cada cambio de una afirmación pública en el historial de Git.

**Cómo se hace cumplir:** `content.ts` usa `satisfies Record<SupportedLocale, Profile>`.
Un JSON que se desvía del esquema rompe el build, no la página.

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

### 9. Todo Server Components, cero JavaScript de cliente en el sitio estático

No hay un solo `'use client'` en el sitio. Cuando llegue el chat, será el único componente
cliente, con su estado local — sin store global ni rerenders del sitio entero.

**Por qué:** un portfolio es contenido. El JS que no se envía es el que no puede fallar,
no hay que hidratar y no cuesta batería en un teléfono.

### 10. Imágenes sin optimizador

`images: { unoptimized: true }`. Las tres fotos son fijas, se sirven ya dimensionadas y
recomprimidas, y todas llevan `width`/`height` explícitos para reservar el espacio y evitar
layout shift. El optimizador de Vercel resolvería un problema que no tengo, a cambio de
costo por transformación.

### 11. CSP todavía no

`next.config.ts` define `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` y
`Permissions-Policy`. **No define Content-Security-Policy**, y es deliberado: escribirla
ahora, sin conocer los orígenes reales que va a necesitar el endpoint de chat, llevaría a
una política laxa que después nadie ajusta. Se agrega junto con el chat, con los orígenes
que efectivamente se usen.

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
