import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../api/jobs.api';
import { filesApi } from '../api/files.api';
import type { Job } from '../types/job';
import JobCard from '../components/JobCard';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [runningCount, setRunningCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch last 5 for display + up to 100 for accurate status counts
        const [recentData, allData, filesData] = await Promise.all([
          jobsApi.list(1, 5),
          jobsApi.list(1, 100),
          filesApi.list(1),
        ]);
        setRecentJobs(recentData.data);
        setTotalJobs(recentData.meta.total);
        setTotalFiles(filesData.meta?.total ?? 0);
        const allJobs = allData.data;
        setDoneCount(allJobs.filter((j) => j.status === 'DONE').length);
        setRunningCount(
          allJobs.filter((j) => j.status === 'RUNNING' || j.status === 'PENDING').length,
        );
        setFailedCount(allJobs.filter((j) => j.status === 'FAILED').length);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <div>Cargando…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Resumen</h2>
          <p className="page-subtitle">Bienvenido de nuevo — esto es lo que está pasando</p>
        </div>
        <Link to="/jobs" className="btn btn-primary">
          + Nuevo trabajo
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-label">Archivos totales</div>
          <div className="stat-value">{totalFiles}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚙️</div>
          <div className="stat-label">Trabajos totales</div>
          <div className="stat-value">{totalJobs}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Completados</div>
          <div className="stat-value text-success">{doneCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">En ejecución</div>
          <div className="stat-value text-info">{runningCount}</div>
          <div className="stat-sub">en cola o procesando</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-label">Fallidos</div>
          <div className="stat-value text-danger">{failedCount}</div>
        </div>
      </div>

      <div className="section-title">Trabajos recientes</div>
      {recentJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚙️</div>
          <div>Aún no hay trabajos</div>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: 8 }}>
            Crea tu primer trabajo
          </Link>
        </div>
      ) : (
        <div className="jobs-list">
          {recentJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
