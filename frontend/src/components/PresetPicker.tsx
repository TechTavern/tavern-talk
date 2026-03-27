import { useEffect, useCallback } from 'react';
import { useSynthesisStore } from '@/stores/synthesis';
import { getPresets, savePresets } from '@/api/files';
import { useToast } from './Toast';
import { Tooltip } from './Tooltip';

export function usePresetsPersistence() {
  const { setPresets } = useSynthesisStore();

  useEffect(() => {
    getPresets().then(setPresets).catch(console.error);
  }, [setPresets]);
}

export async function persistAndSavePreset(name: string, params?: import('@/api/types').SynthesisParams) {
  const store = useSynthesisStore.getState();
  if (params) {
    // Save specific params (e.g. from lastParams after generation)
    useSynthesisStore.setState((state) => ({
      presets: { ...state.presets, [name]: { ...params } },
    }));
  } else {
    store.savePreset(name);
  }
  const updated = { ...useSynthesisStore.getState().presets };
  await savePresets(updated);
}

export async function persistAndDeletePreset(name: string) {
  const store = useSynthesisStore.getState();
  store.deletePreset(name);
  const updated = { ...useSynthesisStore.getState().presets };
  await savePresets(updated);
}

export function PresetPicker() {
  const { presets, loadPreset } = useSynthesisStore();
  const { showToast } = useToast();

  usePresetsPersistence();

  const handleLoad = (name: string) => {
    loadPreset(name);
    showToast(`Loaded preset "${name}".`, 'success');
  };

  const handleDelete = useCallback(async (name: string) => {
    await persistAndDeletePreset(name);
    showToast(`Deleted preset "${name}".`, 'success');
  }, [showToast]);

  const presetNames = Object.keys(presets);

  if (presetNames.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className="card-label" style={{ whiteSpace: 'nowrap' }}>
          Presets
          <Tooltip content="Saved parameter settings. Load one to instantly apply those knob positions.">
            <span className="tooltip-trigger">
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M15 8A7 7 0 111 8a7 7 0 0114 0zM9 5a1 1 0 11-2 0 1 1 0 012 0zM7.5 7.5A.5.5 0 018 7h.5a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H8a.5.5 0 01-.5-.5v-3z" clipRule="evenodd" />
              </svg>
            </span>
          </Tooltip>
        </span>
        <select
          value=""
          onChange={(e) => { if (e.target.value) handleLoad(e.target.value); }}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--surface-highest)',
            color: 'var(--on-surface)',
            border: '2px solid transparent',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-1) var(--space-2)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-body)',
          }}
        >
          <option value="">Load a preset...</option>
          {presetNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {presetNames.map((name) => (
          <span key={name} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            {name}
            <button
              type="button"
              onClick={() => handleDelete(name)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--on-surface-muted)',
                cursor: 'pointer',
                padding: 0,
                fontSize: 'var(--text-label)',
                lineHeight: 1,
              }}
              title="Delete preset"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
