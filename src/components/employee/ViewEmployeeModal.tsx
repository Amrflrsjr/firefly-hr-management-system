import { X, Edit3, Clock } from "lucide-react";
import type { Employee } from "../../types/employee";

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-2xl w-full space-y-6 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-(--primary) font-bold text-lg flex items-center justify-center shadow-md shrink-0">
              {employee.firstName?.[0]}
              {employee.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {employee.firstName} {employee.middleName} {employee.lastName}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {employee.jobTitle} • {employee.officeType} Office (
                {employee.employmentStatus})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Leave Balance Overview */}
          <div>
            <h3 className="font-bold mb-2 uppercase tracking-wider text-[10px] text-amber-800 flex items-center gap-1.5">
              <Clock size={13} /> Leave Balance Summary
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                <span className="text-[10px] text-amber-800 block font-bold">
                  Max Limit
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {employee.maxLeaveHours ?? 40} hrs
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Used Hours
                </span>
                <span className="font-mono font-bold text-slate-700 text-sm">
                  {employee.usedLeaveHours ?? 0} hrs
                </span>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60">
                <span className="text-[10px] text-emerald-800 block font-bold">
                  Remaining
                </span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {employee.remainingLeaveHours ?? 40} hrs
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2 uppercase tracking-wider text-[10px] text-amber-800">
              Account & Identity
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Employee ID
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {employee.employeeIdNumber}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Username
                </span>
                <span className="font-semibold">@{employee.username}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Civil Status
                </span>
                <span className="font-semibold">
                  {employee.civilStatus || "N/A"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Gender
                </span>
                <span className="font-semibold">
                  {employee.gender || "N/A"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Age
                </span>
                <span className="font-semibold">{employee.age} yrs</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Blood Type
                </span>
                <span className="font-semibold">
                  {employee.bloodType || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2 uppercase tracking-wider text-[10px] text-amber-800">
              Contact & Addresses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Contact & Email
                </span>
                <span className="font-semibold block">
                  {employee.contactNumber || "N/A"}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {employee.personalEmailAddress || "N/A"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Addresses
                </span>
                <span className="font-semibold block">
                  Current: {employee.currentAddress || "N/A"}
                </span>
                <span className="text-slate-500 text-[11px]">
                  Permanent: {employee.permanentAddress || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2 uppercase tracking-wider text-[10px] text-amber-800">
              Employment & Compensation
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Employment Type
                </span>
                <span className="font-semibold">{employee.employmentType}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Daily Salary
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₱{employee.dailySalary?.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Daily Allowance
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₱{employee.dailyAllowance?.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-bold">
                  Gov Deductions
                </span>
                <span className="font-semibold">
                  {employee.hasGovernmentDeductions ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2 uppercase tracking-wider text-[10px] text-amber-800">
              Statutory Numbers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  SSS Number
                </span>
                <span className="font-mono font-semibold">
                  {employee.sssNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  PhilHealth Number
                </span>
                <span className="font-mono font-semibold">
                  {employee.philHealthNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  Pag-IBIG Number
                </span>
                <span className="font-mono font-semibold">
                  {employee.pagIbigNumber || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2 uppercase tracking-wider text-[10px] text-amber-800">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  Name & Relation
                </span>
                <span className="font-semibold">
                  {employee.emergencyContactName || "N/A"} (
                  {employee.relationToEmployee || "N/A"})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  Emergency Number
                </span>
                <span className="font-semibold">
                  {employee.emergencyContactNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">
                  Emergency Address
                </span>
                <span className="font-semibold">
                  {employee.emergencyContactAddress || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onEdit(employee)}
            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Edit Profile
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
