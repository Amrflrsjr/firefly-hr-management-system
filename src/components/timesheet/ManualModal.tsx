import { useEffect } from "react";
import { X, LogIn, LogOut } from "lucide-react";

interface ManualModalProps {
  isOpen: boolean;
  role: string;
  employees: { id: number; firstName: string; lastName: string }[];
  selectedEmployee: string;
  manualDate: string;
  manualType: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onEmployeeChange: (val: string) => void;
  onTypeChange: (val: string) => void;
  onDateChange: (val: string) => void;
}

const fieldLabel = "mb-1.5 block text-xs font-medium text-slate-600";
const field =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20";

function nowLocalInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function ManualModal({
  isOpen,
  role,
  employees,
  selectedEmployee,
  manualDate,
  manualType,
  onClose,
  onSubmit,
  onEmployeeChange,
  onTypeChange,
  onDateChange,
}: ManualModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAdmin = role === "Admin";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-modal-title"
        className="w-full max-w-md rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="manual-modal-title"
              className="text-base font-bold text-slate-900"
            >
              {isAdmin ? "Add attendance record" : "Request a correction"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {isAdmin
                ? "The record is saved to the timesheet right away."
                : "An admin will review this before it's added to your timesheet."}
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
              <label htmlFor="manual-employee" className={fieldLabel}>
                Employee
              </label>
              <select
                id="manual-employee"
                value={selectedEmployee}
                onChange={(e) => onEmployeeChange(e.target.value)}
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
            <span id="manual-type-label" className={fieldLabel}>
              Log type
            </span>
            <div
              role="group"
              aria-labelledby="manual-type-label"
              className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1"
            >
              {[
                { value: "IN", label: "Time in", Icon: LogIn },
                { value: "OUT", label: "Time out", Icon: LogOut },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={manualType === value}
                  onClick={() => onTypeChange(value)}
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                    manualType === value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon
                    size={14}
                    className={
                      manualType === value
                        ? value === "IN"
                          ? "text-emerald-600"
                          : "text-amber-600"
                        : ""
                    }
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="manual-date" className={fieldLabel}>
              Date and time of the shift event
            </label>
            <input
              id="manual-date"
              type="datetime-local"
              value={manualDate}
              onChange={(e) => onDateChange(e.target.value)}
              max={isAdmin ? undefined : nowLocalInputValue()}
              required
              autoFocus={!isAdmin}
              className={`${field} cursor-pointer`}
            />
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
              className="h-10 rounded-lg bg-(--primary) px-4 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-(--primary-hover) cursor-pointer"
            >
              {isAdmin ? "Add record" : "Send request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
