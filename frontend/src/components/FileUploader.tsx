import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { filesApi, type UploadedFile } from '../api/files.api';
import Icon from './Icon';

interface FileUploaderProps {
  onUploaded: (file: UploadedFile) => void;
}

export default function FileUploader({ onUploaded }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setFilename(file.name);
    setUploading(true);
    setError('');
    setProgress(0);
    try {
      const uploaded = await filesApi.upload(file, setProgress);
      onUploaded(uploaded);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al subir el archivo';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  return (
    <div>
      <div
        className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-xl text-center transition-all ${
          dragging
            ? 'border-primary bg-surface-container-high'
            : 'border-outline-variant bg-surface-container hover:border-primary hover:bg-surface-container-high'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={onChange}
        />
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-highest">
          <Icon name="cloud_upload" className="text-primary" size={28} />
        </div>
        <h3 className="mb-1 text-headline-sm font-headline-sm font-medium text-on-surface">
          {uploading ? 'Subiendo…' : 'Arrastra un archivo aquí'}
        </h3>
        <p className="mb-5 max-w-[28rem] text-body-sm font-body-sm text-on-surface-variant">
          Formatos soportados: CSV, XLS, XLSX.
        </p>
        <button
          type="button"
          className="rounded border border-outline-variant bg-surface-variant px-5 py-2 text-body-sm font-body-sm font-medium text-on-surface transition-colors hover:border-primary"
        >
          Explorar archivos
        </button>
      </div>

      {uploading && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-body-sm font-body-sm text-on-surface-variant">
            <span className="font-code-md text-code-md">{filename}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded border border-error/30 bg-error/10 px-3 py-2 text-body-sm font-body-sm text-error">
          {error}
        </div>
      )}
    </div>
  );
}
