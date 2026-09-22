import { useState, useEffect } from "react";
import api from "../services/api";
import {
  User,
  Phone,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Lock,
  Mail,
  MapPin,
  Briefcase,
  IdCard,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import type { Employee } from "../types/employee";

export default function Profile() {
  const role = localStorage.getItem("role") || "Employee";
  const employeeId = localStorage.getItem("employeeId");

  const isSuperAdmin = role === "Admin" && !employeeId;

  const [activeTab, setActiveTab] = useState<"info" | "security">("info");

  const [initialEmployee, setInitialEmployee] = useState<Employee | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(
    () => !isSuperAdmin && Boolean(employeeId),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<"profile" | "password">(
    "profile",
  );

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isSuperAdmin || !employeeId) return;

    api
      .get(`/Employees/${employeeId}`)
      .then((res) => {
        setInitialEmployee(res.data);
        setEmployee(res.data);
        setLoading(false);
      })
      .catch(() => {
        setToast({ message: "Failed to load profile data.", type: "error" });
        setLoading(false);
      });
  }, [isSuperAdmin, employeeId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!employee) return;
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setEmployee({ ...employee, [name]: val });
  };

  const hasChanges =
    JSON.stringify(employee) !== JSON.stringify(initialEmployee);

  const handleDiscard = () => {
    if (initialEmployee) {
      setEmployee({ ...initialEmployee });
      setToast({ message: "Changes discarded.", type: "success" });
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionType("profile");
    setIsConfirmOpen(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ message: "New passwords do not match.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setToast({
        message: "Password must be at least 6 characters long.",
        type: "error",
      });
      return;
    }
    setActionType("password");
    setIsConfirmOpen(true);
  };

  const executeConfirmedAction = async () => {
    setIsConfirmOpen(false);
    setIsSubmitting(true);

    if (actionType === "profile") {
      if (!employee) {
        setIsSubmitting(false);
        return;
      }
      try {
        await api.put(`/Employees/profile/${employeeId}`, employee);
        setInitialEmployee(employee);
        setToast({ message: "Profile updated successfully!", type: "success" });
      } catch {
        setToast({ message: "Failed to update profile.", type: "error" });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        await api.post("/Auth/change-password", {
          username: isSuperAdmin
            ? "admin"
            : employee?.username || employee?.employeeIdNumber,
          currentPassword,
          newPassword,
        });
        setToast({
          message: "Password updated successfully!",
          type: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: string } };
        setToast({
          message: errorObj.response?.data || "Failed to update password.",
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">
          Loading profile details...
        </p>
      </div>
    );
  }

  const userInitials = employee
    ? `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`
    : "AD";

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 pb-16">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={
          actionType === "profile"
            ? "Save Profile Changes"
            : "Confirm Password Change"
        }
        message={
          actionType === "profile"
            ? "Are you sure you want to update your profile details?"
            : "Are you sure you want to change your account password?"
        }
        onConfirm={executeConfirmedAction}
        onClose={() => setIsConfirmOpen(false)}
      />

      {/* Hero Profile Identity Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-(--primary) text-slate-950 font-bold text-xl sm:text-2xl flex items-center justify-center shadow-sm shrink-0">
            {userInitials}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                {isSuperAdmin
                  ? "System Administrator"
                  : `${employee?.firstName} ${employee?.lastName}`}
              </h1>
              <span className="text-[11px] px-2.5 py-1 bg-amber-50 text-amber-800 font-semibold rounded-md border border-amber-200/60 uppercase">
                {role}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Briefcase size={14} className="text-slate-400" />
              {isSuperAdmin
                ? "Full Infrastructure Access"
                : employee?.jobTitle || "Employee"}
            </p>
          </div>
        </div>

        {!isSuperAdmin && (
          <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Employee ID
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 mt-0.5">
              {employee?.employeeIdNumber}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      {!isSuperAdmin && (
        <div className="flex border-b border-slate-200 gap-8 px-2">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "info"
                ? "border-(--primary) text-amber-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <User size={14} /> Personal Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "security"
                ? "border-(--primary) text-amber-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <KeyRound size={14} /> Account Security
          </button>
        </div>
      )}

      {/* Content Panels */}
      {isSuperAdmin ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
              <KeyRound size={18} />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Update Administrator Credentials
            </h2>
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="p-5 sm:p-6 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 bg-white p-2.5 pr-10 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 bg-white p-2.5 pr-10 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 bg-white p-2.5 pr-10 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-5 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl font-semibold text-xs transition-all shadow-sm cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Updating...
                  </>
                ) : (
                  "Update Admin Password"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        employee && (
          <div className="space-y-5">
            {activeTab === "info" ? (
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* Account & Personal Information */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
                      <IdCard size={18} />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Personal & Account Information
                    </h2>
                  </div>

                  <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={employee.username || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={employee.firstName || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
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
                        value={employee.middleName || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={employee.lastName || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Job Title
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={employee.jobTitle || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={employee.gender || "Male"}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer disabled:bg-slate-50"
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
                        value={employee.civilStatus || "Single"}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer disabled:bg-slate-50"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Blood Type
                      </label>
                      <input
                        type="text"
                        name="bloodType"
                        value={employee.bloodType || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Age
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={employee.age || 0}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact & Address */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
                      <Phone size={18} />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Contact & Address Details
                    </h2>
                  </div>

                  <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Contact Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="contactNumber"
                          value={employee.contactNumber || ""}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="w-full border border-slate-300 bg-white p-2.5 pl-9 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                        />
                        <Phone
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Personal Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="personalEmailAddress"
                          value={employee.personalEmailAddress || ""}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="w-full border border-slate-300 bg-white p-2.5 pl-9 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                        />
                        <Mail
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Current Address
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="currentAddress"
                          value={employee.currentAddress || ""}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="w-full border border-slate-300 bg-white p-2.5 pl-9 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                        />
                        <MapPin
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Permanent Address
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="permanentAddress"
                          value={employee.permanentAddress || ""}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="w-full border border-slate-300 bg-white p-2.5 pl-9 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                        />
                        <MapPin
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory Numbers */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
                      <IdCard size={18} />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Statutory Information
                    </h2>
                  </div>

                  <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        SSS Number
                      </label>
                      <input
                        type="text"
                        name="sssNumber"
                        value={employee.sssNumber || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        PhilHealth Number
                      </label>
                      <input
                        type="text"
                        name="philHealthNumber"
                        value={employee.philHealthNumber || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Pag-IBIG Number
                      </label>
                      <input
                        type="text"
                        name="pagIbigNumber"
                        value={employee.pagIbigNumber || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                      <ShieldAlert size={18} />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Emergency Contact
                    </h2>
                  </div>

                  <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={employee.emergencyContactName || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        name="emergencyContactNumber"
                        value={employee.emergencyContactNumber || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Relation
                      </label>
                      <input
                        type="text"
                        name="relationToEmployee"
                        value={employee.relationToEmployee || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Emergency Contact Address
                      </label>
                      <input
                        type="text"
                        name="emergencyContactAddress"
                        value={employee.emergencyContactAddress || ""}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold">
                    {hasChanges ? (
                      <>
                        <AlertCircle
                          size={16}
                          className="text-amber-600 shrink-0"
                        />
                        <span>You have unsaved changes on your profile.</span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-medium">
                        All changes saved.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {hasChanges && (
                      <button
                        type="button"
                        onClick={handleDiscard}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <RotateCcw size={14} /> Discard
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !hasChanges}
                      className="flex-1 sm:flex-none py-2 px-5 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl font-semibold text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />{" "}
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={14} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Account Security Tab */
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Change Account Password
                    </h2>
                    <p className="text-xs text-slate-500">
                      Ensure your account uses a strong, unique password.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handlePasswordSubmit}
                  className="p-5 sm:p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full border border-slate-300 bg-white p-2.5 pr-10 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCurrentPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full border border-slate-300 bg-white p-2.5 pr-10 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full border border-slate-300 bg-white p-2.5 pr-10 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto py-2 px-5 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl font-semibold text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />{" "}
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
