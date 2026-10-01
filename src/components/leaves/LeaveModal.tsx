import { useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  remainingLeaveHours: number;
}

interface LeaveModalProps {
  isOpen: boolean;
  role: string;
  employees: Employee[];
  /** The signed-in employee's id; used to look up their balance for non-admins. */
  selfEmployeeId?: string;
  formData: {
    employeeId: string;
    leaveDate: string;
    leaveHours: number;
    leaveType: string;
  };
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string | number) => void;
}

const LEAVE_TYPES = [
  { value: "Vacation", label: "Vacation" },
  { value: "Sick Leave", label: "Sick" },
  { value: "Emergency", label: "Emergency" },
];

const HOUR_PRESETS = [
  { hours: 4, label: "Half day" },
  { hours: 8, label: "Full day" },
];

const fieldLabel = "mb-1.5 block text-xs font-medium text-slate-600";
const field =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20";

export default function LeaveModal({
  isOpen,
  role,
  employees,
  selfEmployeeId,
  formData,
  isSubmitting,
  onClose,
  onSubmit,
  onChange,
}: LeaveModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAdmin = role === "Admin";
  const targetId = isAdmin ? formData.employeeId : selfEmployeeId;
  const target = employees.find((e) => String(e.id) === targetId);
  const remaining = target?.remainingLeaveHours;
  const after =
    remaining === undefined ? undefined : remaining - formData.leaveHours;
  const overBalance = after !== undefined && after < 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-modal-title"
        className="max-h-full w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="leave-modal-title"
              className="text-base font-bold text-slate-900"
            >
              {isAdmin ? "Add leave record" : "Request leave"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {isAdmin
                ? "The record is approved and deducted from the balance right away."
                : "An admin will review this request before it's approved."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 -mt-1.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {isAdmin && employees.length > 0 && (
            <div>
              <label htmlFor="leave-employee" className={fieldLabel}>
                Employee
              </label>
              <select
                id="leave-employee"
                value={formData.employeeId}
                onChange={(e) => onChange("employeeId", e.target.value)}
                className={`${field} cursor-pointer`}
                required
                autoFocus
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={String(emp.id)}>
                    {emp.lastName}, {emp.firstName} ({emp.remainingLeaveHours}{" "}
                    hrs left)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <span id="leave-type-label" className={fieldLabel}>
              Leave type
            </span>
            <div
              role="group"
              aria-labelledby="leave-type-label"
              className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
            >
              {LEAVE_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={formData.leaveType === value}
                  onClick={() => onChange("leaveType", value)}
                  className={`h-9 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                    formData.leaveType === value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="leave-date" className={fieldLabel}>
              Leave date
            </label>
            <input
              id="leave-date"
              type="date"
              value={formData.leaveDate}
              onChange={(e) => onChange("leaveDate", e.target.value)}
              className={`${field} cursor-pointer`}
              required
              autoFocus={!isAdmin}
            />
          </div>

          <div>
            <label htmlFor="leave-hours" className={fieldLabel}>
              Hours
            </label>
            <div className="flex items-center gap-2">
              <input
                id="leave-hours"
                type="number"
                inputMode="numeric"
                value={formData.leaveHours}
                onChange={(e) => onChange("leaveHours", Number(e.target.value))}
                className={`${field} w-24 tabular-nums`}
                min={1}
                max={40}
                required
              />
              {HOUR_PRESETS.map((preset) => (
                <button
                  key={preset.hours}
                  type="button"
                  onClick={() => onChange("leaveHours", preset.hours)}
                  aria-pressed={formData.leaveHours === preset.hours}
                  className={`h-9 rounded-xl border px-3 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    formData.leaveHours === preset.hours
                      ? "border-amber-300 bg-amber-50 text-amber-900 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {remaining !== undefined && after !== undefined && (
              <p
                aria-live="polite"
                className={`mt-2 text-xs ${
                  overBalance ? "font-medium text-rose-600" : "text-slate-500"
                }`}
              >
                {overBalance
                  ? `${-after} hrs over the ${remaining} hrs available.`
                  : `${remaining} hrs available, ${after} hrs left after this.`}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || overBalance}
              className="flex h-10 items-center gap-2 rounded-lg bg-(--primary) px-4 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-(--primary-hover) cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isAdmin ? "Add record" : "Send request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
