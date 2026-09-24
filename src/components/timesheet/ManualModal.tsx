import { X, ShieldCheck } from "lucide-react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-700" />
            {role === "Admin"
              ? "Direct Administrative Input"
              : "File Attendance Correction"}
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
                value={
                  selectedEmployee === "all"
                    ? employees[0]?.id
                    : selectedEmployee
                }
                onChange={(e) => onEmployeeChange(e.target.value)}
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
              Log Type
            </label>
            <select
              value={manualType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold cursor-pointer"
            >
              <option value="IN">Time IN</option>
              <option value="OUT">Time OUT</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Target Date & Time
            </label>
            <input
              type="datetime-local"
              value={manualDate}
              onChange={(e) => onDateChange(e.target.value)}
              required
              className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
