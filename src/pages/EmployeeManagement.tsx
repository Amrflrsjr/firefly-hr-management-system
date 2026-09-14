import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft, Plus, Trash2, X, ShieldCheck } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

interface Employee {
  id: number;
  employeeIdNumber: string;
  username: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  employmentType: string;
  officeType: string;
  isAdmin: boolean;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [formData, setFormData] = useState({
    employeeIdNumber: "",
    username: "",
    firstName: "",
    lastName: "",
    middleName: "",
    jobTitle: "",
    employmentType: "Regular",
    officeType: "Admin",
    dailySalary: 600,
    monthlyAllowance: 1000,
    deductionType: "Per Pay Period",
    isAdmin: false,
  });
  const navigate = useNavigate();

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.get("/Employees");
      setEmployees(res.data);
    } catch {
      showToast("Failed to load employees.", "error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEmployees();
  }, [loadEmployees]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/Employees", {
        ...formData,
        dateOfBirth: new Date().toISOString(),
        dateHired: new Date().toISOString(),
        declaredDateHired: new Date().toISOString(),
        employmentStatus: "Active",
      });
      setShowAddModal(false);
      setFormData({
        employeeIdNumber: "",
        username: "",
        firstName: "",
        lastName: "",
        middleName: "",
        jobTitle: "",
        employmentType: "Regular",
        officeType: "Admin",
        dailySalary: 600,
        monthlyAllowance: 1000,
        deductionType: "Per Pay Period",
        isAdmin: false,
      });
      loadEmployees();
      showToast("Successfully added new employee.");
    } catch {
      showToast("Failed to create employee.", "error");
    }
  };

  const executeDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/Employees/${deleteId}`);
      setEmployees(employees.filter((emp) => emp.id !== deleteId));
      showToast("Successfully deleted employee.");
    } catch {
      showToast("Failed to delete employee. Admin rights required.", "error");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Employee Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage organization staff records and roles.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xs hover:bg-blue-700 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Responsive Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-162.5">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">ID / Username</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Job Title</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 text-slate-600 font-mono text-xs">
                      <div>{emp.employeeIdNumber}</div>
                      <div className="text-[10px] text-blue-600 font-semibold">
                        User: {emp.username || "N/A"}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      {emp.lastName}, {emp.firstName}
                    </td>
                    <td className="p-4 text-slate-600">{emp.jobTitle}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {emp.employmentType}
                      </span>
                    </td>
                    <td className="p-4">
                      {emp.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <ShieldCheck size={12} /> Admin
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          Employee
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setDeleteId(emp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Employee"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-500 text-sm"
                  >
                    No employees registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-lg w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">
                Add New Employee
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Employee ID Number
                  </label>
                  <input
                    type="text"
                    value={formData.employeeIdNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeIdNumber: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Login Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. jdoe"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Office Type
                  </label>
                  <select
                    value={formData.officeType}
                    onChange={(e) =>
                      setFormData({ ...formData, officeType: e.target.value })
                    }
                    className="w-full border border-slate-300 bg-white p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Production">Production</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Daily Salary (PHP)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={formData.dailySalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailySalary: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Monthly Allowance (PHP)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formData.monthlyAllowance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyAllowance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Admin Access Toggle Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAdminToggle"
                  checked={formData.isAdmin}
                  onChange={(e) =>
                    setFormData({ ...formData, isAdmin: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="isAdminToggle"
                  className="text-xs font-medium text-slate-700 cursor-pointer select-none"
                >
                  Grant Administrator Privileges (Can manage staff and approve
                  requests)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                >
                  Save Employee Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Employee"
        message="Are you sure you want to delete this employee record? This action cannot be undone."
        confirmText="Delete"
        type="danger"
        onConfirm={executeDelete}
        onClose={() => setDeleteId(null)}
      />

      {/* Reusable Toast Notification */}
      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
