import { useEffect, useState, useCallback } from "react";
import {
  Clock,
  PlusCircle,
  CheckCircle,
  X,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

interface AttendanceRequestItem {
  id: number;
  employeeId: number;
  employee?: { firstName: string; lastName: string };
  type: string;
  targetDate: string;
  status: string;
  dateRequested: string;
}

interface TimeRecordItem {
  id: number;
  employeeId: number;
  type: string;
  date: string;
  dateCreated: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

export default function Timesheet() {
  const [activeTab, setActiveTab] = useState<"records" | "requests">("records");
  const [records, setRecords] = useState<TimeRecordItem[]>([]);
  const [requests, setRequests] = useState<AttendanceRequestItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualType, setManualType] = useState("IN");

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "";
  const [selectedEmployee, setSelectedEmployee] =
    useState<string>(loggedInEmployeeId);

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

  useEffect(() => {
    if (role === "Admin") {
      api
        .get("/Employees")
        .then((res) => {
          setEmployees(res.data);
          if (res.data.length > 0 && !selectedEmployee) {
            setSelectedEmployee(res.data[0].id.toString());
          }
        })
        .catch(() => {});
    }
  }, [role, selectedEmployee]);

  const loadData = useCallback(async () => {
    const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;
    if (!targetId) return;

    try {
      const res = await api.get(`/TimeRecords/employee/${targetId}`);
      setRecords(res.data);
    } catch {
      setRecords([]);
    }

    if (role === "Admin") {
      try {
        const reqRes = await api.get("/AttendanceRequests");
        setRequests(reqRes.data);
      } catch {
        setRequests([]);
      }
    }
  }, [selectedEmployee, loggedInEmployeeId, role]);

  useEffect(() => {
    let isMounted = true;
    const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;

    if (targetId) {
      api
        .get(`/TimeRecords/employee/${targetId}`)
        .then((res) => {
          if (isMounted) setRecords(res.data);
        })
        .catch(() => {
          if (isMounted) setRecords([]);
        });
    }

    if (role === "Admin") {
      api
        .get("/AttendanceRequests")
        .then((res) => {
          if (isMounted) setRequests(res.data);
        })
        .catch(() => {
          if (isMounted) setRequests([]);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [selectedEmployee, loggedInEmployeeId, role]);

  const triggerDeleteRecordModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Time Record",
      message:
        "Are you sure you want to delete this attendance record? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: () => executeDeleteRecord(id),
    });
  };

  const executeDeleteRecord = async (id: number) => {
    try {
      await api.delete(`/TimeRecords/${id}`);
      showToast("Time record deleted successfully.");
      loadData();
    } catch {
      showToast("Failed to delete time record.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const triggerDeleteRequestModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Attendance Request",
      message:
        "Are you sure you want to delete this attendance correction request? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: () => executeDeleteRequest(id),
    });
  };

  const executeDeleteRequest = async (id: number) => {
    try {
      await api.delete(`/AttendanceRequests/${id}`);
      showToast("Attendance request deleted successfully.");
      loadData();
    } catch {
      showToast("Failed to delete request.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;

    try {
      if (role === "Admin") {
        await api.post("/TimeRecords/time-in-out", {
          employeeId: Number(targetId),
          type: manualType,
          dateCreated: new Date(manualDate).toISOString(),
        });
        showToast("Attendance record added successfully!");
      } else {
        await api.post("/AttendanceRequests", {
          employeeId: Number(targetId),
          type: manualType,
          targetDate: new Date(manualDate).toISOString(),
        });
        showToast("Missed attendance correction requested successfully!");
      }
      setShowManualModal(false);
      setManualDate("");
      loadData();
    } catch {
      showToast("Failed to process attendance entry.", "error");
    }
  };

  const triggerApproveModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Approve Attendance Request",
      message:
        "Are you sure you want to approve this missed attendance correction?",
      confirmText: "Approve",
      type: "primary",
      onConfirm: () => executeApprove(id),
    });
  };

  const executeApprove = async (id: number) => {
    try {
      await api.put(`/AttendanceRequests/${id}/approve`);
      showToast("Attendance request approved and logged!");
      loadData();
    } catch {
      showToast("Failed to approve request.", "error");
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
            <Clock size={22} className="text-blue-600" /> Attendance Timesheet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review recorded logs or file manual corrections for missed
            attendance.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xs hover:bg-blue-700 transition-all cursor-pointer justify-center w-full sm:w-auto"
          >
            <PlusCircle size={16} />
            {role === "Admin" ? "Input" : "File Missed Attendance"}
          </button>

          {role === "Admin" && employees.length > 0 && (
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="border border-slate-300 bg-white p-2 rounded-lg text-sm w-full sm:w-48 focus:outline-hidden"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.lastName}, {emp.firstName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Admin Tabs for Requests vs Records */}
      {role === "Admin" && (
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("records")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "records"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Recorded Logs
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "requests"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Pending Requests{" "}
            {requests.filter((r) => r.status === "Pending").length > 0 && (
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {requests.filter((r) => r.status === "Pending").length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Timesheet Data Table */}
      {activeTab === "records" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-125">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Date Logged</th>
                  <th className="p-4 font-semibold text-right">Timestamp</th>
                  {role === "Admin" && (
                    <th className="p-4 font-semibold text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {records.length > 0 ? (
                  records.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${record.type === "IN" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                        >
                          Time {record.type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        {new Date(
                          record.dateCreated || record.date,
                        ).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-900">
                        {new Date(
                          record.dateCreated || record.date,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      {role === "Admin" && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => triggerDeleteRecordModal(record.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center justify-end"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={role === "Admin" ? 4 : 3}
                      className="p-8 text-center text-slate-500 text-sm"
                    >
                      No attendance logs found for this employee.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-150">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Employee</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Target Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 font-medium text-slate-900">
                        {req.employee
                          ? `${req.employee.lastName}, ${req.employee.firstName}`
                          : `ID: ${req.employeeId}`}
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        Time {req.type}
                      </td>
                      <td className="p-4 text-slate-600">
                        {new Date(req.targetDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${req.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {req.status === "Pending" && (
                            <button
                              onClick={() => triggerApproveModal(req.id)}
                              className="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                              title="Approve Request"
                            >
                              <CheckCircle size={16} /> Approve
                            </button>
                          )}
                          <button
                            onClick={() => triggerDeleteRequestModal(req.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Request"
                          >
                            <Trash2 size={16} />
                          </button>
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
                      No pending attendance correction requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Input / Request Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                {role === "Admin"
                  ? "Direct Administrative Input"
                  : "File Attendance Correction"}
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Log Type
                </label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="IN">Time IN</option>
                  <option value="OUT">Time OUT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Target Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                >
                  Submit
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
