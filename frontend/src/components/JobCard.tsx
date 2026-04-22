import { Link } from 'react-router-dom';
import type { Job } from '../types/job';
import '../styles/dashboard.css';

const TYPE_LABEL: Record<string, string> = {
  IMPORT: 'Importación',
  DEDUP: 'Deduplicación',
  EXPORT: 'Exportación',
};

const TYPE_ICON: Record<string, string> = {
  IMPORT: '📥',
  DEDUP: '🔍',
  EXPORT: '📤',
};

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const pct = job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0;

  const fillClass = job.status === 'DONE' ? 'done' : job.status === 'FAILED' ? 'failed' : '';

  return (
    <Link to={`/jobs/${job.id}`} className="job-card">
      <div className={`job-card-icon ${job.type.toLowerCase()}`}>{TYPE_ICON[job.type] ?? '⚙️'}</div>
      <div className="job-card-body">
        <div className="job-card-title">Trabajo de {TYPE_LABEL[job.type] ?? job.type}</div>
        <div className="job-card-meta">
          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
          {job.totalRows > 0 && (
            <span>
              {job.processedRows.toLocaleString()} / {job.totalRows.toLocaleString()} rows
            </span>
          )}
        </div>
      </div>
      <div className="job-card-progress">
        <div className="job-card-pct">{pct}%</div>
        <div className="progress-bar">
          <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span>
    </Link>
  );
}
