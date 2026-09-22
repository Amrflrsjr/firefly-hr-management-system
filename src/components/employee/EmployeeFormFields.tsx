import type { Employee } from "../../types/employee";
import { Lock } from "lucide-react";

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

  return (
    <div className="space-y-5 text-xs">
      {/* SECTION 1: Account Credentials & Security */}
      <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 pb-2">
          1. Account Credentials & Security
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Employee ID Number *
            </label>
            <input
              type="text"
              name="employeeIdNumber"
              value={formData.employeeIdNumber || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. EMP-2026-001"
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Login Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. jdoe"
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Initial Password
            </label>
            <div className="w-full border border-slate-200 bg-slate-100 p-2.5 rounded-xl font-mono font-bold text-slate-600 flex items-center justify-between select-none">
              <span>firefly2026</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
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
              checked={Boolean(formData.isAdmin)}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-4 h-4 text-amber-600 rounded cursor-pointer accent-amber-600"
            />
            <label
              htmlFor="isAdmin"
              className="font-bold text-slate-800 cursor-pointer text-xs"
            >
              Grant Administrator Privileges
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 2: Personal Information */}
      <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 pb-2">
          2. Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth?.split("T")[0] || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Age
            </label>
            <input
              type="number"
              name="age"
              value={formData.age || 0}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  age: parseInt(e.target.value) || 0,
                }))
              }
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender || "Male"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Civil Status
            </label>
            <select
              name="civilStatus"
              value={formData.civilStatus || "Single"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
            >
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Blood Type
            </label>
            <select
              name="bloodType"
              value={formData.bloodType || "O+"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Photo URL / Identifier
            </label>
            <input
              type="text"
              name="photo"
              value={formData.photo || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. profile.jpg"
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Contact & Addresses */}
      <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 pb-2">
          3. Contact & Addresses
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Contact Number
            </label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="09XXXXXXXXX"
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Personal Email Address
            </label>
            <input
              type="email"
              name="personalEmailAddress"
              value={formData.personalEmailAddress || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="email@example.com"
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Current Address
          </label>
          <input
            type="text"
            name="currentAddress"
            value={formData.currentAddress || ""}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Permanent Address
          </label>
          <input
            type="text"
            name="permanentAddress"
            value={formData.permanentAddress || ""}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
          />
        </div>
      </div>

      {/* SECTION 4: Employment & Position Details */}
      <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 pb-2">
          4. Employment & Position Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Job Title *
            </label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Employment Type
            </label>
            <input
              type="text"
              name="employmentType"
              value={formData.employmentType || "Regular"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Employment Status
            </label>
            <select
              name="employmentStatus"
              value={formData.employmentStatus || "Active"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Office Type
            </label>
            <select
              name="officeType"
              value={formData.officeType || "Admin"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
            >
              <option value="Admin">Admin</option>
              <option value="Production">Production</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Date Hired
            </label>
            <input
              type="date"
              name="dateHired"
              value={formData.dateHired?.split("T")[0] || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Declared Date Hired
            </label>
            <input
              type="date"
              name="declaredDateHired"
              value={formData.declaredDateHired?.split("T")[0] || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: Compensation & Statutory */}
      <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 pb-2">
          5. Compensation & Statutory Contributions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Daily Salary (PHP) *
            </label>
            <input
              type="number"
              step="50"
              name="dailySalary"
              value={formData.dailySalary || 0}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dailySalary: parseFloat(e.target.value) || 0,
                }))
              }
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Daily Allowance (PHP) *
            </label>
            <input
              type="number"
              step="10"
              name="dailyAllowance"
              value={formData.dailyAllowance || 0}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dailyAllowance: parseFloat(e.target.value) || 0,
                }))
              }
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
              required
            />
          </div>
        </div>

        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-start gap-3">
          <input
            type="checkbox"
            name="hasGovernmentDeductions"
            id="hasGov"
            checked={Boolean(formData.hasGovernmentDeductions)}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-4 h-4 mt-0.5 text-amber-600 rounded cursor-pointer accent-amber-600"
          />
          <div>
            <label
              htmlFor="hasGov"
              className="font-bold text-slate-900 cursor-pointer text-xs block"
            >
              Enable Government Contributions (Eligible)
            </label>
            <p className="text-[11px] text-slate-500 font-medium">
              Automatically compute SSS, PhilHealth, and Pag-IBIG.
            </p>
          </div>
        </div>

        {formData.hasGovernmentDeductions && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                SSS Number
              </label>
              <input
                type="text"
                name="sssNumber"
                value={formData.sssNumber || ""}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-mono font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                PhilHealth Number
              </label>
              <input
                type="text"
                name="philHealthNumber"
                value={formData.philHealthNumber || ""}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-mono font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Pag-IBIG Number
              </label>
              <input
                type="text"
                name="pagIbigNumber"
                value={formData.pagIbigNumber || ""}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-mono font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Deduction Schedule Type
          </label>
          <select
            name="deductionType"
            value={formData.deductionType || "Per Pay Period"}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
          >
            <option value="Per Pay Period">
              Per Pay Period (Split per cutoff)
            </option>
            <option value="Every End of Month">Every End of Month</option>
          </select>
        </div>
      </div>

      {/* SECTION 6: Emergency Contact */}
      <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 pb-2">
          6. Emergency Contact Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Contact Name
            </label>
            <input
              type="text"
              name="emergencyContactName"
              value={formData.emergencyContactName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Contact Number
            </label>
            <input
              type="text"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Relation
            </label>
            <input
              type="text"
              name="relationToEmployee"
              value={formData.relationToEmployee || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Emergency Address
          </label>
          <input
            type="text"
            name="emergencyContactAddress"
            value={formData.emergencyContactAddress || ""}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
          />
        </div>
      </div>
    </div>
  );
}
