import type { ReactNode } from 'react';

import type { Profile } from '@/types/profile';

type Job = Profile['experience'][number];

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
          <JobRow achievements={job.achievements} currentBadge={currentBadge} job={job}>
            <ul className="mt-7 flex flex-wrap gap-2">
              {job.stack.map((tech) => (
                <li key={tech} className="tag">
                  {tech}
                </li>
              ))}
            </ul>
          </JobRow>
        </li>
      ))}
    </ol>
  );
}

/**
 * Un puesto, como fila de expediente: período, estado, empresa y modalidad al margen;
 * el rol y lo hecho en la columna de lectura.
 *
 * Lo comparten `/experience` y el "Rol actual" del home. Antes eran dos copias del
 * mismo markup, y la primera vez que una cambiaba la otra quedaba vieja.
 */
export function JobRow({
  achievements,
  children,
  currentBadge,
  job,
}: {
  /** Los logros a mostrar: todos en `/experience`, los más fuertes en el home. */
  achievements: readonly string[];
  children?: ReactNode;
  currentBadge: string;
  job: Job;
}) {
  return (
    <div className="doc-row">
      <div className="space-y-1 md:pt-1">
        <p className="data">{job.period}</p>
        {job.current && <p className="badge badge-current">{currentBadge}</p>}
        <p className="label">
          {job.company}
          <br className="max-md:hidden" />
          <span className="md:hidden"> · </span>
          {job.location}
        </p>
      </div>

      <div>
        <h3 className="h3">{job.role}</h3>

        {job.context && <p className="measure mt-3 text-pretty text-quiet">{job.context}</p>}

        <ul className="mt-6 space-y-3">
          {achievements.map((achievement) => (
            <li key={achievement.slice(0, 40)} className="measure flex gap-4 text-pretty">
              <span aria-hidden="true" className="mt-3.5 h-px w-4 shrink-0 bg-line-strong" />
              <span>{achievement}</span>
            </li>
          ))}
        </ul>

        {children}
      </div>
    </div>
  );
}
