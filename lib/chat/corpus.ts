import 'server-only';

import { getCaseStudies } from '@/lib/content/case-studies';
import { getProfile } from '@/lib/content/profile';
import { env, whatsappDigits } from '@/lib/env';
import type { SupportedLocale } from '@/lib/i18n';

/**
 * Corpus del chatbot.
 *
 * ## La decisión de fondo: el corpus se DERIVA del sitio, no se escribe aparte
 *
 * La alternativa obvia era un `contenido/corpus-bot.md` mantenido a mano. Se descartó
 * por una razón que ya vimos fallar dos veces en este proyecto: **dos copias de la misma
 * verdad se desincronizan**, y cuando se desincronizan nadie se entera hasta que alguien
 * lee las dos. Un corpus a mano habría producido exactamente eso — un bot afirmando
 * "6 áreas" tres semanas después de que el sitio pasara a "más de 10".
 *
 * Derivarlo del contenido publicado da tres garantías estructurales, no de disciplina:
 *
 * 1. **No puede desincronizarse.** Es la misma fuente que renderiza las páginas.
 * 2. **No puede afirmar nada que el sitio no publique.** Si un dato no pasó el filtro
 *    para estar en el sitio, tampoco está acá. La lista negra de privacidad se cumple
 *    por construcción y no por una regla en el prompt que el modelo podría ignorar.
 * 3. **Cambiar contenido actualiza el bot.** Sin un segundo paso que alguien olvide.
 *
 * El precio: el bot no sabe nada que no esté publicado. Es exactamente lo que se quiere.
 *
 * ## Por qué no hay RAG
 *
 * El corpus completo entra holgadamente en la ventana de contexto — ver `estimateTokens`
 * y el chequeo de `npm run content:check`. Un retrieval agregaría un índice, un modelo de
 * embeddings, un pipeline de ingesta y un modo de falla nuevo (recuperar el fragmento
 * equivocado) a cambio de nada. RAG se justifica cuando el corpus **no** entra; este no
 * es el caso, y la decisión se sostiene hasta que deje de serlo.
 */

/** Se arma una vez por locale y proceso: es determinístico y no depende del request. */
const cache = new Map<SupportedLocale, string>();

export function buildCorpus(lang: SupportedLocale): string {
  const cached = cache.get(lang);
  if (cached !== undefined) return cached;

  const corpus = serialize(lang);
  cache.set(lang, corpus);
  return corpus;
}

/**
 * Estimación de tokens, deliberadamente cruda: ~4 caracteres por token para castellano.
 * No pretende ser exacta — sirve para responder una sola pregunta, que es si el corpus
 * sigue entrando en la ventana o si llegó el momento de revisar la decisión de no usar
 * retrieval. Para eso, un orden de magnitud alcanza.
 */
export function estimateTokens(corpus: string): number {
  return Math.ceil(corpus.length / 4);
}

function serialize(lang: SupportedLocale): string {
  const profile = getProfile(lang);
  const caseStudies = getCaseStudies(lang);
  const out: string[] = [];

  const section = (title: string) => out.push(`\n## ${title}\n`);
  const line = (text: string) => out.push(text);

  out.push('# Perfil profesional de Santiago Nicolás Carrattini');
  out.push('');
  out.push(
    'Este es el único material sobre el que se puede responder. Todo lo que sigue está publicado en el sitio.',
  );

  section('Identidad y posicionamiento');
  line(`- Nombre: ${profile.hero.name}`);
  line(`- Titular: ${profile.hero.headline}`);
  line(`- Ubicación: ${profile.hero.location}`);
  line(`- Resumen: ${profile.hero.tagline}`);
  line(`- Disponibilidad: ${profile.hero.availability}`);
  for (const fact of profile.hero.quickFacts) line(`- ${fact.label}: ${fact.value}`);

  section('Contacto');
  if (env.CONTACT_EMAIL) line(`- Email: ${env.CONTACT_EMAIL}`);
  if (whatsappDigits) line(`- WhatsApp: https://wa.me/${whatsappDigits}`);
  line('- LinkedIn: https://www.linkedin.com/in/santiago-nicolas-carrattini');
  line('- GitHub: https://github.com/carra97');

  section('Experiencia');
  for (const job of profile.experience) {
    line(`### ${job.role} — ${job.company} (${job.period}${job.current ? ', actual' : ''})`);
    line(`Ubicación: ${job.location}`);
    if (job.context) line(job.context);
    for (const achievement of job.achievements) line(`- ${achievement}`);
    line(`Stack: ${job.stack.join(', ')}`);
    line('');
  }

  section('Proyectos');
  for (const project of profile.projects) {
    line(`### ${project.name} (${project.period})`);
    line(project.description);
    if (project.result) line(project.result);
    line(`Tecnologías: ${project.tech.join(', ')}`);
    line(`Estado: ${describeStatus(project.status)}`);
    if (project.press) {
      line(
        `Prensa: ${project.press.outlet}, ${project.press.date}. Cita textual sobre Santiago: "${project.press.quote}". ${project.press.url}`,
      );
    }
    line('');
  }

  section('Case studies');
  for (const study of caseStudies) {
    line(`### ${study.title}`);
    line(study.summary);
    line(`Contexto: ${study.context}`);
    line('Problema:');
    for (const item of study.problem) line(`- ${item}`);
    line('Restricciones:');
    for (const item of study.constraints) line(`- ${item}`);
    line('Decisiones técnicas:');
    for (const decision of study.decisions) {
      line(`- ${decision.title}. Razón: ${decision.rationale} Trade-off: ${decision.tradeoff}`);
    }
    line(`Arquitectura: ${study.architecture}`);
    line('Resultado:');
    for (const item of study.outcome) line(`- ${item}`);
    line('Qué haría distinto hoy:');
    for (const item of study.retrospective) line(`- ${item}`);
    if (study.metrics) {
      line('Métricas:');
      for (const metric of study.metrics) {
        line(`- ${metric.label}: ${metric.value}${metric.note ? ` (${metric.note})` : ''}`);
      }
    }
    line('');
  }

  section('Stack técnico');
  for (const group of profile.skills) {
    line(`- ${group.label}: ${group.items.join(', ')}${group.note ? ` — ${group.note}` : ''}`);
  }

  section('Formación');
  for (const item of profile.education) {
    line(`- ${item.title}, ${item.institution}${item.year ? ` (${item.year})` : ''}${item.note ? ` — ${item.note}` : ''}`);
  }

  section('Certificaciones');
  for (const group of profile.certifications) {
    if (group.framing) line(group.framing);
    for (const item of group.items) {
      line(`- ${item.name} — ${group.issuer}${item.year ? `, ${item.year}` : ''}${item.verifyUrl ? ` (verificable: ${item.verifyUrl})` : ''}`);
    }
  }

  section('Idiomas');
  for (const language of profile.languages) line(`- ${language.name}: ${language.level}`);

  section('Recomendaciones recibidas');
  for (const testimonial of profile.testimonials) {
    const relation =
      testimonial.relation === 'reported-to-santiago'
        ? 'le reportaba a Santiago'
        : 'fue líder de Santiago';
    line(`- ${testimonial.author} (${testimonial.role}, ${relation}): "${testimonial.quote}"`);
  }

  section('Trayectoria personal');
  for (const paragraph of profile.about.narrative) line(paragraph);
  line(`Principio que lo ordena: "${profile.about.principle}"`);
  for (const item of profile.about.principleSupport) line(`- ${item}`);
  for (const milestone of profile.about.timeline) {
    line(`- ${milestone.at} · ${milestone.title}: ${milestone.body}`);
  }

  section('Fuera del editor');
  for (const hobby of profile.hobbies) line(`- ${hobby.name}: ${hobby.detail}`);

  return out.join('\n');
}

function describeStatus(status: string): string {
  switch (status) {
    case 'archived':
      return 'proyecto cerrado, sin repositorio ni demo pública';
    case 'internal':
      return 'sistema interno del organismo, sin repositorio ni demo pública';
    case 'verifiable':
      return 'verificable con evidencia pública de terceros';
    default:
      return 'con URL pública';
  }
}
