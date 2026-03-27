import { useState } from 'react';
import { getHistoryAudioUrl } from '@/api/files';
import type { HistoryRecord } from '@/api/types';

interface HistoryRowProps {
  record: HistoryRecord;
  onUseSettings: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
}

export function HistoryRow({ record, onUseSettings, onDelete }: HistoryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const textPreview = record.text.length > 80 ? record.text.slice(0, 80) + '...' : record.text;
  const date = new Date(record.timestamp);
  const timeStr = date.toLocaleString();

  return (
    <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-label)', color: 'var(--on-surface-muted)' }}>{timeStr}</span>
            <span className="tag">{record.voice}</span>
            <span style={{ fontSize: 'var(--text-label)', color: 'var(--on-surface-muted)' }}>
              {(record.file_size_bytes / 1024).toFixed(0)} KB
            </span>
          </div>
          <p style={{ color: 'var(--on-surface)', fontSize: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap' }}>
            {expanded ? record.text : textPreview}
          </p>
        </div>
        <span style={{ color: 'var(--on-surface-muted)', marginLeft: 'var(--space-3)' }}>
          {expanded ? '\u25B2' : '\u25BC'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <audio src={getHistoryAudioUrl(record.id)} controls style={{ width: '100%', marginBottom: 'var(--space-3)' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            {Object.entries(record.params)
              .filter(([, v]) => v !== null)
              .map(([key, value]) => (
                <span key={key} className="tag" style={{ fontSize: 'var(--text-label)' }}>
                  {key}: {String(value)}
                </span>
              ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn--secondary" onClick={() => onUseSettings(record)}>
              Use these settings
            </button>
            <button className="btn btn--ghost" onClick={() => onDelete(record.id)}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
