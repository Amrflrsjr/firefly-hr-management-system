import { useId, useState } from "react";
import { Pencil, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import type { PayrollParamKey, PayrollParams } from "./payrollUtils";

export interface ParameterItem {
  label: string;
  key: PayrollParamKey;
  step: string;
  unit: string;
  /** Upper bound for validation. Adjust to your company policy. */
  max: number;
}

interface ParameterSectionProps {
  title: string;
  description: string;
  type: "earnings" | "deductions";
  items: ParameterItem[];
  params: PayrollParams;
  /** Values last fetched from the system (attendance, etc.) */
  synced: PayrollParams;
  overridden: Record<string, boolean>;
  loading: boolean;
  /** True when locked (already generated) or computing */
  disabled: boolean;
  onChange: (key: PayrollParamKey, value: number) => void;
  onOverride: (key: PayrollParamKey) => void;
  onReset: (key: PayrollParamKey) => void;
  onResetAll: (keys: PayrollParamKey[]) => void;
}

export default function ParameterSection({
  title,
  description,
  type,
  items,
  params,
  synced,
  overridden,
  loading,
  disabled,
  onChange,
  onOverride,
  onReset,
  onResetAll,
}: ParameterSectionProps) {
  const isEarnings = type === "earnings";
  const modifiedKeys = items
    .filter((i) => overridden[i.key] && params[i.key] !== synced[i.key])
    .map((i) => i.key);

  return (
    <section className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {isEarnings ? (
            <TrendingUp size={15} className="text-emerald-600 shrink-0" />
          ) : (
            <TrendingDown size={15} className="text-rose-500 shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        {modifiedKeys.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onResetAll(modifiedKeys)}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-600 rounded"
          >
            <RotateCcw size={12} />
            Reset {modifiedKeys.length} edited
          </button>
        )}
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
        {items.map((item) => (
          <ParameterField
            key={item.key}
            item={item}
            value={params[item.key]}
            syncedValue={synced[item.key]}
            isOverridden={Boolean(overridden[item.key])}
            loading={loading}
            disabled={disabled}
            onChange={(v) => onChange(item.key, v)}
            onOverride={() => onOverride(item.key)}
            onReset={() => onReset(item.key)}
          />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

interface ParameterFieldProps {
  item: ParameterItem;
  value: number;
  syncedValue: number;
  isOverridden: boolean;
  loading: boolean;
  disabled: boolean;
  onChange: (v: number) => void;
  onOverride: () => void;
  onReset: () => void;
}

function ParameterField({
  item,
  value,
  syncedValue,
  isOverridden,
  loading,
  disabled,
  onChange,
  onOverride,
  onReset,
}: ParameterFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  // Keep the raw text locally so clearing the box or typing "0." doesn't snap to 0.
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Sync state during render if value changed externally and the field is not focused (avoids effect setState warning)
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue && !focused) {
    setPrevValue(value);
    setText(String(value));
  }

  const trimmed = text.trim();
  const parsed = trimmed === "" ? NaN : Number(trimmed);
  const error =
    trimmed === ""
      ? "Enter a value (0 if none)"
      : Number.isNaN(parsed)
        ? "Enter a valid number"
        : parsed < 0
          ? "Cannot be negative"
          : parsed > item.max
            ? `Maximum is ${item.max}`
            : null;

  const isModified = isOverridden && value !== syncedValue;
  const editable = isOverridden && !disabled;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 min-h-5">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700">
          {item.label}
        </label>

        {!disabled &&
          (isOverridden ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-amber-600"
            >
              <RotateCcw size={11} />
              {isModified ? "Reset" : "Cancel"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOverride}
              aria-label={`Edit ${item.label} manually`}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-amber-800 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-amber-600"
            >
              <Pencil size={11} />
              Edit
            </button>
          ))}
      </div>

      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={item.step}
          min={0}
          max={item.max}
          value={text}
          readOnly={!editable}
          aria-invalid={editable && error ? true : undefined}
          aria-describedby={editable && error ? errorId : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onWheel={(e) => e.currentTarget.blur()}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            const n = raw.trim() === "" ? NaN : Number(raw);
            if (!Number.isNaN(n) && n >= 0 && n <= item.max) onChange(n);
          }}
          className={`w-full h-10 border pl-3 pr-14 rounded-lg font-mono text-sm font-semibold transition-colors[cite: 6]${
            loading ? "animate-pulse" : ""
          } ${
            editable && error
              ? "border-rose-400 bg-rose-50/40 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
              : editable
                ? "border-amber-300 bg-amber-50/30 text-slate-900 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                : "border-slate-200 bg-white text-slate-800 focus:outline-none"
          }`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          {item.unit}
        </span>
      </div>

      <div className="mt-1 min-h-4 text-xs">
        {editable && error ? (
          <p id={errorId} role="alert" className="text-rose-600 font-medium">
            {error}
          </p>
        ) : isModified ? (
          <p className="text-amber-800">
            <span className="font-semibold">Edited</span>
            <span className="text-slate-500">
              {" "}
              · system value {syncedValue} {item.unit}
            </span>
          </p>
        ) : !isOverridden ? (
          <p className="text-slate-400">From system records</p>
        ) : null}
      </div>
    </div>
  );
}
