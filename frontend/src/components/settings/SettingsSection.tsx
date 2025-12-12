import React, { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SettingsSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function SettingsSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-700">{icon}</span>
          <h2 className="text-lg font-semibold text-stone-800">{title}</h2>
        </div>
        <span className="text-stone-400">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="px-5 pb-5 pt-2 border-t border-stone-100">
          {children}
        </div>
      </div>
    </div>
  );
}
