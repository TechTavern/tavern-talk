interface SliderControlProps {
  label: string;
  tooltip?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue?: string;
  onChange: (value: number) => void;
}

export function SliderControl({ label, tooltip, value, min, max, step, displayValue, onChange }: SliderControlProps) {
  return (
    <div className="slider-group">
      <div className="slider-row">
        <label className="slider-label" title={tooltip}>
          {label}
          {tooltip && <span className="slider-tooltip-icon" title={tooltip}> &#9432;</span>}
        </label>
        <output className="slider-value">{displayValue ?? value}</output>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
