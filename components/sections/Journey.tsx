import type { Profile } from '@/types/profile';

/** Línea de tiempo personal. El hito activo —el último— en acento; los demás, apagados. */
export function Journey({ timeline }: { timeline: Profile['about']['timeline'] }) {
  return (
    <ol className="relative border-l border-line pl-8">
      {timeline.map((milestone, index) => (
        <li key={milestone.title} className="relative pb-10 last:pb-0">
          <span
            aria-hidden="true"
            className={`absolute -left-[calc(2rem+4px)] top-2.5 h-2 w-2 rounded-full ${
              index === timeline.length - 1 ? 'bg-accent' : 'bg-line-strong'
            }`}
          />
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{milestone.at}</p>
          <h3 className="mt-1 text-heading">{milestone.title}</h3>
          <p className="measure mt-2 text-pretty">{milestone.body}</p>
        </li>
      ))}
    </ol>
  );
}
