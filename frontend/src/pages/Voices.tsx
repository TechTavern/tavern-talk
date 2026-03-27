import { useState, useEffect, useCallback } from 'react';
import { listVoices, saveVoice, deleteVoice } from '@/api/files';
import { transcribeAudio } from '@/api/asr';
import { useToast } from '@/components/Toast';
import { VoiceCard } from '@/components/VoiceCard';
import type { VoiceProfile } from '@/api/types';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function Voices() {
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [editing, setEditing] = useState<VoiceProfile | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const { showToast } = useToast();

  const refresh = useCallback(() => {
    listVoices().then(setVoices).catch(console.error);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const startNew = () => {
    setEditing(null);
    setIsNew(true);
    setName('');
    setDescription('');
    setTags('');
    setTranscript('');
    setAudioFile(null);
  };

  const startEdit = (voice: VoiceProfile) => {
    setEditing(voice);
    setIsNew(false);
    setName(voice.name);
    setDescription(voice.description);
    setTags(voice.tags.join(', '));
    setTranscript(voice.transcript);
    setAudioFile(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Voice name is required.', 'error');
      return;
    }
    const id = editing?.id || slugify(name);
    try {
      await saveVoice(id, {
        name: name.trim(),
        description: description.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        transcript: transcript.trim(),
      }, audioFile || undefined);
      showToast(`Voice "${name}" saved.`, 'success');
      setEditing(null);
      setIsNew(false);
      refresh();
    } catch (err) {
      showToast(`Failed to save: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVoice(id);
      showToast('Voice deleted.', 'success');
      refresh();
    } catch (err) {
      showToast(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) {
      showToast('Upload an audio file first.', 'error');
      return;
    }
    setIsTranscribing(true);
    try {
      const text = await transcribeAudio(audioFile);
      setTranscript(text);
      showToast('Transcription complete!', 'success');
    } catch (err) {
      showToast(`Transcription failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsTranscribing(false);
    }
  };

  const showForm = isNew || editing !== null;

  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Voice Profiles</h1>
        <p className="hero-sub">Upload reference audio to clone voices for your alchemical experiments.</p>
      </header>

      {!showForm && (
        <>
          <button className="btn btn--primary" onClick={startNew} style={{ marginBottom: 'var(--space-6)' }}>
            + New Voice Profile
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            {voices.map((v) => (
              <VoiceCard key={v.id} voice={v} onEdit={startEdit} onDelete={handleDelete} />
            ))}
            {voices.length === 0 && (
              <p style={{ color: 'var(--on-surface-muted)' }}>No voice profiles yet. Create one to get started.</p>
            )}
          </div>
        </>
      )}

      {showForm && (
        <section className="card" style={{ maxWidth: '600px' }}>
          <h3 className="card-label">{isNew ? 'New Voice Profile' : `Edit: ${editing?.name}`}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            <div>
              <label className="slider-label">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lyra Nocturne"
                className="script-textarea"
                style={{ minHeight: 'auto', padding: 'var(--space-2) var(--space-3)' }}
              />
            </div>
            <div>
              <label className="slider-label">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Deep & sultry narrator"
                className="script-textarea"
                style={{ minHeight: 'auto', padding: 'var(--space-2) var(--space-3)' }}
              />
            </div>
            <div>
              <label className="slider-label">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. narrative, mystery, dark"
                className="script-textarea"
                style={{ minHeight: 'auto', padding: 'var(--space-2) var(--space-3)' }}
              />
            </div>
            <div>
              <label className="slider-label">Reference Audio (WAV/MP3/FLAC, max 30s)</label>
              <input
                type="file"
                accept=".wav,.mp3,.flac,audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--space-2)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="slider-label">Transcript</label>
                <button
                  className="btn btn--secondary"
                  onClick={handleTranscribe}
                  disabled={!audioFile || isTranscribing}
                  style={{ fontSize: 'var(--text-label)' }}
                >
                  {isTranscribing ? 'Transcribing...' : 'Auto-transcribe'}
                </button>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Text spoken in the reference audio..."
                className="script-textarea"
                style={{ minHeight: '80px', marginTop: 'var(--space-2)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn btn--primary" onClick={handleSave}>Save</button>
              <button className="btn btn--ghost" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
