import { useEffect, useState } from 'react';
import { filesApi, type UploadedFile } from '../api/files.api';
import { jobsApi } from '../api/jobs.api';
import FileUploader from '../components/FileUploader';
import '../styles/dashboard.css';
import '../styles/auth.css';

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
      const data = await filesApi.list(p);
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
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Archivos</h2>
          <p className="page-subtitle">{total} archivos subidos</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>
          Subir nuevo archivo
        </div>
        <FileUploader onUploaded={handleUploaded} />
        {message && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            {message}
          </div>
        )}
      </div>

      {loading ? (
        <div className="empty-state">
          <div>Cargando…</div>
        </div>
      ) : files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div>Sin archivos aún — sube uno arriba</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="files-table">
            <thead>
              <tr>
                <th>Nombre de archivo</th>
                <th>Tipo</th>
                <th>Tamaño</th>
                <th>Subido</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span className="file-name">{f.filename}</span>
                  </td>
                  <td>
                    {f.type === 'EXPORT' ? (
                      <span className="badge badge-done" style={{ fontSize: 10 }}>
                        EXPORT
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{f.mimeType}</span>
                    )}
                  </td>
                  <td>{formatBytes(f.size)}</td>
                  <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => filesApi.download(f.id, f.filename)}
                      >
                        ⬇ Descargar
                      </button>
                      {f.type !== 'EXPORT' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          disabled={importingId === f.id}
                          onClick={() => handleImport(f.id)}
                        >
                          {importingId === f.id ? 'Iniciando…' : '📥 Importar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="pagination" style={{ padding: '12px 0' }}>
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
        </div>
      )}
    </div>
  );
}
