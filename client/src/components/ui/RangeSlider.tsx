interface RangeSliderProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min: number;
  max: number;
  step: number;
  formatValue?: (v: number) => string;
}

export function RangeSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
}: RangeSliderProps) {
  const current = value ?? min;
  const pct = ((current - min) / (max - min)) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {value != null && (
          <span className="text-xs font-semibold text-shark">
            {formatValue ? formatValue(value) : value}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(v === min ? undefined : v);
          }}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-shark"
          style={{
            background: `linear-gradient(to right, var(--color-shark) 0%, var(--color-shark) ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
          }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          placeholder="—"
          onChange={(e) => {
            onChange(e.target.value === "" ? undefined : Number(e.target.value));
          }}
          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-xs tabular-nums focus:border-shark focus:outline-none focus:ring-1 focus:ring-shark"
        />
      </div>
    </div>
  );
}
