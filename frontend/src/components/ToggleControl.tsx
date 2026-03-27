import { Tooltip } from './Tooltip';

interface ToggleControlProps {
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleControl({ label, tooltip, checked, onChange }: ToggleControlProps) {
  return (
    <label className="modifier">
      <input
        type="checkbox"
        className="modifier-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="modifier-body">
        <span className="modifier-name">
          {label}
          {tooltip && (
            <Tooltip content={tooltip}>
              <span className="tooltip-trigger" onClick={(e) => e.preventDefault()}>
                <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                  <path fillRule="evenodd" d="M15 8A7 7 0 111 8a7 7 0 0114 0zM9 5a1 1 0 11-2 0 1 1 0 012 0zM7.5 7.5A.5.5 0 018 7h.5a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H8a.5.5 0 01-.5-.5v-3z" clipRule="evenodd" />
                </svg>
              </span>
            </Tooltip>
          )}
        </span>
      </span>
    </label>
  );
}
