import React from "react";

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  showValue?: boolean;
}

export default function SliderInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  unit = "",
  showValue = true,
}: SliderInputProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <label className="font-medium text-stone-800">{label}</label>
        {showValue && (
          <span className="text-sm font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            {value}
            {unit}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-amber-600
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-amber-600
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, rgb(217 119 6) ${percentage}%, rgb(231 229 228) ${percentage}%)`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-stone-400">
          {min}
          {unit}
        </span>
        <span className="text-xs text-stone-400">
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
