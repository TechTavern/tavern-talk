import { Tooltip } from './Tooltip';

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
        <span className="slider-label">
          {label}
          {tooltip && (
            <Tooltip content={tooltip}>
              <span className="tooltip-trigger">
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                  <path fillRule="evenodd" d="M15 8A7 7 0 111 8a7 7 0 0114 0zM9 5a1 1 0 11-2 0 1 1 0 012 0zM7.5 7.5A.5.5 0 018 7h.5a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H8a.5.5 0 01-.5-.5v-3z" clipRule="evenodd" />
                </svg>
              </span>
            </Tooltip>
          )}
        </span>
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
