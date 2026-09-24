import { X, Loader2 } from "lucide-react";

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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">
            {role === "Admin"
              ? "Add Cash Advance Record"
              : "Request Cash Advance"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {role === "Admin" && employees.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Select Employee
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => onChange("employeeId", e.target.value)}
                disabled={isSubmitting}
                className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold cursor-pointer"
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Advance Amount (PHP)
            </label>
            <input
              type="number"
              value={formData.cashAdvanceAmount}
              onChange={(e) =>
                onChange("cashAdvanceAmount", Number(e.target.value))
              }
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-mono font-bold"
              min={100}
              step={50}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Deduction Plan
            </label>
            <select
              value={formData.deductionType}
              onChange={(e) => onChange("deductionType", e.target.value)}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold cursor-pointer"
            >
              <option value="Monthly">Monthly</option>
              <option value="Per Pay Period">Per Pay Period</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              {role === "Admin" ? "Add Record" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
