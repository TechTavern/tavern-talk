import { useState } from 'react';
import { SliderControl } from './SliderControl';
import { ToggleControl } from './ToggleControl';
import { SeedInput } from './SeedInput';
import { useSynthesisStore } from '@/stores/synthesis';

type Tab = 'parameters' | 'advanced';

export function ParameterPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('parameters');
  const { params, setParam, seedLocked, setSeedLocked } = useSynthesisStore();

  return (
    <section className="card">
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('parameters')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 'var(--text-body)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: activeTab === 'parameters' ? 'var(--tertiary)' : 'var(--on-surface-muted)',
            paddingBottom: 'var(--space-2)',
            position: 'relative',
          }}
        >
          Parameters
          {activeTab === 'parameters' && (
            <span style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              height: '4px',
              background: 'var(--tertiary)',
              borderRadius: 'var(--radius-full)',
              filter: 'blur(4px)',
            }} />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 'var(--text-body)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: activeTab === 'advanced' ? 'var(--tertiary)' : 'var(--on-surface-muted)',
            paddingBottom: 'var(--space-2)',
            position: 'relative',
          }}
        >
          Advanced
          {activeTab === 'advanced' && (
            <span style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              height: '4px',
              background: 'var(--tertiary)',
              borderRadius: 'var(--radius-full)',
              filter: 'blur(4px)',
            }} />
          )}
        </button>
      </div>

      {/* Parameters tab */}
      {activeTab === 'parameters' && (
        <div>
          <SliderControl
            label="Temperature"
            tooltip="How much the voice improvises. Low keeps it steady and predictable. High adds variation and expressiveness."
            value={params.temperature}
            min={0.1} max={1.0} step={0.05}
            displayValue={params.temperature.toFixed(2)}
            onChange={(v) => setParam('temperature', v)}
          />
          <SliderControl
            label="Top P"
            tooltip="How many word choices the model considers. Low stays safe and consistent. High explores more unusual phrasing."
            value={params.top_p}
            min={0.1} max={1.0} step={0.05}
            displayValue={params.top_p.toFixed(2)}
            onChange={(v) => setParam('top_p', v)}
          />
          <SliderControl
            label="Repetition Penalty"
            tooltip="Prevents the voice from getting stuck repeating sounds. Turn it up if you hear stuttering or loops."
            value={params.repetition_penalty}
            min={0.9} max={1.99} step={0.01}
            displayValue={params.repetition_penalty.toFixed(2)}
            onChange={(v) => setParam('repetition_penalty', v)}
          />
          <SeedInput
            seed={params.seed}
            locked={seedLocked}
            onSeedChange={(seed) => setParam('seed', seed)}
            onLockedChange={setSeedLocked}
          />
        </div>
      )}

      {/* Advanced tab */}
      {activeTab === 'advanced' && (
        <div>
          <SliderControl
            label="Chunk Length"
            tooltip="How much text is processed at once. Bigger chunks sound more natural but take slightly longer."
            value={params.chunk_length}
            min={100} max={300} step={10}
            onChange={(v) => setParam('chunk_length', v)}
          />
          <SliderControl
            label="Max New Tokens"
            tooltip="Limits how long the audio can be. Increase for longer scripts, but very high values may reduce quality."
            value={params.max_new_tokens}
            min={256} max={2048} step={64}
            onChange={(v) => setParam('max_new_tokens', v)}
          />
          <div className="modifiers-grid" style={{ marginTop: 'var(--space-3)' }}>
            <ToggleControl
              label="Normalize Text"
              tooltip="Converts numbers and abbreviations into spoken words (e.g. '3pm' becomes 'three PM'). Keeps the voice from stumbling."
              checked={params.normalize}
              onChange={(v) => setParam('normalize', v)}
            />
            <ToggleControl
              label="Streaming"
              tooltip="Start playing audio before the full clip is finished. Faster feedback, but only works with WAV format."
              checked={params.streaming}
              onChange={(v) => setParam('streaming', v)}
            />
            <ToggleControl
              label="Memory Cache"
              tooltip="Remembers your voice profile between generations so the next one starts faster."
              checked={params.use_memory_cache === 'on'}
              onChange={(v) => setParam('use_memory_cache', v ? 'on' : 'off')}
            />
          </div>
          <div style={{ marginTop: 'var(--space-3)' }}>
            <label className="slider-label">Output Format</label>
            <select
              value={params.format}
              onChange={(e) => setParam('format', e.target.value as 'wav' | 'mp3')}
              style={{
                background: 'var(--surface-highest)',
                color: 'var(--on-surface)',
                border: '2px solid transparent',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2) var(--space-3)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-body)',
                marginTop: 'var(--space-2)',
              }}
            >
              <option value="wav">WAV</option>
              <option value="mp3">MP3</option>
            </select>
          </div>
        </div>
      )}
    </section>
  );
}
