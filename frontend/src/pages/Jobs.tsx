import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/jobs.api';
import { filesApi, type UploadedFile } from '../api/files.api';
import type { Job } from '../types/job';
import JobCard from '../components/JobCard';
import Icon from '../components/Icon';
import ConfirmDialog from '../components/ConfirmDialog';

function extractErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.message === 'Network Error') return 'No se pudo conectar con el servidor';
  return 'Ocurrió un error inesperado';
}

type Panel = 'import' | 'dedup' | 'export' | null;
type ExportRecordFilter = 'valid' | 'duplicate' | 'unique' | 'invalid';

const EXPORT_FILTER_LABEL: Record<ExportRecordFilter, string> = {
  valid: 'Todos los registros válidos',
  duplicate: 'Solo duplicados',
  unique: 'Sin duplicados (únicos)',
  invalid: 'Filas inválidas',
};

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [completedImportJobs, setCompletedImportJobs] = useState<Job[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportSourceJobId, setExportSourceJobId] = useState('');
  const [exportRecordFilter, setExportRecordFilter] = useState<ExportRecordFilter>('valid');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState<Panel>(null);
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

  const loadCompletedImportJobs = async () => {
    try {
      const data = await jobsApi.list(1, 50);
      setCompletedImportJobs(
        (data.data ?? []).filter((j) => j.type === 'IMPORT' && j.status === 'DONE'),
      );
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
      loadCompletedImportJobs();
    }
    if (next === 'export') {
      setExportSourceJobId('');
      setExportRecordFilter('valid');
      loadCompletedImportJobs();
    }
  };

  const selectedFile = files.find((f) => f.id === selectedFileId);
  const selectedImportJob = completedImportJobs.find((j) => j.id === selectedJobId);
  const exportSourceJob = completedImportJobs.find((j) => j.id === exportSourceJobId);

  const requestImport = () => {
    if (!selectedFileId) {
      setError('Selecciona un archivo');
      return;
    }
    setError('');
    setConfirming('import');
  };

  const requestDedup = () => {
    if (!selectedJobId) {
      setError('Selecciona un trabajo de importación');
      return;
    }
    setError('');
    setConfirming('dedup');
  };

  const requestExport = () => {
    setError('');
    setConfirming('export');
  };

  const confirmImport = async () => {
    setCreating(true);
    try {
      const job = await jobsApi.createImport(selectedFileId);
      setPanel(null);
      setConfirming(null);
      navigate(`/jobs/${job.id}`);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
      setConfirming(null);
    } finally {
      setCreating(false);
    }
  };

  const confirmDedup = async () => {
    setCreating(true);
    try {
      const job = await jobsApi.createDedup(selectedJobId);
      setPanel(null);
      setConfirming(null);
      navigate(`/jobs/${job.id}`);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
      setConfirming(null);
    } finally {
      setCreating(false);
    }
  };

  const confirmExport = async () => {
    setCreating(true);
    try {
      const filters = exportSourceJobId
        ? {
            jobId: exportSourceJobId,
            ...(exportRecordFilter === 'duplicate' && { isDuplicate: true }),
            ...(exportRecordFilter === 'unique' && { isDuplicate: false }),
            ...(exportRecordFilter === 'invalid' && { isValid: false }),
          }
        : undefined;
      const job = await jobsApi.createExport(exportFormat, filters);
      setPanel(null);
      setConfirming(null);
      navigate(`/jobs/${job.id}`);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
      setConfirming(null);
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
              onClick={requestImport}
              disabled={creating}
            >
              Iniciar importación
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
              {completedImportJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.inputFile?.filename ?? j.id.slice(0, 8)} — {j.processedRows} filas (
                  {new Date(j.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
            {completedImportJobs.length === 0 && (
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
              onClick={requestDedup}
              disabled={creating}
            >
              Iniciar deduplicación
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
              Fuente
            </label>
            <select
              className="rounded border border-outline-variant bg-background px-3 py-2 text-body-sm font-body-sm text-on-surface focus:border-primary focus:outline-none"
              value={exportSourceJobId}
              onChange={(e) => setExportSourceJobId(e.target.value)}
            >
              <option value="">Todos mis registros válidos (todos los trabajos)</option>
              {completedImportJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.inputFile?.filename ?? j.id.slice(0, 8)} — {j.processedRows} filas
                </option>
              ))}
            </select>
          </div>

          {exportSourceJobId && (
            <div className="mb-3 flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant">
                Registros a incluir
              </label>
              <select
                className="rounded border border-outline-variant bg-background px-3 py-2 text-body-sm font-body-sm text-on-surface focus:border-primary focus:outline-none"
                value={exportRecordFilter}
                onChange={(e) => setExportRecordFilter(e.target.value as ExportRecordFilter)}
              >
                {(Object.keys(EXPORT_FILTER_LABEL) as ExportRecordFilter[]).map((f) => (
                  <option key={f} value={f}>
                    {EXPORT_FILTER_LABEL[f]}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              onClick={requestExport}
              disabled={creating}
            >
              Iniciar exportación
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

      {confirming === 'import' && (
        <ConfirmDialog
          title="Confirmar importación"
          message={`Se va a crear un trabajo de importación para "${selectedFile?.filename ?? 'el archivo seleccionado'}". Vas a ver el progreso en la pantalla del trabajo.`}
          confirmLabel="Importar"
          loading={creating}
          onConfirm={confirmImport}
          onCancel={() => setConfirming(null)}
        />
      )}

      {confirming === 'dedup' && (
        <ConfirmDialog
          title="Confirmar deduplicación"
          message={`Se va a buscar duplicados en "${selectedImportJob?.inputFile?.filename ?? 'el trabajo seleccionado'}" (${selectedImportJob?.processedRows ?? 0} filas).`}
          confirmLabel="Deduplicar"
          loading={creating}
          onConfirm={confirmDedup}
          onCancel={() => setConfirming(null)}
        />
      )}

      {confirming === 'export' && (
        <ConfirmDialog
          title="Confirmar exportación"
          message={
            exportSourceJobId
              ? `Se va a exportar "${EXPORT_FILTER_LABEL[exportRecordFilter]}" de "${exportSourceJob?.inputFile?.filename ?? 'el trabajo seleccionado'}" en formato ${exportFormat.toUpperCase()}.`
              : `Se van a exportar todos tus registros válidos en formato ${exportFormat.toUpperCase()}.`
          }
          confirmLabel="Exportar"
          loading={creating}
          onConfirm={confirmExport}
          onCancel={() => setConfirming(null)}
        />
      )}
    </>
  );
}
