interface SeedInputProps {
  seed: number | null;
  locked: boolean;
  onSeedChange: (seed: number | null) => void;
  onLockedChange: (locked: boolean) => void;
}

export function SeedInput({ seed, locked, onSeedChange, onLockedChange }: SeedInputProps) {
  const randomize = () => {
    onSeedChange(Math.floor(Math.random() * 2147483647));
  };

  return (
    <div className="slider-group">
      <div className="slider-row">
        <label className="slider-label" title="Set a seed for reproducible output. Lock to reuse across generations.">
          Seed &#9432;
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input
            type="number"
            value={seed ?? ''}
            placeholder="Random"
            onChange={(e) => onSeedChange(e.target.value ? parseInt(e.target.value, 10) : null)}
            style={{
              width: '90px',
              background: 'var(--surface-highest)',
              border: '2px solid transparent',
              borderRadius: 'var(--radius-md)',
              color: 'var(--on-surface)',
              padding: 'var(--space-1) var(--space-2)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-body)',
            }}
          />
          <button
            type="button"
            onClick={randomize}
            title="Randomize seed"
            className="btn btn--ghost"
            style={{ padding: 'var(--space-1)' }}
          >
            &#127922;
          </button>
          <button
            type="button"
            onClick={() => onLockedChange(!locked)}
            title={locked ? 'Unlock seed (random each time)' : 'Lock seed (reuse across generations)'}
            className="btn btn--ghost"
            style={{ padding: 'var(--space-1)', color: locked ? 'var(--tertiary)' : undefined }}
          >
            {locked ? '\u{1F512}' : '\u{1F513}'}
          </button>
        </div>
      </div>
    </div>
  );
}
