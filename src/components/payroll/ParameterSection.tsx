import { Lock, Unlock, TrendingUp, TrendingDown } from "lucide-react";

interface ParameterSectionProps {
  title: string;
  type: "earnings" | "deductions";
  items: { label: string; key: string; step: string }[];
  params: Record<string, number>;
  unlockedFields: Record<string, boolean>;
  loadingParams: boolean;
  isComputing: boolean;
  onInputChange: (key: string, value: number) => void;
  onToggleLock: (key: string) => void;
}

export default function ParameterSection({
  title,
  type,
  items,
  params,
  unlockedFields,
  loadingParams,
  isComputing,
  onInputChange,
  onToggleLock,
}: ParameterSectionProps) {
  const isEarnings = type === "earnings";

  return (
    <section className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEarnings ? (
            <TrendingUp size={15} className="text-emerald-600" />
          ) : (
            <TrendingDown size={15} className="text-rose-500" />
          )}
          <h3 className="text-xs font-bold text-slate-800">{title}</h3>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          {isEarnings ? "Attendance" : "Payroll"}
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
        {items.map(({ label, key, step }) => {
          const isUnlocked = unlockedFields[key];

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {label}
                </label>
                <button
                  type="button"
                  onClick={() => onToggleLock(key)}
                  className={`inline-flex items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer ${
                    isUnlocked
                      ? "text-amber-700"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {isUnlocked ? (
                    <>
                      <Unlock size={11} />
                      Manual
                    </>
                  ) : (
                    <>
                      <Lock size={11} />
                      Synced
                    </>
                  )}
                </button>
              </div>

              <input
                type="number"
                step={step}
                value={params[key] ?? 0}
                onChange={(e) =>
                  onInputChange(key, parseFloat(e.target.value) || 0)
                }
                disabled={isComputing || !isUnlocked}
                className={`w-full h-10 border px-3 rounded-lg font-mono text-sm font-semibold transition-colors ${
                  loadingParams ? "animate-pulse bg-amber-50/30" : ""
                } ${
                  isUnlocked
                    ? "border-amber-300 bg-amber-50/20 text-slate-900 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                    : "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed select-none"
                }`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
