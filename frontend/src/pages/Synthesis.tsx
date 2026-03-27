import { useState } from 'react';
import { useSynthesisStore } from '@/stores/synthesis';
import { useSynthesis } from '@/hooks/useSynthesis';
import { ParameterPanel } from '@/components/ParameterPanel';
import { PresetPicker, persistAndSavePreset } from '@/components/PresetPicker';
import { VoiceSelector } from '@/components/VoiceSelector';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useToast } from '@/components/Toast';
import { Tooltip } from '@/components/Tooltip';
import { IconDeviceFloppy, IconBrandHipchat } from '@tabler/icons-react';
import type { SynthesisParams } from '@/api/types';

function SettingsSnapshot({ params }: { params: SynthesisParams }) {
  const [saving, setSaving] = useState(false);
  const [presetName, setPresetName] = useState('');
  const { showToast } = useToast();
  const entries = Object.entries(params).filter(([, v]) => v !== null);

  const handleSave = async () => {
    const name = presetName.trim();
    if (!name) {
      showToast('Enter a name for the preset.', 'error');
      return;
    }
    await persistAndSavePreset(name);
    showToast(`Preset "${name}" saved.`, 'success');
    setPresetName('');
    setSaving(false);
  };

  return (
    <div style={{ marginTop: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
        {entries.map(([key, value]) => (
          <span key={key} className="tag" style={{ fontSize: 'var(--text-label)' }}>
            {key}: {String(value)}
          </span>
        ))}
        <Tooltip content="Save these settings as a reusable preset">
          <button
            type="button"
            onClick={() => setSaving(!saving)}
            className="btn btn--ghost"
            style={{ padding: 'var(--space-1)', color: 'var(--on-surface-muted)' }}
          >
            <IconDeviceFloppy size={16} stroke={1.5} />
          </button>
        </Tooltip>
      </div>
      {saving && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name, e.g. Warm Narrator"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            autoFocus
            style={{
              flex: 1,
              background: 'var(--surface-highest)',
              border: '2px solid transparent',
              borderRadius: 'var(--radius-md)',
              color: 'var(--on-surface)',
              padding: 'var(--space-1) var(--space-2)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-body)',
            }}
          />
          <button type="button" className="btn btn--primary" style={{ fontSize: 'var(--text-label)' }} onClick={handleSave}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}

export function Synthesis() {
  const { text, setText, isGenerating, lastAudioUrl, lastParams } = useSynthesisStore();
  const { generate } = useSynthesis();

  const charCount = text.length;

  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Voice Synthesis</h1>
        <p className="hero-sub">Transmute your script into atmospheric audio using our refined alchemical models.</p>
      </header>

      <div className="content-grid">
        <div className="col-left">
          <section className="card card--input">
            <div className="card-header">
              <span className="card-label">Input Script</span>
              <span className="char-count">{charCount} / 5000 characters</span>
            </div>
            <textarea
              className="script-textarea"
              placeholder="Type or paste your arcane monologue here..."
              maxLength={5000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  generate();
                }
              }}
            />
            <div className="card-actions">
              <button className="btn btn--ghost" onClick={() => setText('')}>
                Clear
              </button>
            </div>
          </section>

          <ParameterPanel />

          <PresetPicker />
        </div>

        <div className="col-right">
          <AudioPlayer url={lastAudioUrl} autoPlay />

          {lastParams && <SettingsSnapshot params={lastParams} />}

          <button
            className={`btn btn--cta${isGenerating ? ' is-loading' : ''}`}
            onClick={generate}
            disabled={isGenerating}
          >
            <IconBrandHipchat size={20} stroke={1.5} />
            {isGenerating ? 'Generating\u2026' : 'Generate Audio'}
          </button>

          <VoiceSelector />
        </div>
      </div>
    </>
  );
}
