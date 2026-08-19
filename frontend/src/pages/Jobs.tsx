import { useEffect, useState } from 'react';
import { jobsApi } from '../api/jobs.api';
import { filesApi, type UploadedFile } from '../api/files.api';
import type { Job } from '../types/job';
import JobCard from '../components/JobCard';
import '../styles/dashboard.css';

function extractErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.message === 'Network Error') return 'No se pudo conectar con el servidor';
  return 'Ocurrió un error inesperado';
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [importJobs, setImportJobs] = useState<Job[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [showDedup, setShowDedup] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const limit = 10;

  const loadJobs = async (p = page) => {
    setLoading(true);
    try {
      const data = await jobsApi.list(p, limit);
      setJobs(data.data);
      setTotal(data.meta.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(page);
  }, [page]);

  const loadFiles = async () => {
    try {
      const data = await filesApi.list(1, 100);
      setFiles(data.data ?? []);
    } catch {
      /* ignore */
    }
  };

  const loadImportJobs = async () => {
    try {
      const data = await jobsApi.list(1, 50);
      setImportJobs((data.data ?? []).filter((j) => j.type === 'IMPORT' && j.status === 'DONE'));
    } catch {
      /* ignore */
    }
  };

  const handleShowImport = () => {
    loadFiles();
    setShowImport(true);
    setShowDedup(false);
    setShowExport(false);
    setError('');
  };

  const handleShowDedup = () => {
    loadImportJobs();
    setShowDedup(true);
    setShowImport(false);
    setShowExport(false);
    setSelectedJobId('');
    setError('');
  };

  const handleShowExport = () => {
    setShowExport(true);
    setShowImport(false);
    setShowDedup(false);
    setError('');
  };

  const createImport = async () => {
    if (!selectedFileId) {
      setError('Selecciona un archivo');
      return;
    }
    setCreating(true);
    setError('');
    try {
      await jobsApi.createImport(selectedFileId);
      setShowImport(false);
      setPage(1);
      loadJobs(1);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const createDedup = async () => {
    if (!selectedJobId) {
      setError('Selecciona un trabajo de importación');
      return;
    }
    setCreating(true);
    setError('');
    try {
      await jobsApi.createDedup(selectedJobId);
      setShowDedup(false);
      setPage(1);
      loadJobs(1);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const createExport = async () => {
    setCreating(true);
    setError('');
    try {
      await jobsApi.createExport(exportFormat);
      setShowExport(false);
      setPage(1);
      loadJobs(1);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Trabajos</h2>
          <p className="page-subtitle">{total} trabajos en total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={handleShowImport}>
            📥 Importar
          </button>
          <button className="btn btn-ghost" onClick={handleShowDedup}>
            🔍 Deduplicar
          </button>
          <button className="btn btn-ghost" onClick={handleShowExport}>
            📤 Exportar
          </button>
        </div>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Crear trabajo de importación
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Seleccionar archivo</label>
            <select
              className="form-input"
              value={selectedFileId}
              onChange={(e) => setSelectedFileId(e.target.value)}
            >
              <option value="">— elegir un archivo —</option>
              {files.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.filename}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="auth-error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={createImport} disabled={creating}>
              {creating ? 'Creando…' : 'Iniciar importación'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowImport(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Dedup panel */}
      {showDedup && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Crear trabajo de deduplicación
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Trabajo de importación origen</label>
            <select
              className="form-input"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              <option value="">— elegir trabajo completado —</option>
              {importJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.inputFile?.filename ?? j.id.slice(0, 8)} — {j.processedRows} filas (
                  {new Date(j.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
            {importJobs.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                No hay trabajos de importación completados aún.
              </p>
            )}
          </div>
          {error && (
            <div className="auth-error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={createDedup} disabled={creating}>
              {creating ? 'Creando…' : 'Iniciar deduplicación'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowDedup(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Export panel */}
      {showExport && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Crear trabajo de exportación
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Formato</label>
            <select
              className="form-input"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
          {error && (
            <div className="auth-error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={createExport} disabled={creating}>
              {creating ? 'Creando…' : 'Iniciar exportación'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowExport(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <div>Cargando…</div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚙️</div>
          <div>Sin trabajos aún — crea uno arriba</div>
        </div>
      ) : (
        <>
          <div className="jobs-list">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </button>
              <span className="text-muted" style={{ fontSize: 13 }}>
                Página {page} de {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
