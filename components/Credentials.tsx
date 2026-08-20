import type { Profile } from '@/types/profile';

/**
 * Certificaciones agrupadas por emisor, no en grilla de badges (DISENO.md §7.4).
 *
 * El razonamiento importa: nueve certificados de Anthropic en trece tarjetas iguales
 * leen como colección de badges y sugieren relleno. Agrupados, con una línea que enmarque
 * el bloque como una ruta de formación —fundamentos, plataforma, MCP, subagentes,
 * Bedrock—, los nueve dejan de ser cantidad y pasan a ser intención.
 *
 * Sin logos de terceros y sin íconos de check: en esta paleta un logo a color rompe el
 * conjunto, y en un repo público son marcas ajenas. El nombre en texto alcanza.
 */
export function Credentials({
  certifications,
  education,
  languages,
}: {
  certifications: Profile['certifications'];
  education: Profile['education'];
  languages: Profile['languages'];
}) {
  return (
    <div className="space-y-14">
      <ul className="space-y-5">
        {education.map((item) => (
          <li key={item.title} className="grid gap-1 md:grid-cols-[200px_1fr] md:gap-8">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted md:pt-1">
              {item.year ?? '—'}
            </p>
            <div>
              <p className="text-heading">{item.title}</p>
              <p className="small">
                {item.institution}
                {item.note ? ` · ${item.note}` : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="space-y-8 border-t border-line pt-10">
        {certifications.map((group) => (
          <div key={group.issuer} className="grid gap-2 md:grid-cols-[200px_1fr] md:gap-8">
            <dt className="font-mono text-xs uppercase tracking-[0.12em] text-muted md:pt-1">
              {group.issuer}
              {group.year ? ` · ${group.year}` : ''}
            </dt>
            <dd>
              {group.framing && <p className="measure text-pretty text-quiet">{group.framing}</p>}
              <ul className={group.framing ? 'mt-3 space-y-1' : 'space-y-1'}>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>

      <ul className="flex flex-wrap gap-x-10 gap-y-2 border-t border-line pt-10">
        {languages.map((language) => (
          <li key={language.name}>
            <span className="text-heading">{language.name}</span>
            <span className="small"> — {language.level}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
