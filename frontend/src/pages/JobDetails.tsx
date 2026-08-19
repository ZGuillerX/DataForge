import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/jobs.api';
import { filesApi } from '../api/files.api';
import type { Job, JobRecord } from '../types/job';
import Icon from '../components/Icon';
import ConfirmDialog from '../components/ConfirmDialog';

type ResultFilter = 'all' | 'valid' | 'invalid' | 'duplicate';

const TYPE_LABEL: Record<string, string> = {
  IMPORT: 'Importación',
  DEDUP: 'Deduplicación',
  EXPORT: 'Exportación',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'border-tertiary-container/30 bg-tertiary-container/10 text-tertiary-container',
  RUNNING: 'border-primary/30 bg-primary/10 text-primary',
  DONE: 'border-secondary-container/30 bg-secondary-container/10 text-secondary-container',
  FAILED: 'border-error/30 bg-error/10 text-error',
};

interface LogLine {
  time: string;
  level: 'INFO' | 'EXEC' | 'WARN' | 'ERROR';
  message: string;
}

type SseEvent =
  | { type: 'connected'; jobId: string }
  | {
      type: 'progress';
      jobId: string;
      status: Job['status'];
      processedRows: number;
      failedRows: number;
      totalRows: number;
    };

function nowLabel(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const LOG_LEVEL_STYLE: Record<LogLine['level'], string> = {
  INFO: 'text-primary',
  EXEC: 'text-secondary',
  WARN: 'text-tertiary',
  ERROR: 'font-bold text-error',
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
  const [confirmingDedup, setConfirmingDedup] = useState(false);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const seededLogRef = useRef(false);

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
      setConfirmingDedup(false);
      navigate(`/jobs/${dedupJob.id}`);
    } catch {
      setConfirmingDedup(false);
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

  // Seed the log panel once the job is first loaded
  useEffect(() => {
    if (!job || seededLogRef.current) return;
    seededLogRef.current = true;
    setLogLines([
      {
        time: new Date(job.createdAt).toLocaleTimeString('en-GB', { hour12: false }),
        level: 'INFO',
        message: `Job ${job.id} creado (${TYPE_LABEL[job.type] ?? job.type})`,
      },
      ...(job.startedAt
        ? [
            {
              time: new Date(job.startedAt).toLocaleTimeString('en-GB', { hour12: false }),
              level: 'INFO' as const,
              message: 'Worker tomó el job. Estado: RUNNING',
            },
          ]
        : []),
      ...(job.completedAt
        ? [
            {
              time: new Date(job.completedAt).toLocaleTimeString('en-GB', { hour12: false }),
              level: job.status === 'FAILED' ? ('ERROR' as const) : ('EXEC' as const),
              message: `Job finalizado. Estado: ${job.status}`,
            },
          ]
        : []),
    ]);
  }, [job]);

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
        const payload = JSON.parse(event.data) as SseEvent;
        if (payload.type === 'connected') {
          setLogLines((prev) => [
            ...prev,
            { time: nowLabel(), level: 'INFO', message: 'Stream de eventos conectado (SSE)' },
          ]);
          return;
        }

        const { status, processedRows, failedRows, totalRows } = payload;
        setJob((prev) => (prev ? { ...prev, status, processedRows, failedRows, totalRows } : prev));
        setLogLines((prev) => [
          ...prev.slice(-49),
          {
            time: nowLabel(),
            level: 'EXEC',
            message: `Progreso: ${processedRows.toLocaleString()} procesadas, ${failedRows.toLocaleString()} fallidas / ${totalRows.toLocaleString()} totales`,
          },
        ]);
        if (status === 'DONE' || status === 'FAILED') {
          es.close();
          setSseActive(false);
          setLogLines((prev) => [
            ...prev,
            {
              time: nowLabel(),
              level: status === 'FAILED' ? 'ERROR' : 'EXEC',
              message: `Job finalizado. Estado: ${status}`,
            },
          ]);
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
      <div className="flex flex-col items-center gap-2 py-24 text-on-surface-variant">
        <div>Cargando…</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-on-surface-variant">
        <div>Trabajo no encontrado</div>
        <button
          className="mt-3 rounded border border-outline-variant px-4 py-2 text-body-sm font-body-sm text-on-surface-variant hover:text-on-surface"
          onClick={() => navigate('/jobs')}
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
  const fillColor =
    job.status === 'DONE' ? 'bg-secondary-container' : job.status === 'FAILED' ? 'bg-error' : 'bg-primary';
  const totalPages = Math.ceil(recordTotal / 20);

  // Build dynamic columns from first record
  const columns = records.length > 0 ? Object.keys(records[0].data ?? {}).slice(0, 8) : [];

  return (
    <>
      <button
        className="w-fit text-body-sm font-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
        onClick={() => navigate('/jobs')}
      >
        ← Volver
      </button>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-outline-variant pb-sm sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h2 className="text-headline-md font-headline-md text-on-surface">
              Trabajo de {TYPE_LABEL[job.type] ?? job.type}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-label-caps font-label-caps ${STATUS_BADGE[job.status]}`}
            >
              {sseActive && <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-current" />}
              {job.status}
            </span>
          </div>
          <p className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface-variant">
            <Icon name="tag" size={14} />
            {job.id}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {job.status === 'FAILED' && (
            <button
              className="flex items-center gap-2 rounded border border-outline-variant px-4 py-2 text-body-sm font-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
              onClick={handleRetry}
              disabled={retrying}
            >
              <Icon name="refresh" size={18} />
              {retrying ? 'Reintentando…' : 'Reintentar'}
            </button>
          )}
          {job.type === 'EXPORT' && job.status === 'DONE' && job.outputFile && (
            <button
              className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-body-sm font-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-50"
              onClick={handleDownloadExport}
              disabled={downloading}
            >
              <Icon name="download" size={18} />
              {downloading ? 'Descargando…' : 'Descargar archivo'}
            </button>
          )}
          {job.type === 'IMPORT' && job.status === 'DONE' && (
            <button
              className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-body-sm font-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-50"
              onClick={() => setConfirmingDedup(true)}
              disabled={deduping}
            >
              <Icon name="content_copy" size={18} />
              {deduping ? 'Creando…' : 'Deduplicar datos'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-outline-variant bg-surface p-md">
          <span className="mb-2 block text-label-caps font-label-caps text-on-surface-variant">
            Filas totales
          </span>
          <span className="text-headline-md font-headline-md text-on-surface">
            {job.totalRows.toLocaleString()}
          </span>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface p-md">
          <span className="mb-2 block text-label-caps font-label-caps text-on-surface-variant">
            {isDedup ? 'Duplicados encontrados' : 'Procesadas correctamente'}
          </span>
          <span className="text-headline-md font-headline-md text-secondary">
            {job.processedRows.toLocaleString()}
          </span>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface p-md transition-colors hover:border-error/50">
          <span className="mb-2 flex items-center gap-1.5 text-label-caps font-label-caps text-on-surface-variant">
            <Icon name="warning" size={14} className="text-error" />
            Filas fallidas
          </span>
          <span className="text-headline-md font-headline-md text-error">
            {isDedup ? 0 : job.failedRows.toLocaleString()}
          </span>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface p-md">
          <span className="mb-2 block text-label-caps font-label-caps text-on-surface-variant">
            Duración
          </span>
          <span className="text-headline-md font-headline-md text-on-surface">
            {job.startedAt ? formatDuration(job.startedAt, job.completedAt) : '—'}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface p-lg">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface">Progreso general</h3>
            <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">
              {isDedup
                ? `${job.processedRows.toLocaleString()} duplicados encontrados`
                : `${job.processedRows.toLocaleString()} / ${job.totalRows.toLocaleString()} filas`}
            </p>
          </div>
          <span className="text-headline-md font-headline-md text-primary">{pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container-highest">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${fillColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 text-body-sm font-body-sm sm:grid-cols-3">
        <div>
          <div className="text-label-caps font-label-caps text-on-surface-variant">Creado</div>
          <div className="mt-0.5 text-on-surface">{new Date(job.createdAt).toLocaleString()}</div>
        </div>
        {job.completedAt && (
          <div>
            <div className="text-label-caps font-label-caps text-on-surface-variant">Completado</div>
            <div className="mt-0.5 text-on-surface">
              {new Date(job.completedAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Error log */}
      {job.errorLog && Object.keys(job.errorLog).length > 0 && (
        <div className="rounded-xl border border-error/40 bg-error/5 p-md">
          <div className="mb-2 text-label-caps font-label-caps text-error">Log de errores</div>
          <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap break-words font-code-md text-code-md text-on-surface-variant">
            {JSON.stringify(job.errorLog, null, 2)}
          </pre>
        </div>
      )}

      {/* Live Execution Log (terminal) */}
      <div className="flex min-h-[280px] flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-high px-4 py-2">
          <div className="flex items-center gap-3">
            <Icon name="code" size={16} className="text-on-surface-variant" />
            <span className="text-label-caps font-label-caps text-on-surface">
              Registro de ejecución
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-body-sm text-on-surface-variant">
              {sseActive ? 'SSE conectado' : 'Sin stream activo'}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${sseActive ? 'animate-pulse-slow bg-secondary' : 'bg-outline-variant'}`}
            />
          </div>
        </div>
        <div className="flex-1 space-y-1.5 overflow-y-auto p-4 font-code-md text-code-md">
          {logLines.length === 0 ? (
            <div className="text-on-surface-variant">Sin actividad registrada.</div>
          ) : (
            logLines.map((line, i) => (
              <div key={i} className="flex gap-3 text-on-surface-variant">
                <span className="shrink-0">[{line.time}]</span>
                <span className={`shrink-0 ${LOG_LEVEL_STYLE[line.level]}`}>[{line.level}]</span>
                <span className="break-all">{line.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Results */}
      {(records.length > 0 || resultFilter !== 'all' || (isDedup && job.status === 'DONE')) && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-label-caps font-label-caps text-on-surface-variant">
              Resultados ({recordTotal.toLocaleString()} registros)
            </div>
            <div className="flex gap-1.5">
              {(['all', 'valid', 'invalid', 'duplicate'] as ResultFilter[]).map((f) => (
                <button
                  key={f}
                  className={`rounded border px-2.5 py-1 text-[11px] font-label-caps transition-colors ${
                    resultFilter === f
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
                  }`}
                  onClick={() => {
                    setResultFilter(f);
                    setRecordPage(1);
                  }}
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
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    <th className="px-3 py-2 text-label-caps font-label-caps text-on-surface-variant">
                      #
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-label-caps font-label-caps text-on-surface-variant"
                      >
                        {col}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-label-caps font-label-caps text-on-surface-variant">
                      Válido
                    </th>
                    <th className="px-3 py-2 text-label-caps font-label-caps text-on-surface-variant">
                      Duplicado
                    </th>
                  </tr>
                </thead>
                <tbody className="font-code-md text-code-md">
                  {records.map((rec) => (
                    <tr key={rec.id} className="border-b border-outline-variant last:border-0">
                      <td className="px-3 py-2 text-on-surface-variant">{rec.rowIndex}</td>
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-3 py-2 text-on-surface"
                          title={String(rec.data[col] ?? '')}
                        >
                          {String(rec.data[col] ?? '—')}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <span className={rec.isValid ? 'text-secondary' : 'text-error'}>
                          {rec.isValid ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {rec.isDuplicate ? (
                          <span className="text-tertiary">dup.</span>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 border-t border-outline-variant p-3">
                <button
                  className="rounded border border-outline-variant px-3 py-1 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                  disabled={recordPage <= 1}
                  onClick={() => setRecordPage((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  Página {recordPage} de {totalPages}
                </span>
                <button
                  className="rounded border border-outline-variant px-3 py-1 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
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
        <div className="flex flex-col items-center gap-2 py-16 text-on-surface-variant">
          <Icon name="list_alt" size={32} />
          <div>No se encontraron registros para este trabajo</div>
        </div>
      )}
      {records.length === 0 && resultFilter !== 'all' && (
        <div className="flex flex-col items-center gap-2 py-16 text-on-surface-variant">
          <Icon name="search" size={32} />
          <div>Sin resultados para el filtro seleccionado</div>
        </div>
      )}

      {confirmingDedup && (
        <ConfirmDialog
          title="Confirmar deduplicación"
          message={`Se va a buscar duplicados en los ${job.processedRows.toLocaleString()} registros procesados de este trabajo.`}
          confirmLabel="Deduplicar"
          loading={deduping}
          onConfirm={handleRunDedup}
          onCancel={() => setConfirmingDedup(false)}
        />
      )}
    </>
  );
}
