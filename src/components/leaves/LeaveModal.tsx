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

export default function LeaveModal({
  isOpen,
  role,
  employees,
  formData,
  isSubmitting,
  onClose,
  onSubmit,
  onChange,
}: LeaveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">
            {role === "Admin" ? "Add Leave Record" : "File Leave Request"}
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
                Select Employee <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => onChange("employeeId", e.target.value)}
                className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer bg-white"
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.lastName}, {emp.firstName} ({emp.remainingLeaveHours}{" "}
                    hrs remaining)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Leave Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) => onChange("leaveType", e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer bg-white"
              required
            >
              <option value="Vacation">Vacation Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Emergency">Emergency Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Leave Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.leaveDate}
              onChange={(e) => onChange("leaveDate", e.target.value)}
              className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Leave Hours <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.leaveHours}
              onChange={(e) => onChange("leaveHours", Number(e.target.value))}
              className="w-full border border-slate-300 p-2.5 rounded-xl font-mono font-bold bg-white"
              min={1}
              max={40}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-(--primary) text-slate-950 rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
