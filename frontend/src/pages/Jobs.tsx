import { useEffect, useState } from 'react';
import { jobsApi } from '../api/jobs.api';
import { filesApi, type UploadedFile } from '../api/files.api';
import type { Job } from '../types/job';
import JobCard from '../components/JobCard';
import Icon from '../components/Icon';

function extractErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.message === 'Network Error') return 'No se pudo conectar con el servidor';
  return 'Ocurrió un error inesperado';
}

type Panel = 'import' | 'dedup' | 'export' | null;

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [importJobs, setImportJobs] = useState<Job[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
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

  const openPanel = (next: Panel) => {
    setPanel(next);
    setError('');
    if (next === 'import') loadFiles();
    if (next === 'dedup') {
      setSelectedJobId('');
      loadImportJobs();
    }
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
      setPanel(null);
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
      setPanel(null);
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
      setPanel(null);
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
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-headline-md font-headline-md text-on-surface">Trabajos</h2>
          <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">
            {total} trabajos en total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 rounded border border-outline-variant px-3 py-1.5 text-body-sm font-body-sm text-on-surface transition-colors hover:border-primary hover:text-primary"
            onClick={() => openPanel('import')}
          >
            <Icon name="upload" size={16} />
            Importar
          </button>
          <button
            className="flex items-center gap-2 rounded border border-outline-variant px-3 py-1.5 text-body-sm font-body-sm text-on-surface transition-colors hover:border-primary hover:text-primary"
            onClick={() => openPanel('dedup')}
          >
            <Icon name="content_copy" size={16} />
            Deduplicar
          </button>
          <button
            className="flex items-center gap-2 rounded border border-outline-variant px-3 py-1.5 text-body-sm font-body-sm text-on-surface transition-colors hover:border-primary hover:text-primary"
            onClick={() => openPanel('export')}
          >
            <Icon name="download" size={16} />
            Exportar
          </button>
        </div>
      </div>

      {panel === 'import' && (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
          <div className="mb-3 text-headline-sm font-headline-sm font-medium text-on-surface">
            Crear trabajo de importación
          </div>
          <div className="mb-3 flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant">
              Seleccionar archivo
            </label>
            <select
              className="rounded border border-outline-variant bg-background px-3 py-2 text-body-sm font-body-sm text-on-surface focus:border-primary focus:outline-none"
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
            <div className="mb-3 rounded border border-error/30 bg-error/10 px-3 py-2 text-body-sm font-body-sm text-error">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              className="rounded bg-primary px-4 py-2 text-body-sm font-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-50"
              onClick={createImport}
              disabled={creating}
            >
              {creating ? 'Creando…' : 'Iniciar importación'}
            </button>
            <button
              className="rounded border border-outline-variant px-4 py-2 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
              onClick={() => setPanel(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {panel === 'dedup' && (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
          <div className="mb-3 text-headline-sm font-headline-sm font-medium text-on-surface">
            Crear trabajo de deduplicación
          </div>
          <div className="mb-3 flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant">
              Trabajo de importación origen
            </label>
            <select
              className="rounded border border-outline-variant bg-background px-3 py-2 text-body-sm font-body-sm text-on-surface focus:border-primary focus:outline-none"
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
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                No hay trabajos de importación completados aún.
              </p>
            )}
          </div>
          {error && (
            <div className="mb-3 rounded border border-error/30 bg-error/10 px-3 py-2 text-body-sm font-body-sm text-error">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              className="rounded bg-primary px-4 py-2 text-body-sm font-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-50"
              onClick={createDedup}
              disabled={creating}
            >
              {creating ? 'Creando…' : 'Iniciar deduplicación'}
            </button>
            <button
              className="rounded border border-outline-variant px-4 py-2 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
              onClick={() => setPanel(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {panel === 'export' && (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
          <div className="mb-3 text-headline-sm font-headline-sm font-medium text-on-surface">
            Crear trabajo de exportación
          </div>
          <div className="mb-3 flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant">
              Formato
            </label>
            <select
              className="rounded border border-outline-variant bg-background px-3 py-2 text-body-sm font-body-sm text-on-surface focus:border-primary focus:outline-none"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
          {error && (
            <div className="mb-3 rounded border border-error/30 bg-error/10 px-3 py-2 text-body-sm font-body-sm text-error">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              className="rounded bg-primary px-4 py-2 text-body-sm font-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-50"
              onClick={createExport}
              disabled={creating}
            >
              {creating ? 'Creando…' : 'Iniciar exportación'}
            </button>
            <button
              className="rounded border border-outline-variant px-4 py-2 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
              onClick={() => setPanel(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-2 py-16 text-on-surface-variant">
          <div>Cargando…</div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant py-16 text-on-surface-variant">
          <Icon name="terminal" size={32} />
          <div>Sin trabajos aún — crea uno arriba</div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                className="rounded border border-outline-variant px-3 py-1 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </button>
              <span className="text-body-sm font-body-sm text-on-surface-variant">
                Página {page} de {totalPages}
              </span>
              <button
                className="rounded border border-outline-variant px-3 py-1 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
