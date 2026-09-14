import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { Plus, CheckCircle, Trash2, X, Clock } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

interface Overtime {
  id: number;
  employeeId: number;
  employeeName: string;
  overtimeDate: string;
  overtimeHours: number;
  status: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

export default function Overtime() {
  const [overtimes, setOvertimes] = useState<Overtime[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = Number(localStorage.getItem("employeeId")) || 1;

  const [formData, setFormData] = useState({
    employeeId: loggedInEmployeeId,
    overtimeDate: "",
    overtimeHours: 2,
  });

  // Modal & Toast States
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type?: "danger" | "primary";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (text: string, type: "success" | "error" = "success") => {
      setToast({ text, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const loadOvertimes = useCallback(async () => {
    try {
      const res = await api.get("/Overtimes");
      // Filter records for regular employees so they only see their own entries
      if (role === "Employee") {
        const filtered = res.data.filter(
          (ot: Overtime) => ot.employeeId === loggedInEmployeeId,
        );
        setOvertimes(filtered);
      } else {
        setOvertimes(res.data);
      }
    } catch {
      showToast("Failed to load overtime records.", "error");
    }
  }, [role, loggedInEmployeeId, showToast]);

  useEffect(() => {
    let isMounted = true;

    api
      .get("/Overtimes")
      .then((res) => {
        if (isMounted) {
          if (role === "Employee") {
            const filtered = res.data.filter(
              (ot: Overtime) => ot.employeeId === loggedInEmployeeId,
            );
            setOvertimes(filtered);
          } else {
            setOvertimes(res.data);
          }
        }
      })
      .catch(() => {
        if (isMounted) showToast("Failed to load overtime records.", "error");
      });

    if (role === "Admin") {
      api
        .get("/Employees")
        .then((res) => {
          if (isMounted && res.data.length > 0) {
            setEmployees(res.data);
            setFormData((prev) => ({ ...prev, employeeId: res.data[0].id }));
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [role, loggedInEmployeeId, showToast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/Overtimes", {
        employeeId:
          role === "Admin" ? Number(formData.employeeId) : loggedInEmployeeId,
        overtimeDate: new Date(formData.overtimeDate).toISOString(),
        overtimeHours: Number(formData.overtimeHours),
        status: role === "Admin" ? "Approved" : "In Review",
      });
      setShowModal(false);
      setFormData({
        employeeId:
          role === "Admin" && employees.length > 0
            ? employees[0].id
            : loggedInEmployeeId,
        overtimeDate: "",
        overtimeHours: 2,
      });
      showToast("Overtime record submitted successfully!");
      loadOvertimes();
    } catch {
      showToast("Failed to submit overtime request.", "error");
    }
  };

  const triggerApproveModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Approve Overtime Request",
      message: "Are you sure you want to approve this overtime request?",
      confirmText: "Approve",
      type: "primary",
      onConfirm: () => executeApprove(id),
    });
  };

  const executeApprove = async (id: number) => {
    try {
      await api.put(`/Overtimes/${id}/status`, JSON.stringify("Approved"), {
        headers: { "Content-Type": "application/json" },
      });
      showToast("Overtime request approved!");
      loadOvertimes();
    } catch {
      showToast("Failed to approve overtime.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const triggerDeleteModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Overtime Request",
      message:
        "Are you sure you want to delete this overtime record? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: () => executeDelete(id),
    });
  };

  const executeDelete = async (id: number) => {
    try {
      await api.delete(`/Overtimes/${id}`);
      showToast("Overtime record deleted successfully.");
      loadOvertimes();
    } catch {
      showToast("Failed to delete overtime record.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock size={22} className="text-blue-600" /> Overtime Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track extended working hours and review submissions.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData((prev) => ({
              ...prev,
              employeeId:
                role === "Admin" && employees.length > 0
                  ? employees[0].id
                  : loggedInEmployeeId,
            }));
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xs hover:bg-blue-700 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus size={16} />{" "}
          {role === "Admin" ? "Add Overtime Record" : "File Overtime"}
        </button>
      </div>

      {/* Responsive Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-150">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Hours</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {overtimes.length > 0 ? (
                overtimes.map((ot) => (
                  <tr
                    key={ot.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900">
                      {ot.employeeName || "Employee"}
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(ot.overtimeDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-600">
                      {ot.overtimeHours} hrs
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          ot.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ot.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {role === "Admin" && ot.status !== "Approved" && (
                          <button
                            onClick={() => triggerApproveModal(ot.id)}
                            className="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Approve Overtime"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {(role === "Admin" || ot.status === "In Review") && (
                          <button
                            onClick={() => triggerDeleteModal(ot.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Request"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500 text-sm"
                  >
                    No overtime records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* File / Add Overtime Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">
                {role === "Admin"
                  ? "Add Overtime Record"
                  : "File Overtime Request"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {role === "Admin" && employees.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Select Employee
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeId: Number(e.target.value),
                      })
                    }
                    className="w-full border border-slate-300 bg-white p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.lastName}, {emp.firstName} (ID: {emp.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Overtime Date
                </label>
                <input
                  type="date"
                  value={formData.overtimeDate}
                  onChange={(e) =>
                    setFormData({ ...formData, overtimeDate: e.target.value })
                  }
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Overtime Hours
                </label>
                <input
                  type="number"
                  value={formData.overtimeHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      overtimeHours: Number(e.target.value),
                    })
                  }
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  min={1}
                  max={12}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                >
                  {role === "Admin" ? "Add Record" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification */}
      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
