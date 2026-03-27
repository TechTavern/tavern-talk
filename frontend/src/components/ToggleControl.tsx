interface ToggleControlProps {
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleControl({ label, tooltip, checked, onChange }: ToggleControlProps) {
  return (
    <label className="modifier" title={tooltip}>
      <input
        type="checkbox"
        className="modifier-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="modifier-body">
        <span className="modifier-name">{label}</span>
      </span>
    </label>
  );
}
