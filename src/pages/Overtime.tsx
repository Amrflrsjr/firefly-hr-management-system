import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";
import {
  Plus,
  CheckCircle,
  Trash2,
  X,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Ban,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

interface OvertimeItem {
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

const ITEMS_PER_PAGE = 10;

export default function Overtime() {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [overtimes, setOvertimes] = useState<OvertimeItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showModal, setShowModal] = useState(false);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "";

  // Ensure non-admin accounts are locked strictly to their own ID, while admin defaults to "all"
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    role === "Admin" ? "all" : loggedInEmployeeId,
  );

  const [formData, setFormData] = useState({
    employeeId: loggedInEmployeeId,
    overtimeDate: "",
    overtimeHours: 2,
  });

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
    setLoading(true);
    const effectiveId =
      role === "Admin" ? selectedEmployee : loggedInEmployeeId;

    try {
      let endpoint = "/Overtimes";
      if (effectiveId && effectiveId !== "all") {
        endpoint = `/Overtimes/employee/${effectiveId}`;
      }
      const res = await api.get(endpoint);
      setOvertimes(res.data || []);
    } catch {
      showToast("Failed to load overtime records.", "error");
      setOvertimes([]);
    } finally {
      setLoading(false);
    }
  }, [role, selectedEmployee, loggedInEmployeeId, showToast]);

  useEffect(() => {
    let isMounted = true;

    const initLoad = async () => {
      if (role === "Admin") {
        try {
          const res = await api.get("/Employees");
          if (!isMounted) return;
          setEmployees(res.data);
          await loadOvertimes();
        } catch {
          if (isMounted) setLoading(false);
        }
      } else if (loggedInEmployeeId) {
        await loadOvertimes();
      } else {
        if (isMounted) setLoading(false);
      }
    };

    initLoad();

    return () => {
      isMounted = false;
    };
  }, [role, loggedInEmployeeId, loadOvertimes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const targetId =
      role === "Admin" ? formData.employeeId : loggedInEmployeeId;

    if (!targetId || targetId === "all") {
      showToast("Please select a valid employee.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/Overtimes", {
        employeeId: Number(targetId),
        overtimeDate: new Date(formData.overtimeDate).toISOString(),
        overtimeHours: Number(formData.overtimeHours),
        status: role === "Admin" ? "Approved" : "In Review",
      });
      setShowModal(false);
      setFormData({
        employeeId:
          role === "Admin" && employees.length > 0
            ? employees[0].id.toString()
            : loggedInEmployeeId,
        overtimeDate: "",
        overtimeHours: 2,
      });
      showToast("Overtime record submitted successfully!");
      loadOvertimes();
    } catch {
      showToast("Failed to submit overtime request.", "error");
    } finally {
      setIsSubmitting(false);
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

  const triggerDeclineModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Decline Overtime Request",
      message: "Are you sure you want to decline this overtime request?",
      confirmText: "Decline",
      type: "danger",
      onConfirm: () => executeDecline(id),
    });
  };

  const executeDecline = async (id: number) => {
    try {
      await api.put(`/Overtimes/${id}/reject`);
      showToast("Overtime request declined successfully.");
      loadOvertimes();
    } catch {
      showToast("Failed to decline overtime request.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const triggerCancelModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Cancel Overtime Request",
      message: "Are you sure you want to cancel this pending overtime request?",
      confirmText: "Cancel Request",
      type: "danger",
      onConfirm: () => executeCancel(id),
    });
  };

  const executeCancel = async (id: number) => {
    try {
      await api.put(`/Overtimes/${id}/cancel`);
      showToast("Overtime request cancelled successfully.");
      loadOvertimes();
    } catch {
      showToast("Failed to cancel overtime request.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const triggerDeleteModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Overtime Record",
      message:
        "Are you sure you want to delete this overtime record permanently?",
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

  // Separate data according to active tab ("all" excludes pending items so they stay in "pending")
  const filteredOvertimes = useMemo(() => {
    if (activeTab === "pending") {
      return overtimes.filter((ot) => ot.status === "In Review");
    }
    return overtimes.filter((ot) => ot.status !== "In Review");
  }, [overtimes, activeTab]);

  const pendingCount = useMemo(() => {
    return overtimes.filter((ot) => ot.status === "In Review").length;
  }, [overtimes]);

  const totalPages = Math.ceil(filteredOvertimes.length / ITEMS_PER_PAGE);
  const paginatedOvertimes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOvertimes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOvertimes, currentPage]);

  const hasActionsInOvertime = useMemo(() => {
    return paginatedOvertimes.some((ot) => {
      if (role === "Admin") return true;
      return ot.status === "In Review";
    });
  }, [paginatedOvertimes, role]);

  const tableColSpan =
    role === "Admin" && selectedEmployee === "all"
      ? hasActionsInOvertime
        ? 6
        : 5
      : hasActionsInOvertime
        ? 5
        : 4;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
              <Clock size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Overtime Management
            </h1>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Track extended working hours and review submissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {role === "Admin" && employees.length > 0 && (
            <div className="relative w-full sm:w-56">
              <select
                value={selectedEmployee}
                disabled={loading}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  setCurrentPage(1);
                  loadOvertimes();
                }}
                className="w-full appearance-none border border-slate-200 bg-slate-50 hover:bg-slate-100/80 px-3 py-2 pr-8 rounded-xl text-xs font-semibold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-(--primary) focus:bg-white disabled:opacity-50 cursor-pointer"
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.lastName}, {emp.firstName}
                  </option>
                ))}
              </select>
              <UserCheck
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          )}

          <button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center disabled:opacity-50 active:scale-[0.98]"
          >
            <Plus size={16} />{" "}
            {role === "Admin" ? "Add Overtime Record" : "File Overtime"}
          </button>
        </div>
      </div>

      {/* Tabs for All Overtime vs Pending Requests */}
      <div className="flex border-b border-slate-200 gap-8 px-2">
        <button
          onClick={() => {
            setActiveTab("all");
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "all"
              ? "border-(--primary) text-amber-900"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          All Overtime
        </button>
        <button
          onClick={() => {
            setActiveTab("pending");
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "pending"
              ? "border-(--primary) text-amber-900"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          {role === "Admin" ? "Pending Requests" : "My Pending Requests"}
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {role === "Admin" && selectedEmployee === "all" && (
                <th className="py-3.5 px-5">Employee</th>
              )}
              <th className="py-3.5 px-5">Date</th>
              <th className="py-3.5 px-5">Hours</th>
              <th className="py-3.5 px-5">Status</th>
              {hasActionsInOvertime && (
                <th className="py-3.5 px-5 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={tableColSpan}
                  className="py-12 text-center text-slate-400"
                >
                  <Loader2
                    size={24}
                    className="animate-spin text-amber-600 mx-auto mb-2"
                  />
                  <p className="text-xs font-semibold text-slate-500">
                    Loading overtime records...
                  </p>
                </td>
              </tr>
            ) : paginatedOvertimes.length > 0 ? (
              paginatedOvertimes.map((ot) => (
                <tr
                  key={ot.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {role === "Admin" && selectedEmployee === "all" && (
                    <td className="py-4 px-5 font-bold text-slate-900">
                      {ot.employeeName || "Employee"}
                    </td>
                  )}
                  <td className="py-4 px-5 text-slate-600 text-xs font-medium">
                    {new Date(ot.overtimeDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-4 px-5 font-mono text-xs font-bold text-slate-700">
                    {ot.overtimeHours} hrs
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        ot.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : ot.status === "Declined"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                            : ot.status === "Cancelled"
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200/60"
                      }`}
                    >
                      {ot.status === "Approved" ? (
                        <CheckCircle2 size={13} />
                      ) : ot.status === "Declined" ? (
                        <XCircle size={13} />
                      ) : ot.status === "Cancelled" ? (
                        <Ban size={13} />
                      ) : (
                        <AlertCircle size={13} />
                      )}
                      {ot.status}
                    </span>
                  </td>
                  {hasActionsInOvertime && (
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {role === "Admin" && ot.status === "In Review" && (
                          <>
                            <button
                              onClick={() => triggerApproveModal(ot.id)}
                              className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-emerald-200/60"
                              title="Approve Overtime"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={() => triggerDeclineModal(ot.id)}
                              className="text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-rose-200/60"
                              title="Decline Overtime"
                            >
                              <X size={14} /> Decline
                            </button>
                          </>
                        )}

                        {role !== "Admin" && ot.status === "In Review" && (
                          <button
                            onClick={() => triggerCancelModal(ot.id)}
                            className="text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-slate-200"
                            title="Cancel Request"
                          >
                            <Ban size={14} /> Cancel
                          </button>
                        )}

                        {role === "Admin" && (
                          <button
                            onClick={() => triggerDeleteModal(ot.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={tableColSpan}
                  className="py-12 text-center text-slate-400 text-xs"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <AlertCircle size={32} strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-slate-600">
                      No overtime records found
                    </p>
                    <p className="text-xs text-slate-400">
                      Submitted overtime applications will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Grid View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
            <Loader2 size={24} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              Loading cards...
            </p>
          </div>
        ) : paginatedOvertimes.length > 0 ? (
          paginatedOvertimes.map((ot) => (
            <div
              key={ot.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {ot.employeeName || "Employee"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Date: {new Date(ot.overtimeDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {role === "Admin" && ot.status === "In Review" && (
                    <>
                      <button
                        onClick={() => triggerApproveModal(ot.id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => triggerDeclineModal(ot.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  {role !== "Admin" && ot.status === "In Review" && (
                    <button
                      onClick={() => triggerCancelModal(ot.id)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Cancel Request"
                    >
                      <Ban size={16} />
                    </button>
                  )}
                  {role === "Admin" && (
                    <button
                      onClick={() => triggerDeleteModal(ot.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-bold text-slate-700">
                  {ot.overtimeHours} Hours
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                    ot.status === "Approved"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : ot.status === "Declined"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : ot.status === "Cancelled"
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {ot.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No overtime records found.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* File Overtime Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">
                {role === "Admin"
                  ? "Add Overtime Record"
                  : "File Overtime Request"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {role === "Admin" && employees.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Select Employee
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeId: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold cursor-pointer"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.lastName}, {emp.firstName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Overtime Date
                </label>
                <input
                  type="date"
                  value={formData.overtimeDate}
                  onChange={(e) =>
                    setFormData({ ...formData, overtimeDate: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
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
                  disabled={isSubmitting}
                  className="w-full border border-slate-300 p-2.5 rounded-xl font-mono font-bold"
                  min={1}
                  max={12}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl font-semibold flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  {role === "Admin" ? "Add Record" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
