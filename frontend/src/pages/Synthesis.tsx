import { useSynthesisStore } from '@/stores/synthesis';
import { useSynthesis } from '@/hooks/useSynthesis';
import { ParameterPanel } from '@/components/ParameterPanel';
import { VoiceSelector } from '@/components/VoiceSelector';
import { AudioPlayer } from '@/components/AudioPlayer';
import type { SynthesisParams } from '@/api/types';

function SettingsSnapshot({ params }: { params: SynthesisParams }) {
  const entries = Object.entries(params).filter(([, v]) => v !== null);
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-2)',
      marginTop: 'var(--space-3)',
    }}>
      {entries.map(([key, value]) => (
        <span key={key} className="tag" style={{ fontSize: 'var(--text-label)' }}>
          {key}: {String(value)}
        </span>
      ))}
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
        </div>

        <div className="col-right">
          <AudioPlayer url={lastAudioUrl} autoPlay />

          {lastParams && <SettingsSnapshot params={lastParams} />}

          <button
            className={`btn btn--cta${isGenerating ? ' is-loading' : ''}`}
            onClick={generate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Synthesizing\u2026' : 'Begin Synthesis'}
          </button>

          <VoiceSelector />
        </div>
      </div>
    </>
  );
}
