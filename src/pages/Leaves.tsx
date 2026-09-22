import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";
import {
  Plus,
  CheckCircle,
  Trash2,
  X,
  Calendar as CalendarIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Ban,
  ChevronDown,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

interface Leave {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveDate: string;
  leaveHours: number;
  status: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

const ITEMS_PER_PAGE = 5;

export default function Leaves() {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showModal, setShowModal] = useState(false);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "";

  // Admins default to "all" employees, non-admin defaults to their own ID
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    role === "Admin" ? "all" : loggedInEmployeeId,
  );

  const [formData, setFormData] = useState({
    employeeId: "",
    leaveDate: "",
    leaveHours: 8,
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

  const loadLeaves = useCallback(
    async (targetEmpId: string) => {
      setLoading(true);
      const effectiveId = role === "Admin" ? targetEmpId : loggedInEmployeeId;

      try {
        let endpoint = "/Leaves";
        if (effectiveId && effectiveId !== "all") {
          endpoint = `/Leaves/employee/${effectiveId}`;
        }
        const res = await api.get(endpoint);
        setLeaves(res.data || []);
      } catch {
        showToast("Failed to load leaves.", "error");
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    },
    [role, loggedInEmployeeId, showToast],
  );

  // Initial Load
  useEffect(() => {
    let isMounted = true;

    const initLoad = async () => {
      if (role === "Admin") {
        try {
          const res = await api.get("/Employees");
          if (!isMounted) return;
          setEmployees(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              employeeId: String(res.data[0].id),
            }));
          }
          await loadLeaves("all");
        } catch {
          if (isMounted) setLoading(false);
        }
      } else if (loggedInEmployeeId) {
        await loadLeaves(loggedInEmployeeId);
      } else {
        if (isMounted) setLoading(false);
      }
    };

    initLoad();

    return () => {
      isMounted = false;
    };
  }, [role, loggedInEmployeeId, loadLeaves]);

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
      await api.post("/Leaves", {
        employeeId: Number(targetId),
        leaveDate: new Date(formData.leaveDate).toISOString(),
        leaveHours: Number(formData.leaveHours),
        status: role === "Admin" ? "Approved" : "In Review",
      });
      setShowModal(false);
      setFormData({
        employeeId:
          role === "Admin" && employees.length > 0
            ? employees[0].id.toString()
            : loggedInEmployeeId,
        leaveDate: "",
        leaveHours: 8,
      });
      showToast("Leave request submitted successfully!");
      loadLeaves(selectedEmployee);
    } catch {
      showToast("Failed to submit leave request.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerApproveModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Approve Leave Request",
      message: "Are you sure you want to approve this leave request?",
      confirmText: "Approve",
      type: "primary",
      onConfirm: () => executeApprove(id),
    });
  };

  const executeApprove = async (id: number) => {
    try {
      await api.put(`/Leaves/${id}/status`, JSON.stringify("Approved"), {
        headers: { "Content-Type": "application/json" },
      });
      showToast("Leave request approved!");
      loadLeaves(selectedEmployee);
    } catch {
      showToast("Failed to approve leave.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const triggerDeclineModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Decline Leave Request",
      message: "Are you sure you want to decline this leave request?",
      confirmText: "Decline",
      type: "danger",
      onConfirm: () => executeDecline(id),
    });
  };

  const executeDecline = async (id: number) => {
    try {
      await api.put(`/Leaves/${id}/reject`);
      showToast("Leave request declined successfully.");
      loadLeaves(selectedEmployee);
    } catch {
      showToast("Failed to decline leave request.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const triggerCancelModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Cancel Leave Request",
      message: "Are you sure you want to cancel this pending leave request?",
      confirmText: "Cancel Request",
      type: "danger",
      onConfirm: () => executeCancel(id),
    });
  };

  const executeCancel = async (id: number) => {
    try {
      await api.put(`/Leaves/${id}/cancel`);
      showToast("Leave request cancelled successfully.");
      loadLeaves(selectedEmployee);
    } catch {
      showToast("Failed to cancel leave request.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const triggerDeleteModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Leave Record",
      message: "Are you sure you want to delete this leave record permanently?",
      confirmText: "Delete",
      type: "danger",
      onConfirm: () => executeDelete(id),
    });
  };

  const executeDelete = async (id: number) => {
    try {
      await api.delete(`/Leaves/${id}`);
      showToast("Leave record deleted successfully.");
      loadLeaves(selectedEmployee);
    } catch {
      showToast("Failed to delete leave record.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const filteredLeaves = useMemo(() => {
    if (activeTab === "pending") {
      return leaves.filter((l) => l.status === "In Review");
    }
    return leaves.filter((l) => l.status !== "In Review");
  }, [leaves, activeTab]);

  const pendingCount = useMemo(() => {
    return leaves.filter((l) => l.status === "In Review").length;
  }, [leaves]);

  const totalPages = Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE);
  const paginatedLeaves = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeaves.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLeaves, currentPage]);

  const hasActionsInLeaves = useMemo(() => {
    return paginatedLeaves.some((leave) => {
      if (role === "Admin") return true;
      return leave.status === "In Review";
    });
  }, [paginatedLeaves, role]);

  const tableColSpan =
    role === "Admin" && selectedEmployee === "all"
      ? hasActionsInLeaves
        ? 5
        : 4
      : hasActionsInLeaves
        ? 4
        : 3;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Leave Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                File requests and track team leave approvals.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (role === "Admin" && employees.length > 0) {
                setFormData((prev) => ({
                  ...prev,
                  employeeId: String(employees[0].id),
                }));
              }
              setShowModal(true);
            }}
            disabled={loading}
            className="flex items-center gap-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center disabled:opacity-50 active:scale-[0.98]"
          >
            <Plus size={16} />{" "}
            {role === "Admin" ? "Add Leave Record" : "File Leave"}
          </button>
        </div>

        {/* Tabs for All Leaves vs Pending Requests */}
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
            All Leaves
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

        {/* Main Workspace Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Employee Selection Bar (For Admins) */}
          {role === "Admin" && employees.length > 0 && (
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50">
              <div className="max-w-md">
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2 flex items-center gap-1.5">
                  <UserCheck size={13} className="text-slate-400" />
                  Select Employee
                </label>
                <div className="relative">
                  <select
                    value={selectedEmployee}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedEmployee(val);
                      setCurrentPage(1);
                      loadLeaves(val);
                    }}
                    className="w-full h-11 appearance-none border border-slate-300 bg-white px-3 pr-10 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
                  >
                    <option value="all">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>
                        {emp.lastName}, {emp.firstName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  {role === "Admin" && selectedEmployee === "all" && (
                    <th className="py-3.5 px-6">Employee</th>
                  )}
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Hours</th>
                  <th className="py-3.5 px-6">Status</th>
                  {hasActionsInLeaves && (
                    <th className="py-3.5 px-6 text-right">Actions</th>
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
                        size={22}
                        className="animate-spin text-amber-600 mx-auto mb-2"
                      />
                      <p className="text-xs font-semibold text-slate-500">
                        Loading leave requests...
                      </p>
                    </td>
                  </tr>
                ) : paginatedLeaves.length > 0 ? (
                  paginatedLeaves.map((leave) => (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {role === "Admin" && selectedEmployee === "all" && (
                        <td className="py-4 px-6 font-semibold text-slate-900 text-xs">
                          {leave.employeeName || "Employee"}
                        </td>
                      )}
                      <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                        {new Date(leave.leaveDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700">
                        {leave.leaveHours} hrs
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                            leave.status === "Approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : leave.status === "Declined"
                                ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                : leave.status === "Cancelled"
                                  ? "bg-slate-100 text-slate-600 border border-slate-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/60"
                          }`}
                        >
                          {leave.status === "Approved" ? (
                            <CheckCircle2 size={13} />
                          ) : leave.status === "Declined" ? (
                            <XCircle size={13} />
                          ) : leave.status === "Cancelled" ? (
                            <Ban size={13} />
                          ) : (
                            <AlertCircle size={13} />
                          )}
                          {leave.status}
                        </span>
                      </td>
                      {hasActionsInLeaves && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {role === "Admin" &&
                              leave.status === "In Review" && (
                                <>
                                  <button
                                    onClick={() =>
                                      triggerApproveModal(leave.id)
                                    }
                                    className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-emerald-200/60"
                                    title="Approve Leave"
                                  >
                                    <CheckCircle size={14} /> Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      triggerDeclineModal(leave.id)
                                    }
                                    className="text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-rose-200/60"
                                    title="Decline Leave"
                                  >
                                    <X size={14} /> Decline
                                  </button>
                                </>
                              )}

                            {role !== "Admin" &&
                              leave.status === "In Review" && (
                                <button
                                  onClick={() => triggerCancelModal(leave.id)}
                                  className="text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-slate-200"
                                  title="Cancel Request"
                                >
                                  <Ban size={14} /> Cancel
                                </button>
                              )}

                            {role === "Admin" && (
                              <button
                                onClick={() => triggerDeleteModal(leave.id)}
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
                      No leave records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
            {loading ? (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 space-y-2">
                <Loader2
                  size={22}
                  className="animate-spin text-amber-600 mx-auto"
                />
                <p className="text-xs font-semibold text-slate-500">
                  Loading leave cards...
                </p>
              </div>
            ) : paginatedLeaves.length > 0 ? (
              paginatedLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      {role === "Admin" && selectedEmployee === "all" && (
                        <h3 className="font-bold text-slate-900 text-xs">
                          {leave.employeeName || "Employee"}
                        </h3>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Date: {new Date(leave.leaveDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {role === "Admin" && leave.status === "In Review" && (
                        <>
                          <button
                            onClick={() => triggerApproveModal(leave.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => triggerDeclineModal(leave.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {role !== "Admin" && leave.status === "In Review" && (
                        <button
                          onClick={() => triggerCancelModal(leave.id)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Cancel Request"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                      {role === "Admin" && (
                        <button
                          onClick={() => triggerDeleteModal(leave.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-slate-700">
                      {leave.leaveHours} Hours
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                        leave.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : leave.status === "Declined"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : leave.status === "Cancelled"
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                No leave records found.
              </div>
            )}
          </div>

          {/* Pagination Controls Footer */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File / Add Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">
                {role === "Admin" ? "Add Leave Record" : "File Leave Request"}
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
                  Leave Date
                </label>
                <input
                  type="date"
                  value={formData.leaveDate}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveDate: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Leave Hours
                </label>
                <input
                  type="number"
                  value={formData.leaveHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      leaveHours: Number(e.target.value),
                    })
                  }
                  disabled={isSubmitting}
                  className="w-full border border-slate-300 p-2.5 rounded-xl font-mono font-bold"
                  min={1}
                  max={24}
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
