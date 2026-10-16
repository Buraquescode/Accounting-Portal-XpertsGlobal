import { useEffect, useRef, useState } from 'react';
import { formatFileSize } from '../../utils/formatters';
import '../../styles/request-form.css';

const ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf';
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 5 * 1024 * 1024;

// Client checks are for UX only; the server re-validates type, size and magic bytes.
export function checkFile(file) {
  if (!ALLOWED.includes(file.type)) return 'Only JPG, PNG, WEBP or PDF files are allowed.';
  if (file.size > MAX_BYTES) return 'File is larger than 5 MB.';
  return null;
}

export default function FileDropzone({ file, onChange, error, label = 'Receipt / Invoice / Bill' }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) { setPreview(null); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f) => {
    if (!f) return;
    const problem = checkFile(f);
    setLocalError(problem);
    onChange(problem ? null : f);
  };
  const remove = (e) => { e.stopPropagation(); setLocalError(null); onChange(null); if (inputRef.current) inputRef.current.value = ''; };
  const open = () => inputRef.current?.click();
  const shown = localError || error;

  return (
    <div className={`field${shown ? ' field--error' : ''}`}>
      <span className="field__label" id="dz-label">{label}</span>
      <div
        className={`dropzone${over ? ' dropzone--over' : ''}${shown ? ' dropzone--error' : ''}`}
        role="button" tabIndex={0} aria-labelledby="dz-label"
        onClick={open}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
      >
        <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0])} />
        {file ? (
          <div className="dropzone__file">
            {preview ? <img className="dropzone__thumb" src={preview} alt="Preview of the selected receipt" /> : <span className="dropzone__icon" aria-hidden="true">PDF</span>}
            <div className="dropzone__meta">
              <div className="dropzone__name">{file.name}</div>
              <div className="dropzone__hint">{formatFileSize(file.size)}</div>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={remove} aria-label={`Remove ${file.name}`}>Remove</button>
          </div>
        ) : (
          <>
            <strong>Drag and drop a file here, or click to browse</strong>
            <p className="dropzone__hint">JPG, PNG, WEBP or PDF, up to 5 MB</p>
          </>
        )}
      </div>
      {shown && <span className="field__error" role="alert">{shown}</span>}
    </div>
  );
}
