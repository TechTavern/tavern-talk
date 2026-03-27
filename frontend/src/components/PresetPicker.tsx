import { useState, useEffect, useCallback } from 'react';
import { useSynthesisStore } from '@/stores/synthesis';
import { getPresets, savePresets } from '@/api/files';
import { useToast } from './Toast';
import { Tooltip } from './Tooltip';

export function PresetPicker() {
  const { presets, setPresets, loadPreset, savePreset, deletePreset } = useSynthesisStore();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');

  // Load presets from disk on mount
  useEffect(() => {
    getPresets().then(setPresets).catch(console.error);
  }, [setPresets]);

  // Persist to disk whenever presets change
  const persistPresets = useCallback(async (updated: Record<string, unknown>) => {
    try {
      await savePresets(updated as Record<string, import('@/api/types').SynthesisParams>);
    } catch (err) {
      console.warn('Failed to persist presets:', err);
    }
  }, []);

  const handleSave = async () => {
    const name = newName.trim();
    if (!name) {
      showToast('Enter a name for the preset.', 'error');
      return;
    }
    savePreset(name);
    const updated = { ...useSynthesisStore.getState().presets };
    await persistPresets(updated);
    showToast(`Preset "${name}" saved.`, 'success');
    setNewName('');
    setSaving(false);
  };

  const handleLoad = (name: string) => {
    loadPreset(name);
    showToast(`Loaded preset "${name}".`, 'success');
  };

  const handleDelete = async (name: string) => {
    deletePreset(name);
    const updated = { ...useSynthesisStore.getState().presets };
    await persistPresets(updated);
    showToast(`Deleted preset "${name}".`, 'success');
  };

  const presetNames = Object.keys(presets);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className="card-label" style={{ whiteSpace: 'nowrap' }}>
          Presets
          <Tooltip content="Save your current knob positions as a named preset. Load one to instantly apply those settings to any new script.">
            <span className="tooltip-trigger">
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M15 8A7 7 0 111 8a7 7 0 0114 0zM9 5a1 1 0 11-2 0 1 1 0 012 0zM7.5 7.5A.5.5 0 018 7h.5a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H8a.5.5 0 01-.5-.5v-3z" clipRule="evenodd" />
              </svg>
            </span>
          </Tooltip>
        </span>
        {presetNames.length > 0 && (
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
        )}
        <button
          type="button"
          className="btn btn--secondary"
          style={{ fontSize: 'var(--text-label)', whiteSpace: 'nowrap' }}
          onClick={() => setSaving(!saving)}
        >
          {saving ? 'Cancel' : '+ Save current'}
        </button>
      </div>

      {saving && (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Preset name, e.g. Warm Narrator"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
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

      {presetNames.length > 0 && (
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
      )}
    </div>
  );
}
