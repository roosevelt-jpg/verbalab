'use client';

import { useState } from 'react';
import type { CmsMedia } from '@/data/cms-types';

type Props = {
  label: string;
  value?: CmsMedia;
  onChange: (media: CmsMedia | undefined) => void;
  uploadLabel?: string;
  onUploaded?: () => void;
};

/** Upload image/video for CMS text+media cards. Empty / loading / error covered. */
export function CmsMediaField({ label, value, onChange, uploadLabel, onUploaded }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function upload(file: File, slot: 'image' | 'video') {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (slot === 'image' && !file.type.startsWith('image/')) {
        throw new Error('Choose an image file (PNG, JPEG, WebP, GIF).');
      }
      if (slot === 'video' && !file.type.startsWith('video/')) {
        throw new Error('Choose a video file (MP4, WebM).');
      }
      if (file.size > 40 * 1024 * 1024) {
        throw new Error('File must be under 40 MB.');
      }
      const form = new FormData();
      form.set('file', file);
      form.set('label', uploadLabel ?? label);
      form.set('alt', value?.alt ?? label);
      const res = await fetch('/api/cms/media', { method: 'POST', body: form });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        kind?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(body?.error?.message ?? `Upload failed (${res.status})`);
      }
      if (!body.url) throw new Error('Upload returned no URL');
      const next: CmsMedia = {
        ...value,
        ...(slot === 'video' ? { videoUrl: body.url } : { imageUrl: body.url }),
      };
      onChange(next);
      setStatus(`Uploaded ${body.url}`);
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  const hasMedia = Boolean(value?.imageUrl || value?.videoUrl);

  return (
    <div
      style={{
        display: 'grid',
        gap: '0.55rem',
        padding: '0.75rem',
        border: '1px solid rgba(16,38,77,0.1)',
        borderRadius: 10,
        background: 'var(--surface-muted, #f4f8fa)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)' }}>{label}</span>
        {busy ? (
          <span style={{ fontSize: '0.78rem', color: 'var(--action-primary)', fontWeight: 600 }}>
            Uploading…
          </span>
        ) : null}
      </div>

      {!hasMedia && !busy ? (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>
          No media yet — upload an image or video for this card.
        </p>
      ) : null}

      {hasMedia ? (
        <div
          style={{
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid rgba(16,38,77,0.08)',
            background: '#0b1426',
            maxHeight: 160,
          }}
        >
          {value?.videoUrl ? (
            <video
              src={value.videoUrl}
              controls
              playsInline
              style={{ display: 'block', width: '100%', maxHeight: 160, objectFit: 'cover' }}
            />
          ) : value?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.imageUrl}
              alt={value.alt ?? label}
              style={{ display: 'block', width: '100%', maxHeight: 160, objectFit: 'cover' }}
            />
          ) : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
        <label
          className="vl-btn vl-btn-secondary"
          style={{
            display: 'inline-flex',
            cursor: busy ? 'wait' : 'pointer',
            minHeight: 36,
            padding: '0.35rem 0.75rem',
            opacity: busy ? 0.6 : 1,
          }}
        >
          Upload image
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file, 'image');
              e.target.value = '';
            }}
          />
        </label>
        <label
          className="vl-btn vl-btn-secondary"
          style={{
            display: 'inline-flex',
            cursor: busy ? 'wait' : 'pointer',
            minHeight: 36,
            padding: '0.35rem 0.75rem',
            opacity: busy ? 0.6 : 1,
          }}
        >
          Upload video
          <input
            type="file"
            accept="video/*"
            hidden
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file, 'video');
              e.target.value = '';
            }}
          />
        </label>
        {hasMedia ? (
          <button
            type="button"
            className="vl-btn"
            style={{ minHeight: 36, padding: '0.35rem 0.75rem' }}
            disabled={busy}
            onClick={() => {
              onChange(undefined);
              setStatus('Media cleared');
              setError(null);
            }}
          >
            Clear media
          </button>
        ) : null}
      </div>

      <label style={{ display: 'grid', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Alt text</span>
        <input
          className="vl-input"
          value={value?.alt ?? ''}
          placeholder="Describe the media"
          onChange={(e) =>
            onChange({
              ...value,
              alt: e.target.value || undefined,
              imageUrl: value?.imageUrl,
              videoUrl: value?.videoUrl,
            })
          }
        />
      </label>

      <details>
        <summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: 'var(--muted)' }}>
          Advanced URL fields
        </summary>
        <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.45rem' }}>
          <input
            className="vl-input"
            placeholder="Image URL"
            value={value?.imageUrl ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                imageUrl: e.target.value || undefined,
                videoUrl: value?.videoUrl,
                alt: value?.alt,
              })
            }
          />
          <input
            className="vl-input"
            placeholder="Video URL"
            value={value?.videoUrl ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                videoUrl: e.target.value || undefined,
                imageUrl: value?.imageUrl,
                alt: value?.alt,
              })
            }
          />
        </div>
      </details>

      {error ? (
        <p style={{ margin: 0, color: 'var(--bad)', fontSize: '0.82rem' }} role="alert">
          {error}
        </p>
      ) : null}
      {status && !error ? (
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.78rem' }}>{status}</p>
      ) : null}
    </div>
  );
}
