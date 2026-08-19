import { Link } from 'react-router-dom';
import type { Job, JobStatus } from '../types/job';
import Icon from './Icon';

const TYPE_LABEL: Record<string, string> = {
  IMPORT: 'Importación',
  DEDUP: 'Deduplicación',
  EXPORT: 'Exportación',
};

const TYPE_ICON: Record<string, string> = {
  IMPORT: 'upload',
  DEDUP: 'content_copy',
  EXPORT: 'download',
};

const STATUS_STYLE: Record<JobStatus, string> = {
  PENDING: 'border-tertiary-container/30 bg-tertiary-container/10 text-tertiary-container',
  RUNNING: 'border-primary/30 bg-primary/10 text-primary',
  DONE: 'border-secondary-container/30 bg-secondary-container/10 text-secondary-container',
  FAILED: 'border-error/30 bg-error/10 text-error',
};

const STATUS_DOT: Record<JobStatus, string> = {
  PENDING: 'bg-tertiary-container',
  RUNNING: 'bg-primary animate-pulse-slow',
  DONE: 'bg-secondary-container',
  FAILED: 'bg-error',
};

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const isDedup = job.type === 'DEDUP';
  const pct =
    job.totalRows > 0
      ? Math.round((job.processedRows / job.totalRows) * 100)
      : job.status === 'DONE'
        ? 100
        : 0;
  const fillColor =
    job.status === 'DONE' ? 'bg-secondary-container' : job.status === 'FAILED' ? 'bg-error' : 'bg-primary';

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="flex items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-low p-3 transition-colors hover:border-surface-bright hover:bg-surface-container-high"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface-container-highest text-primary">
        <Icon name={TYPE_ICON[job.type] ?? 'terminal'} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-body-md font-body-md font-medium text-on-surface">
          Trabajo de {TYPE_LABEL[job.type] ?? job.type}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-label-caps font-label-caps text-on-surface-variant">
          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
          {job.totalRows > 0 ? (
            <span>
              {job.processedRows.toLocaleString()} / {job.totalRows.toLocaleString()} filas
            </span>
          ) : (
            isDedup &&
            job.processedRows > 0 && (
              <span>{job.processedRows.toLocaleString()} duplicados encontrados</span>
            )
          )}
        </div>
      </div>
      <div className="hidden w-32 shrink-0 sm:block">
        <div className="mb-1 text-right text-code-md font-code-md text-on-surface-variant">
          {pct}%
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
          <div className={`h-full ${fillColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div
        className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-2 py-0.5 ${STATUS_STYLE[job.status]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[job.status]}`} />
        <span className="text-[11px] font-semibold uppercase tracking-wider">{job.status}</span>
      </div>
    </Link>
  );
}
