import React, { type ReactNode } from "react";

interface SelectableCardProps {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  preview?: ReactNode;
  className?: string;
}

export default function SelectableCard({
  selected,
  onClick,
  icon,
  title,
  description,
  preview,
  className = "",
}: SelectableCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200
        hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
        ${
          selected
            ? "border-amber-500 bg-amber-50/50 shadow-sm"
            : "border-stone-200 bg-white hover:border-stone-300"
        }
        ${className}
      `}
    >
      {/* Check indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}

      {icon && (
        <span
          className={`mb-2 ${selected ? "text-amber-600" : "text-stone-500"}`}
        >
          {icon}
        </span>
      )}

      {preview && <div className="mb-3 w-full">{preview}</div>}

      <h3
        className={`font-semibold text-sm ${
          selected ? "text-amber-800" : "text-stone-700"
        }`}
      >
        {title}
      </h3>

      {description && (
        <p className="text-xs text-stone-500 mt-1 text-left">{description}</p>
      )}
    </button>
  );
}
