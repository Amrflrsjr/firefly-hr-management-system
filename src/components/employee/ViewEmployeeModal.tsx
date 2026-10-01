import { X, Edit3, Clock } from "lucide-react";
import type { Employee } from "../../types/employee";
import { FOCUS } from "../../utils/uiConstants";

interface ViewEmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
  onEdit: (emp: Employee) => void;
}

export default function ViewEmployeeModal({
  employee,
  onClose,
  onEdit,
}: ViewEmployeeModalProps) {
  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--primary) text-lg font-bold shadow-md">
              {employee.firstName?.[0]}
              {employee.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {employee.firstName} {employee.middleName} {employee.lastName}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                {employee.jobTitle} • {employee.officeType} Office (
                {employee.employmentStatus})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Leave Balance Overview */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              <Clock size={13} /> Leave balance summary
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3">
                <span className="block text-[10px] font-bold text-amber-800">
                  Max limit
                </span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {employee.maxLeaveHours ?? 40} hrs
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Used hours
                </span>
                <span className="font-mono text-sm font-bold text-slate-700">
                  {employee.usedLeaveHours ?? 0} hrs
                </span>
              </div>
              <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3">
                <span className="block text-[10px] font-bold text-emerald-800">
                  Remaining
                </span>
                <span className="font-mono text-sm font-bold text-emerald-700">
                  {employee.remainingLeaveHours ?? 40} hrs
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Account & identity
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Employee ID
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {employee.employeeIdNumber}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Username
                </span>
                <span className="font-semibold">@{employee.username}</span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Civil status
                </span>
                <span className="font-semibold">
                  {employee.civilStatus || "N/A"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Gender
                </span>
                <span className="font-semibold">
                  {employee.gender || "N/A"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Age
                </span>
                <span className="font-semibold">{employee.age} yrs</span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Blood type
                </span>
                <span className="font-semibold">
                  {employee.bloodType || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Contact & addresses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Contact & email
                </span>
                <span className="block font-semibold">
                  {employee.contactNumber || "N/A"}
                </span>
                <span className="text-[11px] text-slate-500">
                  {employee.personalEmailAddress || "N/A"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Addresses
                </span>
                <span className="block font-semibold">
                  Current: {employee.currentAddress || "N/A"}
                </span>
                <span className="text-[11px] text-slate-500">
                  Permanent: {employee.permanentAddress || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Employment & compensation
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Employment type
                </span>
                <span className="font-semibold">{employee.employmentType}</span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Daily salary
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₱{employee.dailySalary?.toFixed(2)}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Daily allowance
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₱{employee.dailyAllowance?.toFixed(2)}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3">
                <span className="block text-[10px] font-bold text-slate-400">
                  Gov deductions
                </span>
                <span className="font-semibold">
                  {employee.hasGovernmentDeductions ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Statutory numbers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200/60 bg-slate-50 p-3">
              <div>
                <span className="block text-[10px] font-bold text-slate-400">
                  SSS number
                </span>
                <span className="font-mono font-semibold">
                  {employee.sssNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400">
                  PhilHealth number
                </span>
                <span className="font-mono font-semibold">
                  {employee.philHealthNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400">
                  Pag-IBIG number
                </span>
                <span className="font-mono font-semibold">
                  {employee.pagIbigNumber || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Emergency contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200/60 bg-slate-50 p-3">
              <div>
                <span className="block text-[10px] font-bold text-slate-400">
                  Name & relation
                </span>
                <span className="font-semibold">
                  {employee.emergencyContactName || "N/A"} (
                  {employee.relationToEmployee || "N/A"})
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400">
                  Emergency number
                </span>
                <span className="font-semibold">
                  {employee.emergencyContactNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400">
                  Emergency address
                </span>
                <span className="font-semibold">
                  {employee.emergencyContactAddress || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => onEdit(employee)}
            className={`flex items-center gap-1.5 rounded-xl bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-200 cursor-pointer ${FOCUS}`}
          >
            <Edit3 size={14} /> Edit profile
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 cursor-pointer ${FOCUS}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
