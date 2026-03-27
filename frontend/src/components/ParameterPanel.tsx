import { useState } from 'react';
import { SliderControl } from './SliderControl';
import { ToggleControl } from './ToggleControl';
import { SeedInput } from './SeedInput';
import { useSynthesisStore } from '@/stores/synthesis';

export function ParameterPanel() {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { params, setParam, seedLocked, setSeedLocked } = useSynthesisStore();

  return (
    <>
      <section className="card card--refinement">
        <h3 className="card-label">Synthesis Parameters</h3>

        <SliderControl
          label="Temperature"
          tooltip="Controls randomness. Lower = more deterministic, higher = more creative."
          value={params.temperature}
          min={0.1} max={1.0} step={0.05}
          displayValue={params.temperature.toFixed(2)}
          onChange={(v) => setParam('temperature', v)}
        />
        <SliderControl
          label="Top P"
          tooltip="Nucleus sampling. Controls diversity of token selection."
          value={params.top_p}
          min={0.1} max={1.0} step={0.05}
          displayValue={params.top_p.toFixed(2)}
          onChange={(v) => setParam('top_p', v)}
        />
        <SliderControl
          label="Repetition Penalty"
          tooltip="Penalizes repeated tokens. Higher values reduce repetitive speech."
          value={params.repetition_penalty}
          min={0.9} max={2.0} step={0.05}
          displayValue={params.repetition_penalty.toFixed(2)}
          onChange={(v) => setParam('repetition_penalty', v)}
        />
        <SeedInput
          seed={params.seed}
          locked={seedLocked}
          onSeedChange={(seed) => setParam('seed', seed)}
          onLockedChange={setSeedLocked}
        />
      </section>

      <section className="card card--modifiers">
        <h3
          className="card-label"
          style={{ cursor: 'pointer' }}
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          Advanced Options {advancedOpen ? '\u25B2' : '\u25BC'}
        </h3>
        {advancedOpen && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <SliderControl
              label="Chunk Length"
              tooltip="Text chunk size for iterative generation. Higher = more coherent."
              value={params.chunk_length}
              min={100} max={300} step={10}
              onChange={(v) => setParam('chunk_length', v)}
            />
            <SliderControl
              label="Max New Tokens"
              tooltip="Maximum tokens generated. Higher = longer output, potentially lower quality."
              value={params.max_new_tokens}
              min={256} max={2048} step={64}
              onChange={(v) => setParam('max_new_tokens', v)}
            />
            <div className="modifiers-grid">
              <ToggleControl
                label="Normalize Text"
                tooltip="Normalize numbers and abbreviations for stability."
                checked={params.normalize}
                onChange={(v) => setParam('normalize', v)}
              />
              <ToggleControl
                label="Streaming"
                tooltip="Stream audio as it generates (WAV only)."
                checked={params.streaming}
                onChange={(v) => setParam('streaming', v)}
              />
              <ToggleControl
                label="Memory Cache"
                tooltip="Cache encoded reference audio for faster repeat synthesis."
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
    </>
  );
}
