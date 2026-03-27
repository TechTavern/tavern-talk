import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listVoices } from '@/api/files';
import { useSynthesisStore } from '@/stores/synthesis';
import type { VoiceProfile } from '@/api/types';

export function VoiceSelector() {
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const { activeVoice, setActiveVoice } = useSynthesisStore();

  useEffect(() => {
    listVoices().then(setVoices).catch(console.error);
  }, []);

  return (
    <section className="card card--voice">
      <div className="voice-avatar">
        <svg viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="38" fill="var(--surface-highest)" />
          <circle cx="40" cy="32" r="12" fill="var(--outline-variant)" />
          <path d="M20 64 Q40 48 60 64" fill="var(--outline-variant)" />
        </svg>
      </div>
      <div className="voice-info">
        <h3 className="voice-name">{activeVoice?.name || 'Default Voice'}</h3>
        <p className="voice-desc">
          {activeVoice?.description || 'No reference audio — uses model default'}
        </p>
        {activeVoice?.tags && activeVoice.tags.length > 0 && (
          <div className="voice-tags">
            {activeVoice.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <select
        value={activeVoice?.id || ''}
        onChange={(e) => {
          const voice = voices.find((v) => v.id === e.target.value) || null;
          setActiveVoice(voice);
        }}
        style={{
          width: '100%',
          background: 'var(--secondary-container)',
          color: 'var(--on-secondary-container)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <option value="">Default Voice (no reference)</option>
        {voices.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>
      <Link to="/voices" className="btn btn--ghost" style={{ fontSize: 'var(--text-label)' }}>
        Manage voice profiles &rarr;
      </Link>
    </section>
  );
}
