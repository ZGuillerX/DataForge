import { useEffect, useState } from 'react';
import { filesApi, type UploadedFile } from '../api/files.api';
import { jobsApi } from '../api/jobs.api';
import FileUploader from '../components/FileUploader';
import Icon from '../components/Icon';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Files() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const limit = 15;

  const load = async (p = page) => {
    setLoading(true);
    try {
      const data = await filesApi.list(p, limit);
      setFiles(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const handleUploaded = (file: UploadedFile) => {
    setMessage(`✅ "${file.filename}" subido`);
    load(1);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleImport = async (fileId: string) => {
    setImportingId(fileId);
    try {
      const job = await jobsApi.createImport(fileId);
      setMessage(`✅ Trabajo de importación iniciado: ${job.id.slice(0, 8)}…`);
      setTimeout(() => setMessage(''), 5000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        e?.response?.data?.message ??
        (e?.message === 'Network Error'
          ? 'No se pudo conectar con el servidor'
          : 'Error al iniciar importación');
      setMessage(`❌ ${msg}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setImportingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div>
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Gestión de archivos
        </h2>
        <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">
          Sube, importa y administra tus datasets.
        </p>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
        <div className="mb-4 flex items-center gap-2 text-label-caps font-label-caps text-on-surface-variant">
          <Icon name="upload_file" size={16} />
          Subir nuevo archivo
        </div>
        <FileUploader onUploaded={handleUploaded} />
        {message && (
          <div className="mt-3 text-body-sm font-body-sm text-on-surface-variant">{message}</div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low p-4">
          <h3 className="text-headline-sm font-headline-sm font-medium text-on-surface">
            Historial de subidas
          </h3>
          <span className="text-code-md font-code-md text-on-surface-variant">
            {total} archivo{total === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-2 py-16 text-on-surface-variant">
            <div>Cargando…</div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-on-surface-variant">
            <Icon name="folder_open" size={32} />
            <div>Sin archivos aún — sube uno arriba</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-highest">
                    <th className="px-4 py-3 text-label-caps font-label-caps font-semibold text-on-surface-variant">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-label-caps font-label-caps font-semibold text-on-surface-variant">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-label-caps font-label-caps font-semibold text-on-surface-variant">
                      Tamaño
                    </th>
                    <th className="px-4 py-3 text-label-caps font-label-caps font-semibold text-on-surface-variant">
                      Subido
                    </th>
                    <th className="px-4 py-3 text-label-caps font-label-caps font-semibold text-on-surface-variant">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="text-body-sm font-body-sm text-on-surface">
                  {files.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-outline-variant transition-colors last:border-0 hover:bg-surface-container-high"
                    >
                      <td className="flex items-center gap-3 px-4 py-3">
                        <Icon name="description" size={18} className="text-on-surface-variant" />
                        <span className="font-code-md text-code-md">{f.filename}</span>
                      </td>
                      <td className="px-4 py-3">
                        {f.type === 'EXPORT' ? (
                          <div className="inline-flex items-center gap-1.5 rounded border border-secondary-container/30 bg-secondary-container/10 px-2 py-0.5 text-secondary-container">
                            <span className="text-[11px] font-semibold uppercase tracking-wider">
                              Export
                            </span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant">{f.mimeType}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-code-md text-code-md text-on-surface-variant">
                        {formatBytes(f.size)}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="flex items-center gap-1 rounded border border-outline-variant px-2.5 py-1 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                            onClick={() => filesApi.download(f.id, f.filename)}
                          >
                            <Icon name="download" size={14} />
                            Descargar
                          </button>
                          {f.type !== 'EXPORT' && (
                            <button
                              className="flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-body-sm font-body-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-50"
                              disabled={importingId === f.id}
                              onClick={() => handleImport(f.id)}
                            >
                              <Icon name="play_arrow" size={14} />
                              {importingId === f.id ? 'Iniciando…' : 'Importar'}
                            </button>
                          )}
                        </div>
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
      </div>
    </>
  );
}
