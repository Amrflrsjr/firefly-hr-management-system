import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";
import {
  Plus,
  CheckCircle,
  Trash2,
  X,
  Calendar as CalendarIcon,
  Loader2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Ban,
  ChevronDown,
  Clock,
  Tag,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaginationBar from "../components/timesheet/PaginationBar";
import LeaveModal from "../components/leaves/LeaveModal";

interface Leave {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveDate: string;
  leaveHours: number;
  status: string;
  leaveType: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
  maxLeaveHours: number;
  remainingLeaveHours: number;
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

  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    role === "Admin" ? "all" : loggedInEmployeeId,
  );

  const [formData, setFormData] = useState({
    employeeId: "",
    leaveDate: "",
    leaveHours: 8,
    leaveType: "Vacation",
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

  const loadData = useCallback(
    async (targetEmpId: string) => {
      setLoading(true);
      const effectiveId = role === "Admin" ? targetEmpId : loggedInEmployeeId;

      try {
        const empRes = await api.get("/Employees");
        const filteredNonAdmins = (empRes.data || [])
          .filter((emp: Employee) => !emp.isAdmin)
          .sort((a: Employee, b: Employee) =>
            a.lastName.localeCompare(b.lastName),
          );
        setEmployees(filteredNonAdmins);

        let endpoint = "/Leaves";
        if (effectiveId && effectiveId !== "all") {
          endpoint = `/Leaves/employee/${effectiveId}`;
        }
        const leavesRes = await api.get(endpoint);
        setLeaves(leavesRes.data || []);
      } catch {
        showToast("Failed to load leave records.", "error");
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    },
    [role, loggedInEmployeeId, showToast],
  );

  useEffect(() => {
    let isMounted = true;
    const initLoad = async () => {
      if (role === "Admin") {
        try {
          const res = await api.get("/Employees");
          if (!isMounted) return;

          const nonAdminEmployees = res.data
            .filter((emp: Employee) => !emp.isAdmin)
            .sort((a: Employee, b: Employee) =>
              a.lastName.localeCompare(b.lastName),
            );

          setEmployees(nonAdminEmployees);
          if (nonAdminEmployees.length > 0) {
            setFormData((prev) => ({
              ...prev,
              employeeId: String(nonAdminEmployees[0].id),
            }));
          }
          await loadData("all");
        } catch {
          if (isMounted) setLoading(false);
        }
      } else if (loggedInEmployeeId) {
        await loadData(loggedInEmployeeId);
      } else {
        if (isMounted) setLoading(false);
      }
    };

    initLoad();
    return () => {
      isMounted = false;
    };
  }, [role, loggedInEmployeeId, loadData]);

  const currentActiveBalance = useMemo(() => {
    const targetId =
      role === "Admin"
        ? selectedEmployee === "all"
          ? null
          : Number(selectedEmployee)
        : Number(loggedInEmployeeId);
    if (!targetId) return null;
    const emp = employees.find((e) => e.id === targetId);
    return emp ? emp.remainingLeaveHours : null;
  }, [role, selectedEmployee, loggedInEmployeeId, employees]);

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

    const targetEmp = employees.find((e) => e.id === Number(targetId));
    if (targetEmp && targetEmp.remainingLeaveHours <= 0) {
      showToast("This employee has exhausted all leave hours.", "error");
      setIsSubmitting(false);
      return;
    }

    if (targetEmp && formData.leaveHours > targetEmp.remainingLeaveHours) {
      showToast(
        `Requested hours exceed remaining balance (${targetEmp.remainingLeaveHours} hrs left).`,
        "error",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/Leaves", {
        employeeId: Number(targetId),
        leaveDate: new Date(formData.leaveDate).toISOString(),
        leaveHours: Number(formData.leaveHours),
        leaveType: formData.leaveType,
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
        leaveType: "Vacation",
      });
      showToast("Leave request submitted successfully!");
      loadData(selectedEmployee);
    } catch (err: unknown) {
      const errorResponse = (
        err as { response?: { data?: { message?: string } | string } }
      )?.response?.data;
      const errorMsg =
        typeof errorResponse === "string"
          ? errorResponse
          : errorResponse?.message ||
            "Insufficient leave balance or submission failed.";
      showToast(errorMsg, "error");
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
      onConfirm: async () => {
        try {
          await api.put(`/Leaves/${id}/status`, JSON.stringify("Approved"), {
            headers: { "Content-Type": "application/json" },
          });
          showToast("Leave request approved!");
          loadData(selectedEmployee);
        } catch {
          showToast("Failed to approve leave.", "error");
        } finally {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const triggerDeclineModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Decline Leave Request",
      message: "Are you sure you want to decline this leave request?",
      confirmText: "Decline",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/Leaves/${id}/reject`);
          showToast("Leave request declined successfully.");
          loadData(selectedEmployee);
        } catch {
          showToast("Failed to decline leave request.", "error");
        } finally {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const triggerCancelModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Cancel Leave Request",
      message: "Are you sure you want to cancel this pending leave request?",
      confirmText: "Cancel Request",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/Leaves/${id}/cancel`);
          showToast("Leave request cancelled successfully.");
          loadData(selectedEmployee);
        } catch {
          showToast("Failed to cancel leave request.", "error");
        } finally {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const triggerDeleteModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Leave Record",
      message: "Are you sure you want to delete this leave record permanently?",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/Leaves/${id}`);
          showToast("Leave record deleted successfully.");
          loadData(selectedEmployee);
        } catch {
          showToast("Failed to delete leave record.", "error");
        } finally {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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
        ? 6
        : 5
      : hasActionsInLeaves
        ? 5
        : 4;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {currentActiveBalance !== null && (
              <div className="flex items-center justify-center gap-2 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
                <Clock size={14} className="text-amber-600" />
                <span>Balance: {currentActiveBalance} hrs remaining</span>
              </div>
            )}
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
              disabled={
                loading ||
                (currentActiveBalance !== null && currentActiveBalance <= 0)
              }
              className="flex items-center gap-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer justify-center disabled:opacity-50 active:scale-[0.98]"
            >
              <Plus size={16} />{" "}
              {role === "Admin" ? "Add Leave Record" : "File Leave"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-6 sm:gap-8 px-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
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
          {role === "Admin" && employees.length > 0 && (
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
              <div className="max-w-md w-full">
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2 flex items-center gap-1.5">
                  <UserCheck size={13} className="text-slate-400" />
                  Select Employee Filter
                </label>
                <div className="relative">
                  <select
                    value={selectedEmployee}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedEmployee(val);
                      setCurrentPage(1);
                      loadData(val);
                    }}
                    className="w-full h-11 appearance-none border border-slate-300 bg-white px-3 pr-10 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-(--primary) cursor-pointer"
                  >
                    <option value="all">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>
                        {emp.lastName}, {emp.firstName} (
                        {emp.remainingLeaveHours} hrs left)
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
                  <th className="py-3.5 px-6">Leave Type</th>
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
                      Loading leave requests...
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
                      <td className="py-4 px-6 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          <Tag size={12} className="text-amber-600" />
                          {leave.leaveType || "Vacation"}
                        </span>
                      </td>
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
                          <div className="flex items-center justify-end gap-2 flex-nowrap">
                            {role === "Admin" &&
                              leave.status === "In Review" && (
                                <>
                                  <button
                                    onClick={() =>
                                      triggerApproveModal(leave.id)
                                    }
                                    className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg text-xs font-semibold border border-emerald-200 cursor-pointer inline-flex items-center gap-1 shrink-0"
                                  >
                                    <CheckCircle size={14} /> Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      triggerDeclineModal(leave.id)
                                    }
                                    className="text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg text-xs font-semibold border border-rose-200 cursor-pointer inline-flex items-center gap-1 shrink-0"
                                  >
                                    <X size={14} /> Decline
                                  </button>
                                </>
                              )}
                            {role !== "Admin" &&
                              leave.status === "In Review" && (
                                <button
                                  onClick={() => triggerCancelModal(leave.id)}
                                  className="text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                                >
                                  <Ban size={14} /> Cancel
                                </button>
                              )}
                            {role === "Admin" && (
                              <button
                                onClick={() => triggerDeleteModal(leave.id)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
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
                  Loading leaves...
                </p>
              </div>
            ) : paginatedLeaves.length > 0 ? (
              paginatedLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      {role === "Admin" && selectedEmployee === "all" && (
                        <h3 className="font-bold text-slate-900 text-xs">
                          {leave.employeeName || "Employee"}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Tag size={11} className="text-amber-600" />
                          {leave.leaveType || "Vacation"}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {new Date(leave.leaveDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
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

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="font-mono font-bold text-slate-800">
                      {leave.leaveHours} Hours
                    </span>
                    <div className="flex items-center gap-2 flex-nowrap">
                      {role === "Admin" && leave.status === "In Review" && (
                        <>
                          <button
                            onClick={() => triggerApproveModal(leave.id)}
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 inline-flex items-center gap-1 shrink-0"
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button
                            onClick={() => triggerDeclineModal(leave.id)}
                            className="px-2.5 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 inline-flex items-center gap-1 shrink-0"
                          >
                            <X size={13} /> Decline
                          </button>
                        </>
                      )}
                      {role !== "Admin" && leave.status === "In Review" && (
                        <button
                          onClick={() => triggerCancelModal(leave.id)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 inline-flex items-center gap-1.5 shrink-0"
                        >
                          <Ban size={13} /> Cancel
                        </button>
                      )}
                      {role === "Admin" && (
                        <button
                          onClick={() => triggerDeleteModal(leave.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                No leave records found.
              </div>
            )}
          </div>

          <PaginationBar
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <LeaveModal
        isOpen={showModal}
        role={role}
        employees={employees}
        formData={formData}
        isSubmitting={isSubmitting}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        onChange={(field, val) =>
          setFormData((prev) => ({ ...prev, [field]: val }))
        }
      />

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
