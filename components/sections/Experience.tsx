import type { Profile } from '@/types/profile';

export function Experience({
  currentBadge,
  items,
}: {
  currentBadge: string;
  items: Profile['experience'];
}) {
  return (
    <ol className="space-y-16">
      {items.map((job) => (
        <li key={`${job.company}-${job.period}`}>
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{job.period}</p>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="h3">{job.role}</h3>
            {job.current && (
              <span className="rounded-md bg-accent-bg px-2 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-accent">
                {currentBadge}
              </span>
            )}
          </div>

          <p className="small mt-1">
            {job.company} · {job.location}
          </p>

          {job.context && <p className="measure mt-4 text-pretty text-quiet">{job.context}</p>}

          <ul className="mt-6 space-y-3">
            {job.achievements.map((achievement) => (
              <li key={achievement.slice(0, 40)} className="measure flex gap-4 text-pretty">
                <span aria-hidden="true" className="mt-3.5 h-px w-4 shrink-0 bg-accent-dim" />
                <span>{achievement}</span>
              </li>
            ))}
          </ul>

          <ul className="mt-7 flex flex-wrap gap-2">
            {job.stack.map((tech) => (
              <li
                key={tech}
                className="rounded-md border border-line px-2.5 py-1 font-mono text-xs text-muted"
              >
                {tech}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
