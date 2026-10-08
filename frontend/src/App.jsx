import { useCallback, useRef, useState } from 'react';
import { previewUrl } from './api.js';
import { useImageUpload } from './hooks/useImageUpload.js';
import './App.css';

function StatusLine({ item }) {
  const reasons =
    item.rejectionReasons?.map((r) => r.message).join(' ') || '';
  if (item.status === 'pending' || item.status === 'processing') {
    return <span className="status processing">Processing…</span>;
  }
  if (item.status === 'accepted') {
    return <span className="status ok">Accepted</span>;
  }
  return <span className="status bad">{reasons || 'Rejected'}</span>;
}

function ImageCard({ item }) {
  const showPreview =
    item.status === 'accepted' ||
    item.status === 'rejected' ||
    item.processedStorageKey;
  return (
    <li className="card">
      <div className="thumb">
        {showPreview ? (
          <img src={previewUrl(item.imageId)} alt="" />
        ) : (
          <div className="thumb-placeholder" />
        )}
      </div>
      <div className="card-body">
        <p className="filename">{item.originalFilename}</p>
        <StatusLine item={item} />
      </div>
    </li>
  );
}

export default function App() {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const {
    accepted,
    rejected,
    inProgress,
    uploading,
    clientErrors,
    uploadError,
    upload,
  } = useImageUpload();

  const onFiles = useCallback(
    (files) => {
      upload(files);
    },
    [upload],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  };

  return (
    <div className="page">
      <header className="header">
        <h1>Upload photos</h1>
        <p className="subtitle">
          PNG, JPG, or HEIC — at least 400×400px. Photos are checked for blur,
          faces, and duplicates.
        </p>
      </header>

      <div className="layout">
        <section className="panel">
          <div
            className={`dropzone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.heic,.heif,image/png,image/jpeg,image/heic"
              multiple
              hidden
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="btn primary"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Uploading…' : 'Choose photos'}
            </button>
            <p className="hint">or drag and drop here · up to 120MB each</p>
          </div>

          {(clientErrors.length > 0 || uploadError) && (
            <ul className="errors">
              {clientErrors.map((e) => (
                <li key={e.name}>
                  {e.name}: {e.reason}
                </li>
              ))}
              {uploadError && <li>{uploadError}</li>}
            </ul>
          )}

          {inProgress.length > 0 && (
            <div className="section">
              <h2>In progress</h2>
              <ul className="list">
                {inProgress.map((item) => (
                  <ImageCard key={item.imageId} item={item} />
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="panel side">
          <div className="counter">
            <span className="counter-num">{accepted.length}</span>
            <span className="counter-label">accepted</span>
          </div>

          <div className="section">
            <h2>Accepted</h2>
            {accepted.length === 0 ? (
              <p className="empty">No accepted photos yet.</p>
            ) : (
              <ul className="list">
                {accepted.map((item) => (
                  <ImageCard key={item.imageId} item={item} />
                ))}
              </ul>
            )}
          </div>

          <div className="section">
            <h2>Rejected</h2>
            {rejected.length === 0 ? (
              <p className="empty">No rejected photos.</p>
            ) : (
              <ul className="list">
                {rejected.map((item) => (
                  <ImageCard key={item.imageId} item={item} />
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
