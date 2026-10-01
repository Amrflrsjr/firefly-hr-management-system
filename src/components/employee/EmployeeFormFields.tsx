import type { Employee } from "../../types/employee";
import { Lock } from "lucide-react";
import { FOCUS } from "../../utils/uiConstants";

interface EmployeeFormFieldsProps<T extends Partial<Employee>> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  isSubmitting: boolean;
}

export default function EmployeeFormFields<T extends Partial<Employee>>({
  formData,
  setFormData,
  isSubmitting,
}: EmployeeFormFieldsProps<T>) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const employeeData = formData as unknown as Partial<Employee>;

  return (
    <div className="space-y-5 text-xs">
      {/* SECTION 1: Account Credentials & Security */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <h3 className="border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          1. Account Credentials & Security
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Employee ID Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="employeeIdNumber"
              value={employeeData.employeeIdNumber || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. EMP-2026-001"
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Login Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={employeeData.username || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. jdoe"
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Initial Password
            </label>
            <div className="flex select-none items-center justify-between rounded-xl border border-slate-200 bg-slate-100 p-2.5 font-mono font-bold text-slate-600">
              <span>firefly2026</span>
              <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-400">
                <Lock size={11} /> Read-only
              </span>
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isAdmin"
              id="isAdmin"
              checked={Boolean(employeeData.isAdmin)}
              onChange={handleChange}
              disabled={isSubmitting}
              className="h-4 w-4 rounded accent-amber-600 cursor-pointer disabled:opacity-60"
            />
            <label
              htmlFor="isAdmin"
              className="cursor-pointer text-xs font-bold text-slate-800"
            >
              Grant Administrator Privileges
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 2: Personal Information */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <h3 className="border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          2. Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={employeeData.firstName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              value={employeeData.middleName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={employeeData.lastName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={employeeData.dateOfBirth?.split("T")[0] || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Age
            </label>
            <input
              type="number"
              name="age"
              min={18}
              max={100}
              value={employeeData.age || 0}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  age: parseInt(e.target.value) || 0,
                }))
              }
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Gender
            </label>
            <select
              name="gender"
              value={employeeData.gender || "Male"}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Civil Status
            </label>
            <select
              name="civilStatus"
              value={employeeData.civilStatus || "Single"}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            >
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Blood Type
            </label>
            <select
              name="bloodType"
              value={employeeData.bloodType || "O+"}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            >
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Photo URL / Identifier
            </label>
            <input
              type="text"
              name="photo"
              value={employeeData.photo || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. profile.jpg"
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Contact & Addresses */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <h3 className="border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          3. Contact & Addresses
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Contact Number
            </label>
            <input
              type="text"
              name="contactNumber"
              value={employeeData.contactNumber || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="09XXXXXXXXX"
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Personal Email Address
            </label>
            <input
              type="email"
              name="personalEmailAddress"
              value={employeeData.personalEmailAddress || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="email@example.com"
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Current Address
          </label>
          <input
            type="text"
            name="currentAddress"
            value={employeeData.currentAddress || ""}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Permanent Address
          </label>
          <input
            type="text"
            name="permanentAddress"
            value={employeeData.permanentAddress || ""}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
          />
        </div>
      </div>

      {/* SECTION 4: Employment & Position Details */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <h3 className="border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          4. Employment & Position Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="jobTitle"
              value={employeeData.jobTitle || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Employment Type
            </label>
            <input
              type="text"
              name="employmentType"
              value={employeeData.employmentType || "Regular"}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Employment Status
            </label>
            <select
              name="employmentStatus"
              value={employeeData.employmentStatus || "Active"}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            >
              <option value="Active">Active</option>
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Office Type
            </label>
            <select
              name="officeType"
              value={employeeData.officeType || "Admin"}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            >
              <option value="Admin">Admin</option>
              <option value="Production">Production</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Date Hired
            </label>
            <input
              type="date"
              name="dateHired"
              value={employeeData.dateHired?.split("T")[0] || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Declared Date Hired
            </label>
            <input
              type="date"
              name="declaredDateHired"
              value={employeeData.declaredDateHired?.split("T")[0] || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: Leave Allocation & Balances */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <h3 className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          5. Leave Allocation & Balances
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Max Leave Hours <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="maxLeaveHours"
              min={0}
              step={1}
              value={employeeData.maxLeaveHours ?? 40}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxLeaveHours: parseFloat(e.target.value) || 0,
                }))
              }
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono font-bold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Remaining Leave Hours <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="remainingLeaveHours"
              min={0}
              step={1}
              value={employeeData.remainingLeaveHours ?? 40}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  remainingLeaveHours: parseFloat(e.target.value) || 0,
                }))
              }
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono font-bold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              required
            />
          </div>
        </div>
      </div>

      {/* SECTION 6: Compensation & Statutory */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <h3 className="border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          6. Compensation & Statutory Contributions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Daily Salary (PHP) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="50"
              min={0}
              name="dailySalary"
              value={employeeData.dailySalary || 0}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dailySalary: parseFloat(e.target.value) || 0,
                }))
              }
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono font-bold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Daily Allowance (PHP) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="10"
              min={0}
              name="dailyAllowance"
              value={employeeData.dailyAllowance || 0}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dailyAllowance: parseFloat(e.target.value) || 0,
                }))
              }
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono font-bold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              required
            />
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 p-3">
          <input
            type="checkbox"
            name="hasGovernmentDeductions"
            id="hasGov"
            checked={Boolean(employeeData.hasGovernmentDeductions)}
            onChange={handleChange}
            disabled={isSubmitting}
            className="mt-0.5 h-4 w-4 rounded accent-amber-600 cursor-pointer disabled:opacity-60"
          />
          <div>
            <label
              htmlFor="hasGov"
              className="block cursor-pointer text-xs font-bold text-slate-900"
            >
              Enable Government Contributions (Eligible)
            </label>
            <p className="text-[11px] font-medium text-slate-500">
              Automatically compute SSS, PhilHealth, and Pag-IBIG.
            </p>
          </div>
        </div>

        {employeeData.hasGovernmentDeductions && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                SSS Number
              </label>
              <input
                type="text"
                name="sssNumber"
                value={employeeData.sssNumber || ""}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                PhilHealth Number
              </label>
              <input
                type="text"
                name="philHealthNumber"
                value={employeeData.philHealthNumber || ""}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pag-IBIG Number
              </label>
              <input
                type="text"
                name="pagIbigNumber"
                value={employeeData.pagIbigNumber || ""}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Deduction Schedule Type
          </label>
          <select
            name="deductionType"
            value={employeeData.deductionType || "Per Pay Period"}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
          >
            <option value="Per Pay Period">
              Per Pay Period (Split per cutoff)
            </option>
            <option value="Every 15th Pay Period">Every 15th Pay Period</option>
            <option value="Every End of Month">Every End of Month</option>
          </select>
        </div>
      </div>

      {/* SECTION 7: Emergency Contact */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
        <h3 className="border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          7. Emergency Contact Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Contact Name
            </label>
            <input
              type="text"
              name="emergencyContactName"
              value={employeeData.emergencyContactName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Contact Number
            </label>
            <input
              type="text"
              name="emergencyContactNumber"
              value={employeeData.emergencyContactNumber || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Relation
            </label>
            <input
              type="text"
              name="relationToEmployee"
              value={employeeData.relationToEmployee || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Emergency Address
          </label>
          <input
            type="text"
            name="emergencyContactAddress"
            value={employeeData.emergencyContactAddress || ""}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
          />
        </div>
      </div>
    </div>
  );
}
