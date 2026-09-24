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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">
            {role === "Admin" ? "Add Overtime Record" : "File Overtime Request"}
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
              Overtime Date
            </label>
            <input
              type="date"
              value={formData.overtimeDate}
              onChange={(e) => onChange("overtimeDate", e.target.value)}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Time In
              </label>
              <input
                type="time"
                value={formData.timeIn}
                onChange={(e) => onChange("timeIn", e.target.value)}
                disabled={isSubmitting}
                className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Time Out
              </label>
              <input
                type="time"
                value={formData.timeOut}
                onChange={(e) => onChange("timeOut", e.target.value)}
                disabled={isSubmitting}
                className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
            <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
              Computed Overtime Duration:
            </span>
            <span className="font-mono font-bold text-amber-900 text-sm">
              {calculatedHours} {calculatedHours === 1 ? "hour" : "hours"}
            </span>
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
              disabled={isSubmitting || calculatedHours <= 0}
              className="px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
