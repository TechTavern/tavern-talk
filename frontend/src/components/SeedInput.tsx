import { Tooltip } from './Tooltip';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className="slider-label" style={{ whiteSpace: 'nowrap' }}>
          Seed
          <Tooltip content="A magic number that makes results repeatable. Lock it to get the exact same voice output every time you generate with the same text.">
            <span className="tooltip-trigger">
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M15 8A7 7 0 111 8a7 7 0 0114 0zM9 5a1 1 0 11-2 0 1 1 0 012 0zM7.5 7.5A.5.5 0 018 7h.5a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H8a.5.5 0 01-.5-.5v-3z" clipRule="evenodd" />
              </svg>
            </span>
          </Tooltip>
        </span>
        <input
          type="number"
          value={seed ?? ''}
          placeholder="Random"
          onChange={(e) => onSeedChange(e.target.value ? parseInt(e.target.value, 10) : null)}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--surface-highest)',
            border: '2px solid transparent',
            borderRadius: 'var(--radius-md)',
            color: 'var(--on-surface)',
            padding: 'var(--space-1) var(--space-2)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-body)',
          }}
        />
        <Tooltip content={locked ? 'Unlock seed — each generation will sound different' : 'Lock seed — keep getting the same result'}>
          <button
            type="button"
            onClick={() => onLockedChange(!locked)}
            className="btn btn--ghost"
            style={{ padding: 'var(--space-1)', color: locked ? 'var(--tertiary)' : undefined, flexShrink: 0 }}
          >
            {locked ? '\u{1F512}' : '\u{1F513}'}
          </button>
        </Tooltip>
        <Tooltip content="Pick a random seed number">
          <button
            type="button"
            onClick={randomize}
            className="btn btn--ghost"
            style={{ padding: 'var(--space-1)', flexShrink: 0 }}
          >
            &#127922;
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
