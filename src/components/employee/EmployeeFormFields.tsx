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
    <div className="space-y-6 text-xs pb-4">
      {/* SECTION 1: Account Credentials & Security */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <h3 className="font-bold uppercase tracking-wider text-[11px] text-amber-800 border-b pb-1.5 flex items-center justify-between">
          <span>1. Account Credentials & Security</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Employee ID Number *
            </label>
            <input
              type="text"
              name="employeeIdNumber"
              value={formData.employeeIdNumber || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. EMP-2026-001"
              className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold bg-white focus:ring-2 focus:ring-(--primary) focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Login Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. jdoe"
              className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold bg-white focus:ring-2 focus:ring-(--primary) focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Initial Password (System Default)
            </label>
            <div className="w-full border border-slate-200 bg-slate-100 p-2.5 rounded-xl font-mono font-bold text-slate-600 flex items-center justify-between select-none">
              <span>firefly2026</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                <Lock size={11} /> Read-only
              </span>
            </div>
          </div>
        </div>
        <div className="pt-1">
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
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <h3 className="font-bold uppercase tracking-wider text-[11px] text-amber-800 border-b pb-1.5">
          2. Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold bg-white"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth?.split("T")[0] || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
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
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender || "Male"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Civil Status
            </label>
            <select
              name="civilStatus"
              value={formData.civilStatus || "Single"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            >
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Blood Type
            </label>
            <select
              name="bloodType"
              value={formData.bloodType || "O+"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Photo URL / Identifier
            </label>
            <input
              type="text"
              name="photo"
              value={formData.photo || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. profile.jpg"
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Contact & Addresses */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <h3 className="font-bold uppercase tracking-wider text-[11px] text-amber-800 border-b pb-1.5">
          3. Contact & Addresses
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Contact Number
            </label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="09XXXXXXXXX"
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Personal Email Address
            </label>
            <input
              type="email"
              name="personalEmailAddress"
              value={formData.personalEmailAddress || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="email@example.com"
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Current Address
          </label>
          <input
            type="text"
            name="currentAddress"
            value={formData.currentAddress || ""}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Permanent Address
          </label>
          <input
            type="text"
            name="permanentAddress"
            value={formData.permanentAddress || ""}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
          />
        </div>
      </div>

      {/* SECTION 4: Employment & Position Details */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <h3 className="font-bold uppercase tracking-wider text-[11px] text-amber-800 border-b pb-1.5">
          4. Employment & Position Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Employment Type
            </label>
            <input
              type="text"
              name="employmentType"
              value={formData.employmentType || "Regular"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Employment Status
            </label>
            <select
              name="employmentStatus"
              value={formData.employmentStatus || "Active"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Office Type
            </label>
            <select
              name="officeType"
              value={formData.officeType || "Admin"}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            >
              <option value="Admin">Admin</option>
              <option value="Production">Production</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Date Hired
            </label>
            <input
              type="date"
              name="dateHired"
              value={formData.dateHired?.split("T")[0] || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Declared Date Hired
            </label>
            <input
              type="date"
              name="declaredDateHired"
              value={formData.declaredDateHired?.split("T")[0] || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: Compensation & Statutory */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <h3 className="font-bold uppercase tracking-wider text-[11px] text-amber-800 border-b pb-1.5">
          5. Compensation & Statutory Contributions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
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
              className="w-full border border-slate-300 p-2.5 bg-white font-mono font-bold rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
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
              className="w-full border border-slate-300 p-2.5 bg-white font-mono font-bold rounded-xl"
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
            <p className="text-[10px] text-slate-500 font-medium">
              Automatically compute SSS, PhilHealth, and Pag-IBIG.
            </p>
          </div>
        </div>

        {formData.hasGovernmentDeductions && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                SSS Number
              </label>
              <input
                type="text"
                name="sssNumber"
                value={formData.sssNumber || ""}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full border border-slate-300 p-2 rounded-xl bg-white font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                PhilHealth Number
              </label>
              <input
                type="text"
                name="philHealthNumber"
                value={formData.philHealthNumber || ""}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full border border-slate-300 p-2 rounded-xl bg-white font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Pag-IBIG Number
              </label>
              <input
                type="text"
                name="pagIbigNumber"
                value={formData.pagIbigNumber || ""}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full border border-slate-300 p-2 rounded-xl bg-white font-mono font-semibold"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Deduction Schedule Type
          </label>
          <select
            name="deductionType"
            value={formData.deductionType || "Per Pay Period"}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
          >
            <option value="Per Pay Period">
              Per Pay Period (Split per cutoff)
            </option>
            <option value="Every End of Month">Every End of Month</option>
          </select>
        </div>
      </div>

      {/* SECTION 6: Emergency Contact */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <h3 className="font-bold uppercase tracking-wider text-[11px] text-amber-800 border-b pb-1.5">
          6. Emergency Contact Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              name="emergencyContactName"
              value={formData.emergencyContactName || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Contact Number
            </label>
            <input
              type="text"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Relation
            </label>
            <input
              type="text"
              name="relationToEmployee"
              value={formData.relationToEmployee || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Emergency Address
          </label>
          <input
            type="text"
            name="emergencyContactAddress"
            value={formData.emergencyContactAddress || ""}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full border border-slate-300 p-2.5 rounded-xl bg-white font-semibold"
          />
        </div>
      </div>
    </div>
  );
}
