import { useState, useEffect } from "react";
import api from "../services/api";
import { User, Phone, ShieldAlert, KeyRound, Eye, EyeOff } from "lucide-react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

interface EmployeeProfile {
  employeeIdNumber: string;
  username: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  currentAddress: string;
  contactNumber: string;
  personalEmailAddress: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  relationToEmployee: string;
  emergencyContactAddress: string;
}

export default function Profile() {
  const role = localStorage.getItem("role") || "Employee";
  const employeeId = localStorage.getItem("employeeId");

  // Only treat as the hardcoded super-admin if there is no employeeId and role is Admin
  const isSuperAdmin = role === "Admin" && !employeeId;

  const [initialEmployee, setInitialEmployee] =
    useState<EmployeeProfile | null>(null);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(
    () => !isSuperAdmin && Boolean(employeeId),
  );

  // Toast & Modal States
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

  // Show/Hide Password States
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!employee) return;
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  const hasChanges =
    JSON.stringify(employee) !== JSON.stringify(initialEmployee);

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

    if (actionType === "profile") {
      if (!employee) return;
      try {
        await api.put(`/Employees/profile/${employeeId}`, {
          username: employee.username,
          firstName: employee.firstName,
          lastName: employee.lastName,
          jobTitle: employee.jobTitle,
          currentAddress: employee.currentAddress,
          contactNumber: employee.contactNumber,
          personalEmailAddress: employee.personalEmailAddress,
          emergencyContactName: employee.emergencyContactName,
          emergencyContactNumber: employee.emergencyContactNumber,
          relationToEmployee: employee.relationToEmployee,
          emergencyContactAddress: employee.emergencyContactAddress,
        });
        setInitialEmployee(employee);
        setToast({ message: "Profile updated successfully!", type: "success" });
      } catch {
        setToast({ message: "Failed to update profile.", type: "error" });
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
      }
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500">Loading profile...</div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
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

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {isSuperAdmin
            ? "Admin Security Settings"
            : "Employee Profile & Security"}
        </h1>
        <p className="text-xs text-slate-500">
          {isSuperAdmin
            ? "Manage your administrator account credentials."
            : "Manage your personal information, emergency contacts, and account security credentials."}
        </p>
      </div>

      {isSuperAdmin ? (
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <KeyRound size={16} className="text-blue-600" /> Change Admin
            Password
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="py-2.5 px-6 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium text-xs shadow-xs cursor-pointer"
            >
              Update Admin Password
            </button>
          </div>
        </form>
      ) : (
        employee && (
          <div className="space-y-6">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Employment Details (Employee ID read-only, Username, First Name, Last Name, Job Title editable) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                  <User size={16} className="text-blue-600" /> Employment
                  Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">
                      Employee ID (Read-Only)
                    </span>
                    <span className="font-semibold text-slate-800 block p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      {employee.employeeIdNumber}
                    </span>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={employee.username || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={employee.firstName || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={employee.lastName || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={employee.jobTitle || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Contact & Address Information */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                  <Phone size={16} className="text-blue-600" /> Contact &
                  Address Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      name="contactNumber"
                      value={employee.contactNumber || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Personal Email Address
                    </label>
                    <input
                      type="email"
                      name="personalEmailAddress"
                      value={employee.personalEmailAddress || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-700 mb-1">
                      Current Address
                    </label>
                    <input
                      type="text"
                      name="currentAddress"
                      value={employee.currentAddress || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Emergency Contact */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                  <ShieldAlert size={16} className="text-blue-600" /> Emergency
                  Contact
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={employee.emergencyContactName || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      name="emergencyContactNumber"
                      value={employee.emergencyContactNumber || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Relation
                    </label>
                    <input
                      type="text"
                      name="relationToEmployee"
                      value={employee.relationToEmployee || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-medium text-slate-700 mb-1">
                      Emergency Contact Address
                    </label>
                    <input
                      type="text"
                      name="emergencyContactAddress"
                      value={employee.emergencyContactAddress || ""}
                      onChange={handleChange}
                      className="w-full p-2.5 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {hasChanges && (
                <div className="flex justify-end animate-fadeIn">
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium text-xs shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            {/* Change Password Section */}
            <form
              onSubmit={handlePasswordSubmit}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
            >
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <KeyRound size={16} className="text-blue-600" /> Change Password
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2.5 pr-10 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 pr-10 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2.5 pr-10 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium text-xs shadow-xs cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        )
      )}
    </div>
  );
}
