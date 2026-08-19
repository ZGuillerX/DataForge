import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/jobs.api';
import { filesApi } from '../api/files.api';
import type { Job, JobRecord } from '../types/job';
import '../styles/dashboard.css';

type ResultFilter = 'all' | 'valid' | 'invalid' | 'duplicate';

const TYPE_LABEL: Record<string, string> = {
  IMPORT: 'Importación',
  DEDUP: 'Deduplicación',
  EXPORT: 'Exportación',
};

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [records, setRecords] = useState<JobRecord[]>([]);
  const [recordTotal, setRecordTotal] = useState(0);
  const [recordPage, setRecordPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sseActive, setSseActive] = useState(false);
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [retrying, setRetrying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deduping, setDeduping] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const loadJob = async () => {
    if (!id) return;
    try {
      const data = await jobsApi.get(id);
      setJob(data);
    } catch {
      /* ignore */
    }
  };

  const loadResults = async (p = recordPage, filter = resultFilter) => {
    if (!id) return;
    try {
      const data = await jobsApi.getResults(id, p, filter);
      setRecords(data.data ?? []);
      setRecordTotal(data.meta?.total ?? 0);
    } catch {
      /* ignore */
    }
  };

  const handleRetry = async () => {
    if (!id) return;
    setRetrying(true);
    try {
      const updated = await jobsApi.retry(id);
      setJob(updated);
    } catch {
      /* ignore */
    } finally {
      setRetrying(false);
    }
  };

  const handleDownloadExport = async () => {
    if (!job?.outputFile) return;
    setDownloading(true);
    try {
      await filesApi.download(job.outputFile.id, job.outputFile.filename);
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  };

  const handleRunDedup = async () => {
    if (!id) return;
    setDeduping(true);
    try {
      const dedupJob = await jobsApi.createDedup(id);
      navigate(`/jobs/${dedupJob.id}`);
    } catch {
      /* ignore */
    } finally {
      setDeduping(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      await loadJob();
      await loadResults(1);
      setLoading(false);
    };
    init();
  }, [id]);

  // Connect SSE when job is PENDING or RUNNING
  useEffect(() => {
    if (!job || !id) return;
    if (job.status !== 'PENDING' && job.status !== 'RUNNING') return;

    const token = localStorage.getItem('token');
    const url = `/api/v1/jobs/${id}/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const es = new EventSource(url);
    esRef.current = es;
    setSseActive(true);

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as Partial<Job>;
        setJob((prev) => (prev ? { ...prev, ...payload } : prev));
        if (payload.status === 'DONE' || payload.status === 'FAILED') {
          es.close();
          setSseActive(false);
          loadResults(1);
        }
      } catch {
        /* ignore */
      }
    };

    es.onerror = () => {
      es.close();
      setSseActive(false);
    };

    return () => {
      es.close();
      setSseActive(false);
    };
  }, [job?.status, id]);

  useEffect(() => {
    loadResults(recordPage, resultFilter);
  }, [recordPage, resultFilter]);

  if (loading) {
    return (
      <div className="empty-state">
        <div>Cargando…</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="empty-state">
        <div>Trabajo no encontrado</div>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/jobs')}
          style={{ marginTop: 12 }}
        >
          ← Volver a trabajos
        </button>
      </div>
    );
  }

  const isDedup = job.type === 'DEDUP';
  const pct =
    job.totalRows > 0
      ? Math.round((job.processedRows / job.totalRows) * 100)
      : job.status === 'DONE'
        ? 100
        : 0;
  const fillClass = job.status === 'DONE' ? 'done' : job.status === 'FAILED' ? 'failed' : '';
  const totalPages = Math.ceil(recordTotal / 20);

  // Build dynamic columns from first record
  const columns = records.length > 0 ? Object.keys(records[0].data ?? {}).slice(0, 8) : [];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/jobs')}>
          ← Volver
        </button>
      </div>

      <div className="job-detail-header">
        <div className="job-detail-info">
          <div className="job-detail-title">
            Trabajo de {TYPE_LABEL[job.type] ?? job.type}
            {sseActive && (
              <span className="live-badge" style={{ marginLeft: 12 }}>
                <span className="live-dot" /> EN VIVO
              </span>
            )}
          </div>
          <div className="job-detail-id">{job.id}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span>
          {job.status === 'FAILED' && (
            <button
              className="btn btn-ghost"
              onClick={handleRetry}
              disabled={retrying}
              style={{ fontSize: 12, padding: '4px 12px' }}
            >
              {retrying ? 'Reintentando…' : '↺ Reintentar'}
            </button>
          )}
          {job.type === 'EXPORT' && job.status === 'DONE' && job.outputFile && (
            <button
              className="btn btn-primary"
              onClick={handleDownloadExport}
              disabled={downloading}
              style={{ fontSize: 12, padding: '4px 12px' }}
            >
              {downloading ? 'Descargando…' : '⬇ Descargar archivo'}
            </button>
          )}
          {job.type === 'IMPORT' && job.status === 'DONE' && (
            <button
              className="btn btn-primary"
              onClick={handleRunDedup}
              disabled={deduping}
              style={{ fontSize: 12, padding: '4px 12px' }}
            >
              {deduping ? 'Creando…' : '🔍 Deduplicar datos'}
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          <span>Progreso</span>
          <span>
            {isDedup
              ? `${job.processedRows.toLocaleString()} duplicados encontrados`
              : `${pct}% (${job.processedRows.toLocaleString()} / ${job.totalRows.toLocaleString()} filas)`}
          </span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>
        {!isDedup && job.failedRows > 0 && (
          <div style={{ marginTop: 8, fontSize: 13 }} className="text-danger">
            {job.failedRows.toLocaleString()} filas fallidas
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="job-meta-grid" style={{ marginBottom: 24 }}>
        <div className="job-meta-item">
          <div className="job-meta-key">Tipo</div>
          <div className="job-meta-val">{job.type}</div>
        </div>
        <div className="job-meta-item">
          <div className="job-meta-key">Estado</div>
          <div
            className={`job-meta-val ${job.status === 'DONE' ? 'text-success' : job.status === 'FAILED' ? 'text-danger' : ''}`}
          >
            {job.status}
          </div>
        </div>
        <div className="job-meta-item">
          <div className="job-meta-key">Filas totales</div>
          <div className="job-meta-val">{job.totalRows.toLocaleString()}</div>
        </div>
        <div className="job-meta-item">
          <div className="job-meta-key">Procesadas</div>
          <div className="job-meta-val">{job.processedRows.toLocaleString()}</div>
        </div>
        <div className="job-meta-item">
          <div className="job-meta-key">Creado</div>
          <div className="job-meta-val" style={{ fontSize: 13 }}>
            {new Date(job.createdAt).toLocaleString()}
          </div>
        </div>
        {job.completedAt && (
          <div className="job-meta-item">
            <div className="job-meta-key">Completado</div>
            <div className="job-meta-val" style={{ fontSize: 13 }}>
              {new Date(job.completedAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Error log */}
      {job.errorLog && Object.keys(job.errorLog).length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--danger)' }}>
          <div className="section-title" style={{ color: 'var(--danger)', marginBottom: 8 }}>
            Log de errores
          </div>
          <pre
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {JSON.stringify(job.errorLog, null, 2)}
          </pre>
        </div>
      )}

      {/* Results */}
      {(records.length > 0 || resultFilter !== 'all' || (isDedup && job.status === 'DONE')) && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div className="section-title" style={{ margin: 0 }}>
              Resultados ({recordTotal.toLocaleString()} registros)
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'valid', 'invalid', 'duplicate'] as ResultFilter[]).map((f) => (
                <button
                  key={f}
                  className={`page-btn${resultFilter === f ? ' active' : ''}`}
                  onClick={() => {
                    setResultFilter(f);
                    setRecordPage(1);
                  }}
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  {f === 'all'
                    ? 'Todos'
                    : f === 'valid'
                      ? '✓ Válidos'
                      : f === 'invalid'
                        ? '✗ Inválidos'
                        : '⊕ Duplicados'}
                </button>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div className="results-table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                    <th>Válido</th>
                    <th>Duplicado</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id}>
                      <td className="text-muted">{rec.rowIndex}</td>
                      {columns.map((col) => (
                        <td key={col} title={String(rec.data[col] ?? '')}>
                          {String(rec.data[col] ?? '—')}
                        </td>
                      ))}
                      <td>
                        <span style={{ color: rec.isValid ? 'var(--success)' : 'var(--danger)' }}>
                          {rec.isValid ? '✓' : '✗'}
                        </span>
                      </td>
                      <td>
                        {rec.isDuplicate ? (
                          <span style={{ color: 'var(--warning)' }}>dup.</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination" style={{ padding: '12px 0' }}>
                <button
                  className="page-btn"
                  disabled={recordPage <= 1}
                  onClick={() => setRecordPage((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  Página {recordPage} de {totalPages}
                </span>
                <button
                  className="page-btn"
                  disabled={recordPage >= totalPages}
                  onClick={() => setRecordPage((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {job.status === 'DONE' && records.length === 0 && resultFilter === 'all' && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div>No se encontraron registros para este trabajo</div>
        </div>
      )}
      {records.length === 0 && resultFilter !== 'all' && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div>Sin resultados para el filtro seleccionado</div>
        </div>
      )}
    </div>
  );
}
