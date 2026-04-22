import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { filesApi, type UploadedFile } from '../api/files.api';
import '../styles/auth.css';

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
        className={`file-drop-zone${dragging ? ' dragging' : ''}`}
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
          accept=".csv,.json"
          style={{ display: 'none' }}
          onChange={onChange}
        />
        <div className="file-drop-icon">📂</div>
        <div className="file-drop-text">
          {uploading ? 'Subiendo…' : 'Arrastra un archivo CSV o JSON aquí'}
        </div>
        <div className="file-drop-hint">o haz clic para explorar</div>
      </div>

      {uploading && (
        <div className="upload-progress">
          <div className="upload-filename">
            <span>{filename}</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="auth-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
    </div>
  );
}
