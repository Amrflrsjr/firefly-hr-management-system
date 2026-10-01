import { X, Loader2 } from "lucide-react";
import { FOCUS } from "../../utils/uiConstants";

interface CashAdvanceModalProps {
  isOpen: boolean;
  role: string;
  employees: { id: number; firstName: string; lastName: string }[];
  formData: {
    employeeId: string;
    cashAdvanceAmount: number;
    deductionType: string;
  };
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string | number) => void;
}

export default function CashAdvanceModal({
  isOpen,
  role,
  employees,
  formData,
  isSubmitting,
  onClose,
  onSubmit,
  onChange,
}: CashAdvanceModalProps) {
  if (!isOpen) return null;

  const isAdmin = role === "Admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {isAdmin ? "Add cash advance record" : "Request cash advance"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {isAdmin && employees.length > 0 && (
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Select employee
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => onChange("employeeId", e.target.value)}
                disabled={isSubmitting}
                className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 cursor-pointer disabled:opacity-60 ${FOCUS}`}
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.lastName}, {emp.firstName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Advance amount (PHP)
            </label>
            <input
              type="number"
              value={formData.cashAdvanceAmount}
              onChange={(e) =>
                onChange("cashAdvanceAmount", Number(e.target.value))
              }
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono font-bold text-slate-900 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              min={100}
              step={50}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Deduction plan
            </label>
            <select
              value={formData.deductionType}
              onChange={(e) => onChange("deductionType", e.target.value)}
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 cursor-pointer disabled:opacity-60 ${FOCUS}`}
            >
              <option value="Monthly">Monthly</option>
              <option value="Per Pay Period">Per Pay Period</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 ${FOCUS}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-xl bg-(--primary) px-4 py-2 font-semibold text-slate-950 shadow-sm hover:bg-(--primary-hover) cursor-pointer disabled:opacity-50 active:scale-[0.98] ${FOCUS}`}
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              {isAdmin ? "Add record" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
