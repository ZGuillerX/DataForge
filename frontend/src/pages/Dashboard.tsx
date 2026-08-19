import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../api/jobs.api';
import type { Job } from '../types/job';
import Icon from '../components/Icon';
import JobCard from '../components/JobCard';

export default function Dashboard() {
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [rowsProcessed, setRowsProcessed] = useState(0);
  const [recentVolume, setRecentVolume] = useState<{ label: string; rows: number }[]>([]);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [recentData, allData] = await Promise.all([
          jobsApi.list(1, 5),
          jobsApi.list(1, 100),
        ]);
        setRecentJobs(recentData.data);
        setTotalJobs(recentData.meta.total);
        const allJobs = allData.data;
        setDoneCount(allJobs.filter((j) => j.status === 'DONE').length);
        setActiveCount(allJobs.filter((j) => j.status === 'RUNNING').length);
        setPendingCount(allJobs.filter((j) => j.status === 'PENDING').length);
        setFailedCount(allJobs.filter((j) => j.status === 'FAILED').length);
        setRowsProcessed(allJobs.reduce((sum, j) => sum + j.processedRows, 0));
        setRecentVolume(
          [...allJobs]
            .reverse()
            .slice(0, 12)
            .map((j) => ({ label: j.id.slice(0, 6), rows: j.processedRows })),
        );
        setHealthOk(true);
      } catch {
        setHealthOk(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-on-surface-variant">
        <div>Cargando…</div>
      </div>
    );
  }

  const maxVolume = Math.max(1, ...recentVolume.map((v) => v.rows));

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-headline-md font-headline-md text-on-surface">
            Observabilidad del sistema
          </h2>
          <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">
            Telemetría y métricas de procesamiento en tiempo real.
          </p>
        </div>
        <Link
          to="/jobs"
          className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-body-md font-body-md font-semibold text-on-primary transition-colors hover:bg-primary-fixed"
        >
          <Icon name="add" size={18} />
          Nuevo trabajo
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-md transition-colors hover:border-surface-bright">
          <div className="flex items-start justify-between">
            <span className="text-label-caps font-label-caps text-on-surface-variant">
              Estado del sistema
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`h-2 w-2 rounded-full ${healthOk ? 'bg-secondary-container' : 'bg-error'}`}
              />
              <span
                className={`text-code-md font-code-md ${healthOk ? 'text-secondary-container' : 'text-error'}`}
              >
                {healthOk ? 'OK' : 'DOWN'}
              </span>
            </div>
          </div>
          <span className="mt-2 text-headline-md font-headline-md">API / DB / Redis</span>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-md transition-colors hover:border-surface-bright">
          <div className="flex items-start justify-between">
            <span className="text-label-caps font-label-caps text-on-surface-variant">
              Trabajos en cola
            </span>
            <Icon name="view_list" className="text-primary" size={16} />
          </div>
          <span className="mt-2 text-headline-md font-headline-md text-primary">
            {pendingCount + activeCount}
          </span>
          <div className="mt-2 h-1 w-full overflow-hidden rounded bg-background">
            <div
              className="h-full bg-primary"
              style={{ width: `${totalJobs > 0 ? Math.round(((pendingCount + activeCount) / totalJobs) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-md transition-colors hover:border-primary/50">
          <div className="flex items-start justify-between">
            <span className="text-label-caps font-label-caps text-on-surface-variant">
              Filas procesadas
            </span>
            <span className="h-2 w-2 animate-pulse-slow rounded-full bg-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-headline-md font-headline-md">
              {rowsProcessed.toLocaleString()}
            </span>
            <span className="text-label-caps font-label-caps text-on-surface-variant">
              últimos 100 jobs
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-md transition-colors hover:border-error/50">
          <div className="flex items-start justify-between">
            <span className="text-label-caps font-label-caps text-on-surface-variant">
              Trabajos fallidos
            </span>
            <Icon name="warning" className="text-error" size={16} />
          </div>
          <span className="mt-2 text-headline-md font-headline-md text-error">{failedCount}</span>
          <span className="text-body-sm font-body-sm text-on-surface-variant">
            de {totalJobs} trabajos totales
          </span>
        </div>
      </div>

      {/* Bento grid: chart + queue status */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-low lg:col-span-2">
          <div className="flex items-center justify-between rounded-t-xl border-b border-outline-variant bg-surface-bright/20 p-md">
            <h3 className="text-label-caps font-label-caps text-on-surface">
              Filas procesadas por trabajo reciente
            </h3>
          </div>
          <div className="min-h-[280px] flex-1 p-md">
            {recentVolume.length === 0 ? (
              <div className="flex h-full items-center justify-center text-body-sm font-body-sm text-on-surface-variant">
                Sin trabajos recientes todavía
              </div>
            ) : (
              <div className="flex h-full items-end justify-between gap-1 pt-8">
                {recentVolume.map((v, i) => (
                  <div
                    key={i}
                    className="group relative w-full border-t border-primary/50 bg-primary/20 transition-colors hover:bg-primary/40"
                    style={{ height: `${Math.max(4, Math.round((v.rows / maxVolume) * 100))}%` }}
                    title={`${v.label}: ${v.rows.toLocaleString()} filas`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-low">
          <div className="flex items-center justify-between rounded-t-xl border-b border-outline-variant bg-surface-bright/20 p-md">
            <h3 className="text-label-caps font-label-caps text-on-surface">Estado de la cola</h3>
          </div>
          <div className="flex flex-col gap-4 p-md">
            <div className="flex items-center justify-between rounded border border-primary/30 bg-background p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded border border-primary/20 bg-primary/10">
                  <Icon name="play_arrow" className="text-primary" size={18} />
                </div>
                <div>
                  <div className="text-code-md font-code-md text-on-surface">Activos</div>
                  <div className="text-label-caps font-label-caps text-on-surface-variant">
                    Procesando
                  </div>
                </div>
              </div>
              <span className="text-headline-sm font-headline-sm text-primary">
                {activeCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded border border-outline-variant bg-background p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant bg-surface-bright">
                  <Icon name="hourglass_empty" className="text-on-surface-variant" size={18} />
                </div>
                <div>
                  <div className="text-code-md font-code-md text-on-surface">En espera</div>
                  <div className="text-label-caps font-label-caps text-on-surface-variant">
                    En cola
                  </div>
                </div>
              </div>
              <span className="text-headline-sm font-headline-sm text-on-surface">
                {pendingCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded border border-outline-variant bg-background p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded border border-secondary-container/20 bg-secondary-container/10">
                  <Icon name="check" className="text-secondary-container" size={18} />
                </div>
                <div>
                  <div className="text-code-md font-code-md text-on-surface">Completados</div>
                  <div className="text-label-caps font-label-caps text-on-surface-variant">
                    Total
                  </div>
                </div>
              </div>
              <span className="text-headline-sm font-headline-sm text-on-surface">
                {doneCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded border border-error/20 bg-background p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded border border-error/20 bg-error/10">
                  <Icon name="close" className="text-error" size={18} />
                </div>
                <div>
                  <div className="text-code-md font-code-md text-on-surface">Fallidos</div>
                  <div className="text-label-caps font-label-caps text-on-surface-variant">
                    Requieren atención
                  </div>
                </div>
              </div>
              <span className="text-headline-sm font-headline-sm text-error">{failedCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 text-label-caps font-label-caps text-on-surface-variant">
          Trabajos recientes
        </div>
        {recentJobs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant py-16 text-on-surface-variant">
            <Icon name="terminal" size={32} />
            <div>Aún no hay trabajos</div>
            <Link
              to="/jobs"
              className="mt-2 rounded bg-primary px-4 py-2 text-body-sm font-body-sm font-semibold text-on-primary hover:bg-primary-fixed"
            >
              Crea tu primer trabajo
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
