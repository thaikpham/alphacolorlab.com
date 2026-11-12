import { useState } from "react";
import { PP_FIELDS } from "@/lib/zve10/dat";
import { colorBank } from "@/app/content";

export function PpForm({
  initialPreset,
  onApply,
  onClose,
  live,
}: {
  initialPreset?: any;
  onApply: (pp: Record<string, any>) => void;
  onClose?: () => void;
  live?: boolean;
}) {
  const [ppState, setPp] = useState<Record<string, any>>(initialPreset?.pp || {});
  // live: controlled by the parent so a recipe switch shows its values without remounting (keeps input focus)
  const pp: Record<string, any> = live ? initialPreset?.pp ?? {} : ppState;

  const handleChange = (newPp: Record<string, any>) => {
    setPp(newPp);
    if (live) onApply(newPp);
  };

  return (
    <div className={live ? "" : "mt-4 p-4 rounded-control bg-fill"}>
      <div className="grid gap-3 md:grid-cols-2">
        {PP_FIELDS.map((field) => {
          const value = pp[field.key];
          return (
            <div key={field.key}>
              <label className="text-footnote font-medium text-secondary block mb-1.5">
                {field.label}
              </label>
              {field.kind === "enum" ? (
                <select
                  value={value || ""}
                  onChange={(e) => handleChange({ ...pp, [field.key]: e.target.value })}
                  className="w-full h-11 rounded-control border border-separator bg-card px-3 text-callout text-label"
                >
                  <option value="">—</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={value ?? ""}
                  onChange={(e) => handleChange({ ...pp, [field.key]: parseFloat(e.target.value) || "" })}
                  className="w-full h-11 rounded-control border border-separator bg-card px-3 text-callout text-label"
                />
              )}
            </div>
          );
        })}
      </div>
      {!live && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onApply(pp)}
            className="flex-1 h-11 bg-accent text-on-accent font-semibold rounded-full text-subhead hover:bg-accent/90 transition"
          >
            {colorBank.ppForm.save}
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-fill text-label font-semibold rounded-full text-subhead hover:bg-fill-strong transition"
          >
            {colorBank.ppForm.cancel}
          </button>
        </div>
      )}
    </div>
  );
}
