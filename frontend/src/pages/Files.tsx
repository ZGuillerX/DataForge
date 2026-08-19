import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { filesApi, type UploadedFile } from '../api/files.api';
import { foldersApi, type FolderRecord } from '../api/folders.api';
import { jobsApi } from '../api/jobs.api';
import FileUploader from '../components/FileUploader';
import Icon from '../components/Icon';
import ConfirmDialog from '../components/ConfirmDialog';

type FolderFilter = 'all' | 'none' | string;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Files() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [confirmingFile, setConfirmingFile] = useState<UploadedFile | null>(null);
  const [message, setMessage] = useState('');
  const limit = 15;

  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [activeFolder, setActiveFolder] = useState<FolderFilter>('all');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState('');
  const [confirmingDeleteFolder, setConfirmingDeleteFolder] = useState<FolderRecord | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);

  const loadFolders = async () => {
    try {
      const data = await foldersApi.list();
      setFolders(data);
    } catch {
      /* ignore */
    }
  };

  const load = async (p = page, folder = activeFolder) => {
    setLoading(true);
    try {
      const folderParam = folder === 'all' ? undefined : (folder as 'none' | string);
      const data = await filesApi.list(p, limit, folderParam);
      setFiles(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    load(page, activeFolder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeFolder]);

  const selectFolder = (folder: FolderFilter) => {
    setActiveFolder(folder);
    setPage(1);
  };

  const uploadFolderId = activeFolder === 'all' || activeFolder === 'none' ? null : activeFolder;

  const handleUploaded = (file: UploadedFile) => {
    setMessage(`✅ "${file.filename}" subido`);
    load(1, activeFolder);
    loadFolders();
    setTimeout(() => setMessage(''), 4000);
  };

  const confirmImport = async () => {
    if (!confirmingFile) return;
    const fileId = confirmingFile.id;
    setImportingId(fileId);
    try {
      const job = await jobsApi.createImport(fileId);
      setConfirmingFile(null);
      navigate(`/jobs/${job.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        e?.response?.data?.message ??
        (e?.message === 'Network Error'
          ? 'No se pudo conectar con el servidor'
          : 'Error al iniciar importación');
      setMessage(`❌ ${msg}`);
      setConfirmingFile(null);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setImportingId(null);
    }
  };

  const handleCreateFolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    setFolderError('');
    try {
      const folder = await foldersApi.create(newFolderName.trim());
      setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFolderName('');
      setShowNewFolder(false);
      setActiveFolder(folder.id);
      setPage(1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo crear la carpeta';
      setFolderError(msg);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!confirmingDeleteFolder) return;
    setDeletingFolder(true);
    try {
      await foldersApi.remove(confirmingDeleteFolder.id);
      setFolders((prev) => prev.filter((f) => f.id !== confirmingDeleteFolder.id));
      if (activeFolder === confirmingDeleteFolder.id) selectFolder('all');
      setConfirmingDeleteFolder(null);
    } catch {
      /* ignore */
    } finally {
      setDeletingFolder(false);
    }
  };

  const handleMoveFile = async (fileId: string, folderId: string) => {
    try {
      await filesApi.move(fileId, folderId || null);
      load(page, activeFolder);
      loadFolders();
    } catch {
      /* ignore */
    }
  };

  const totalPages = Math.ceil(total / limit);
  const activeFolderName =
    activeFolder === 'all'
      ? null
      : activeFolder === 'none'
        ? 'Sin carpeta'
        : (folders.find((f) => f.id === activeFolder)?.name ?? null);

  return (
    <>
      <div>
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Gestión de archivos
        </h2>
        <p className="mt-1 text-body-sm font-body-sm text-on-surface-variant">
          Sube, organizá en carpetas e importá tus datasets.
        </p>
      </div>

      {/* Folder bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-body-sm font-body-sm transition-colors ${
            activeFolder === 'all'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
          }`}
          onClick={() => selectFolder('all')}
        >
          <Icon name="apps" size={14} />
          Todos
        </button>
        <button
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-body-sm font-body-sm transition-colors ${
            activeFolder === 'none'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
          }`}
          onClick={() => selectFolder('none')}
        >
          <Icon name="folder_off" size={14} />
          Sin carpeta
        </button>
        {folders.map((f) => (
          <div key={f.id} className="group relative">
            <button
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-body-sm font-body-sm transition-colors ${
                activeFolder === f.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => selectFolder(f.id)}
            >
              <Icon name="folder" size={14} />
              {f.name}
              <span className="text-label-caps font-label-caps opacity-70">
                {f._count.files}
              </span>
            </button>
            <button
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-error text-on-error group-hover:flex"
              title="Eliminar carpeta"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDeleteFolder(f);
              }}
            >
              <Icon name="close" size={10} />
            </button>
          </div>
        ))}

        {showNewFolder ? (
          <form onSubmit={handleCreateFolder} className="flex items-center gap-1.5">
            <input
              autoFocus
              className="rounded-full border border-outline-variant bg-background px-3 py-1.5 text-body-sm font-body-sm text-on-surface focus:border-primary focus:outline-none"
              placeholder="Nombre de la carpeta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              maxLength={60}
            />
            <button
              type="submit"
              disabled={creatingFolder}
              className="rounded-full bg-primary px-3 py-1.5 text-body-sm font-body-sm font-medium text-on-primary disabled:opacity-50"
            >
              Crear
            </button>
            <button
              type="button"
              className="text-body-sm font-body-sm text-on-surface-variant hover:text-on-surface"
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName('');
                setFolderError('');
              }}
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            className="flex items-center gap-1.5 rounded-full border border-dashed border-outline-variant px-3 py-1.5 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            onClick={() => setShowNewFolder(true)}
          >
            <Icon name="create_new_folder" size={14} />
            Nueva carpeta
          </button>
        )}
      </div>
      {folderError && (
        <div className="rounded border border-error/30 bg-error/10 px-3 py-2 text-body-sm font-body-sm text-error">
          {folderError}
        </div>
      )}

      <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
        <div className="mb-4 flex items-center justify-between text-label-caps font-label-caps text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Icon name="upload_file" size={16} />
            Subir nuevo archivo
          </div>
          <span>
            Se guarda en:{' '}
            <span className="text-on-surface">{activeFolderName ?? 'Sin carpeta'}</span>
          </span>
        </div>
        <FileUploader onUploaded={handleUploaded} folderId={uploadFolderId} />
        {message && (
          <div className="mt-3 text-body-sm font-body-sm text-on-surface-variant">{message}</div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low p-4">
          <h3 className="text-headline-sm font-headline-sm font-medium text-on-surface">
            {activeFolderName ? `Carpeta: ${activeFolderName}` : 'Historial de subidas'}
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
                      Carpeta
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
                        <select
                          className="rounded border border-outline-variant bg-background px-2 py-1 text-body-sm font-body-sm text-on-surface focus:border-primary focus:outline-none"
                          value={f.folderId ?? ''}
                          onChange={(e) => handleMoveFile(f.id, e.target.value)}
                        >
                          <option value="">Sin carpeta</option>
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
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
                              onClick={() => setConfirmingFile(f)}
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

      {confirmingFile && (
        <ConfirmDialog
          title="Confirmar importación"
          message={`Se va a crear un trabajo de importación para "${confirmingFile.filename}". Vas a ver el progreso en la pantalla del trabajo.`}
          confirmLabel="Importar"
          loading={importingId === confirmingFile.id}
          onConfirm={confirmImport}
          onCancel={() => setConfirmingFile(null)}
        />
      )}

      {confirmingDeleteFolder && (
        <ConfirmDialog
          title="Eliminar carpeta"
          message={`Se va a eliminar la carpeta "${confirmingDeleteFolder.name}". Los ${confirmingDeleteFolder._count.files} archivo(s) que contiene no se borran, quedan sin carpeta.`}
          confirmLabel="Eliminar"
          danger
          loading={deletingFolder}
          onConfirm={handleDeleteFolder}
          onCancel={() => setConfirmingDeleteFolder(null)}
        />
      )}
    </>
  );
}
