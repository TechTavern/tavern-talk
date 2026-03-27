import type { VoiceProfile } from '@/api/types';
import { getVoiceAudioUrl } from '@/api/files';

interface VoiceCardProps {
  voice: VoiceProfile;
  onEdit: (voice: VoiceProfile) => void;
  onDelete: (id: string) => void;
}

export function VoiceCard({ voice, onEdit, onDelete }: VoiceCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-title)', color: 'var(--on-surface)' }}>
            {voice.name}
          </h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--on-surface-muted)' }}>
            {voice.description}
          </p>
        </div>
        {voice.hasAudio && (
          <audio
            src={getVoiceAudioUrl(voice.id)}
            controls
            style={{ height: '30px', flexShrink: 0 }}
          />
        )}
      </div>
      {voice.tags.length > 0 && (
        <div className="voice-tags" style={{ justifyContent: 'flex-start' }}>
          {voice.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="btn btn--secondary" onClick={() => onEdit(voice)}>Edit</button>
        <button className="btn btn--ghost" onClick={() => onDelete(voice.id)}>Delete</button>
      </div>
    </div>
  );
}
