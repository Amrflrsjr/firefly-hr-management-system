import { useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface OvertimeModalProps {
  isOpen: boolean;
  role: string;
  employees: Employee[];
  formData: {
    employeeId: string;
    overtimeDate: string;
    timeIn: string;
    timeOut: string;
  };
  calculatedHours: number;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string) => void;
}

const fieldLabel = "mb-1.5 block text-xs font-medium text-slate-600";
const field =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60";

export default function OvertimeModal({
  isOpen,
  role,
  employees,
  formData,
  calculatedHours,
  isSubmitting,
  onClose,
  onSubmit,
  onChange,
}: OvertimeModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAdmin = role === "Admin";
  const crossesMidnight =
    Boolean(formData.timeIn && formData.timeOut) &&
    formData.timeOut < formData.timeIn;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="overtime-modal-title"
        className="max-h-full w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="overtime-modal-title"
              className="text-base font-bold text-slate-900"
            >
              {isAdmin ? "Add overtime record" : "Request overtime"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {isAdmin
                ? "The record is approved right away."
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
              <label htmlFor="ot-employee" className={fieldLabel}>
                Employee
              </label>
              <select
                id="ot-employee"
                value={formData.employeeId}
                onChange={(e) => onChange("employeeId", e.target.value)}
                disabled={isSubmitting}
                className={`${field} cursor-pointer`}
                required
                autoFocus
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={String(emp.id)}>
                    {emp.lastName}, {emp.firstName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="ot-date" className={fieldLabel}>
              Overtime date
            </label>
            <input
              id="ot-date"
              type="date"
              value={formData.overtimeDate}
              onChange={(e) => onChange("overtimeDate", e.target.value)}
              disabled={isSubmitting}
              className={`${field} cursor-pointer`}
              required
              autoFocus={!isAdmin}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ot-start" className={fieldLabel}>
                Start time
              </label>
              <input
                id="ot-start"
                type="time"
                value={formData.timeIn}
                onChange={(e) => onChange("timeIn", e.target.value)}
                disabled={isSubmitting}
                className={`${field} cursor-pointer`}
                required
              />
            </div>
            <div>
              <label htmlFor="ot-end" className={fieldLabel}>
                End time
              </label>
              <input
                id="ot-end"
                type="time"
                value={formData.timeOut}
                onChange={(e) => onChange("timeOut", e.target.value)}
                disabled={isSubmitting}
                className={`${field} cursor-pointer`}
                required
              />
            </div>
          </div>

          <div
            aria-live="polite"
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3"
          >
            <div>
              <p className="text-xs font-medium text-slate-600">Duration</p>
              {crossesMidnight && (
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Ends the next day
                </p>
              )}
            </div>
            <span className="text-sm font-semibold tabular-nums text-amber-900">
              {calculatedHours} {calculatedHours === 1 ? "hour" : "hours"}
            </span>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedHours <= 0}
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
