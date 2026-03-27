import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '@/api/files';
import { healthCheck } from '@/api/tts';
import { useToast } from '@/components/Toast';
import { SliderControl } from '@/components/SliderControl';
import type { AppSettings, SynthesisParams } from '@/api/types';
import { DEFAULT_SETTINGS, DEFAULT_PARAMS } from '@/api/types';

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [health, setHealth] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    getSettings()
      .then((s) => { if (s) setSettings(s); })
      .catch(console.error);
  }, []);

  const setDefaultParam = <K extends keyof SynthesisParams>(key: K, value: SynthesisParams[K]) => {
    setSettings((prev) => ({
      ...prev,
      defaultParams: { ...prev.defaultParams, [key]: value },
    }));
  };

  const handleSave = async () => {
    try {
      await saveSettings(settings);
      showToast('Settings saved.', 'success');
    } catch (err) {
      showToast(`Failed to save: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    showToast('Settings reset to defaults.', 'success');
  };

  const handleHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const result = await healthCheck();
      setHealth(result.status);
      showToast(`API status: ${result.status}`, 'success');
    } catch (err) {
      setHealth('error');
      showToast(`Health check failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setHealthLoading(false);
    }
  };

  const p = settings.defaultParams;

  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Settings</h1>
        <p className="hero-sub">Configure your default alchemical parameters.</p>
      </header>

      <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <section className="card">
          <h3 className="card-label">API Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            <button className="btn btn--secondary" onClick={handleHealthCheck} disabled={healthLoading}>
              {healthLoading ? 'Checking...' : 'Check API Health'}
            </button>
            {health && (
              <span style={{ color: health === 'ok' ? '#4ade80' : '#ef4444', fontWeight: 600 }}>
                {health === 'ok' ? 'Connected' : 'Error'}
              </span>
            )}
          </div>
        </section>

        <section className="card">
          <h3 className="card-label">Default Synthesis Parameters</h3>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <SliderControl label="Temperature" value={p.temperature} min={0.1} max={1.0} step={0.05} displayValue={p.temperature.toFixed(2)} onChange={(v) => setDefaultParam('temperature', v)} />
            <SliderControl label="Top P" value={p.top_p} min={0.1} max={1.0} step={0.05} displayValue={p.top_p.toFixed(2)} onChange={(v) => setDefaultParam('top_p', v)} />
            <SliderControl label="Repetition Penalty" value={p.repetition_penalty} min={0.9} max={2.0} step={0.05} displayValue={p.repetition_penalty.toFixed(2)} onChange={(v) => setDefaultParam('repetition_penalty', v)} />
            <SliderControl label="Chunk Length" value={p.chunk_length} min={100} max={300} step={10} onChange={(v) => setDefaultParam('chunk_length', v)} />
            <SliderControl label="Max New Tokens" value={p.max_new_tokens} min={256} max={2048} step={64} onChange={(v) => setDefaultParam('max_new_tokens', v)} />

            <div style={{ marginTop: 'var(--space-3)' }}>
              <label className="slider-label">Default Output Format</label>
              <select
                value={settings.defaultFormat}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultFormat: e.target.value as 'wav' | 'mp3' }))}
                style={{
                  background: 'var(--surface-highest)', color: 'var(--on-surface)',
                  border: '2px solid transparent', borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-body)', marginTop: 'var(--space-2)',
                }}
              >
                <option value="wav">WAV</option>
                <option value="mp3">MP3</option>
              </select>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn--primary" onClick={handleSave}>Save Settings</button>
          <button className="btn btn--ghost" onClick={handleReset}>Reset to Defaults</button>
        </div>
      </div>
    </>
  );
}
