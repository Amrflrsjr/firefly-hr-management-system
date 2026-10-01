import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import {
  Plus,
  Check,
  Trash2,
  X,
  Calendar as CalendarIcon,
  UserCheck,
  AlertCircle,
  Ban,
  ChevronDown,
  Tag,
  CalendarX2,
  RotateCw,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaginationBar from "../components/timesheet/PaginationBar";
import LeaveModal from "../components/leaves/LeaveModal";
import { FOCUS, ROW_BASE, statusLabel } from "../utils/uiConstants";
import {
  PersonCell,
  SkeletonRows,
  EmptyState,
  Chip,
  StatusBadge,
} from "../components/ListUI";

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

type StatusFilter = "All" | "In Review" | "Approved" | "Declined" | "Cancelled";

const ITEMS_PER_PAGE = 15;
const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "In Review",
  "Approved",
  "Declined",
  "Cancelled",
];

// key = `${showEmployee}-${actionsKind}`
const LEAVE_GRID: Record<string, string> = {
  "1-admin":
    "md:grid-cols-[minmax(0,1.2fr)_140px_minmax(0,1fr)_72px_120px_216px]",
  "1-emp": "md:grid-cols-[minmax(0,1.2fr)_140px_minmax(0,1fr)_72px_120px_96px]",
  "1-none": "md:grid-cols-[minmax(0,1.2fr)_140px_minmax(0,1fr)_72px_120px]",
  "0-admin": "md:grid-cols-[140px_minmax(0,1fr)_72px_120px_216px]",
  "0-emp": "md:grid-cols-[140px_minmax(0,1fr)_72px_120px_96px]",
  "0-none": "md:grid-cols-[140px_minmax(0,1fr)_72px_120px]",
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/* ---------- small presentational pieces ---------- */

function BalanceMeter({ remaining, max }: { remaining: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (remaining / max) * 100)) : 0;
  const bar =
    pct > 40 ? "bg-emerald-500" : pct > 15 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex min-w-48 flex-col gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-semibold tabular-nums text-slate-900">
          {remaining} hrs left
        </span>
        <span className="tabular-nums text-slate-400">of {max}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Leave balance"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={remaining}
        className="h-1.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function Leaves() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  // Nothing to fetch for a signed-out employee, so don't start in a loading state.[cite: 2]
  const [loading, setLoading] = useState<boolean>(
    () =>
      localStorage.getItem("role") === "Admin" ||
      Boolean(localStorage.getItem("employeeId")),
  );
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [showModal, setShowModal] = useState(false);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "";
  const isAdmin = role === "Admin";

  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    isAdmin ? "all" : loggedInEmployeeId,
  );

  // The modal has its own employee field, so it never changes the page filter.[cite: 2]
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

  const showToast = (text: string, type: "success" | "error" = "success") =>
    setToast({ text, type });

  // Auto-dismiss; a new toast replaces the object, which restarts the timer.[cite: 2]
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch logic contained entirely inside useEffect to avoid cascading setState warnings
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!isAdmin && !loggedInEmployeeId) {
        if (isMounted) setLoading(false);
        return;
      }
      const effectiveId = isAdmin ? selectedEmployee : loggedInEmployeeId;

      try {
        const empRes = await api.get("/Employees");
        const nonAdmins = (empRes.data || [])
          .filter((emp: Employee) => !emp.isAdmin)
          .sort((a: Employee, b: Employee) =>
            a.lastName.localeCompare(b.lastName),
          );

        if (!isMounted) return;
        setEmployees(nonAdmins);

        const endpoint =
          effectiveId && effectiveId !== "all"
            ? `/Leaves/employee/${effectiveId}`
            : "/Leaves";
        const leavesRes = await api.get(endpoint);

        if (!isMounted) return;
        setLeaves(leavesRes.data || []);
      } catch {
        if (!isMounted) return;
        setLeaves([]);
        setLoadError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, loggedInEmployeeId, selectedEmployee]);

  const startLoading = () => {
    setLoading(true);
    setLoadError(false);
  };

  const reload = () => {
    startLoading();
    // Re-trigger by toggling/updating state or executing fetch manually
    const effectiveId = isAdmin ? selectedEmployee : loggedInEmployeeId;
    if (!isAdmin && !loggedInEmployeeId) return;

    api
      .get(
        effectiveId && effectiveId !== "all"
          ? `/Leaves/employee/${effectiveId}`
          : "/Leaves",
      )
      .then((res) => setLeaves(res.data || []))
      .catch(() => {
        setLeaves([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  };

  const closeConfirm = () =>
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

  const balanceEmployee = useMemo(() => {
    const id = isAdmin
      ? selectedEmployee === "all"
        ? 0
        : Number(selectedEmployee)
      : Number(loggedInEmployeeId);
    return id ? (employees.find((e) => e.id === id) ?? null) : null;
  }, [isAdmin, selectedEmployee, loggedInEmployeeId, employees]);

  const exhausted =
    balanceEmployee !== null && balanceEmployee.remainingLeaveHours <= 0;

  const openModal = () => {
    if (isAdmin) {
      setFormData((prev) => ({
        ...prev,
        employeeId:
          selectedEmployee !== "all"
            ? selectedEmployee
            : String(employees[0]?.id ?? ""),
      }));
    }
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const targetId = isAdmin ? formData.employeeId : loggedInEmployeeId;

    if (!targetId || targetId === "all") {
      showToast("Choose an employee.", "error");
      setIsSubmitting(false);
      return;
    }

    const targetEmp = employees.find((emp) => emp.id === Number(targetId));
    if (targetEmp && targetEmp.remainingLeaveHours <= 0) {
      showToast("This employee has no leave hours left.", "error");
      setIsSubmitting(false);
      return;
    }

    if (targetEmp && formData.leaveHours > targetEmp.remainingLeaveHours) {
      showToast(
        `That's more than the remaining balance (${targetEmp.remainingLeaveHours} hrs left).`,
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
        status: isAdmin ? "Approved" : "In Review",
      });
      setShowModal(false);
      setFormData((prev) => ({
        ...prev,
        leaveDate: "",
        leaveHours: 8,
        leaveType: "Vacation",
      }));
      showToast(
        isAdmin ? "Leave record added." : "Leave request sent for review.",
      );
      reload();
    } catch (err: unknown) {
      const errorResponse = (
        err as { response?: { data?: { message?: string } | string } }
      )?.response?.data;
      const errorMsg =
        typeof errorResponse === "string"
          ? errorResponse
          : errorResponse?.message ||
            "Couldn't save the leave. Check the balance and try again.";
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerApproveModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Approve leave request",
      message: "Are you sure you want to approve this leave request?",
      confirmText: "Approve",
      type: "primary",
      onConfirm: async () => {
        try {
          await api.put(`/Leaves/${id}/status`, JSON.stringify("Approved"), {
            headers: { "Content-Type": "application/json" },
          });
          showToast("Leave request approved.");
          reload();
        } catch {
          showToast("Couldn't approve the leave. Try again.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const triggerDeclineModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Decline leave request",
      message: "Are you sure you want to decline this leave request?",
      confirmText: "Decline",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/Leaves/${id}/reject`);
          showToast("Leave request declined.");
          reload();
        } catch {
          showToast("Couldn't decline the request. Try again.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const triggerCancelModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Cancel leave request",
      message: "Are you sure you want to cancel this pending leave request?",
      confirmText: "Cancel request",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/Leaves/${id}/cancel`);
          showToast("Leave request cancelled.");
          reload();
        } catch {
          showToast("Couldn't cancel the request. Try again.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const triggerDeleteModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete leave record",
      message: "Are you sure you want to delete this leave record permanently?",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/Leaves/${id}`);
          showToast("Leave record deleted.");
          reload();
        } catch {
          showToast("Couldn't delete the leave record. Try again.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  /* ----- derived data ----- */

  const statusCounts: Record<StatusFilter, number> = {
    All: leaves.length,
    "In Review": leaves.filter((l) => l.status === "In Review").length,
    Approved: leaves.filter((l) => l.status === "Approved").length,
    Declined: leaves.filter((l) => l.status === "Declined").length,
    Cancelled: leaves.filter((l) => l.status === "Cancelled").length,
  };
  const pendingCount = statusCounts["In Review"];

  // In-review first (that's what admins act on), then newest leave date first.[cite: 2]
  const visibleLeaves = useMemo(() => {
    return leaves
      .filter((l) => statusFilter === "All" || l.status === statusFilter)
      .sort(
        (a, b) =>
          Number(b.status === "In Review") - Number(a.status === "In Review") ||
          new Date(b.leaveDate).getTime() - new Date(a.leaveDate).getTime(),
      );
  }, [leaves, statusFilter]);

  const totalPages = Math.ceil(visibleLeaves.length / ITEMS_PER_PAGE);
  const paginatedLeaves = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return visibleLeaves.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleLeaves, currentPage]);

  const showActions = paginatedLeaves.some(
    (l) => isAdmin || l.status === "In Review",
  );
  const actionsKind = !showActions ? "none" : isAdmin ? "admin" : "emp";
  const showEmployeeCol = isAdmin && selectedEmployee === "all";
  const grid = LEAVE_GRID[`${+showEmployeeCol}-${actionsKind}`];

  const changePage = (p: number) => {
    setCurrentPage(p);
    document.getElementById("leaves-card")?.scrollIntoView({ block: "start" });
  };

  const fileButton = (
    <button
      onClick={openModal}
      disabled={loading || exhausted}
      title={exhausted ? "No leave hours left to file" : undefined}
      className={`flex h-10 items-center justify-center gap-1.5 rounded-lg bg-(--primary) px-4 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-(--primary-hover) cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
    >
      <Plus size={16} />
      {isAdmin ? "Add leave record" : "Request leave"}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
            <CalendarIcon size={19} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Leave management
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              File requests and track leave approvals.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          {balanceEmployee && (
            <BalanceMeter
              remaining={balanceEmployee.remainingLeaveHours}
              max={balanceEmployee.maxLeaveHours}
            />
          )}
          {fileButton}
        </div>
      </div>

      {/* Card */}
      <section
        id="leaves-card"
        className="scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-b border-slate-200 bg-slate-50/50 p-4 sm:px-5">
          {isAdmin && employees.length > 0 && (
            <label className="flex w-full flex-col gap-1.5 sm:w-72">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <UserCheck size={13} className="text-slate-400" />
                Employee
              </span>
              <span className="relative">
                <select
                  value={selectedEmployee}
                  disabled={loading}
                  onChange={(e) => {
                    startLoading();
                    setSelectedEmployee(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm font-medium text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60"
                >
                  <option value="all">All employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.lastName}, {emp.firstName} ({emp.remainingLeaveHours}{" "}
                      hrs left)
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </span>
            </label>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">Status</span>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((s) => (
                <Chip
                  key={s}
                  active={statusFilter === s}
                  onClick={() => {
                    setStatusFilter(s);
                    setCurrentPage(1);
                  }}
                >
                  {s === "All" ? "All" : statusLabel(s)}
                  <span className="ml-1.5 font-normal text-slate-400">
                    {statusCounts[s]}
                  </span>
                  {s === "In Review" && pendingCount > 0 && (
                    <span
                      aria-hidden
                      className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle"
                    />
                  )}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <SkeletonRows />
        ) : loadError ? (
          <EmptyState
            icon={<AlertCircle size={20} />}
            title="Couldn't load leave records"
            text="Check your connection and try again."
            action={
              <button
                onClick={reload}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${FOCUS}`}
              >
                <RotateCw size={13} />
                Try again
              </button>
            }
          />
        ) : paginatedLeaves.length === 0 ? (
          <EmptyState
            icon={<CalendarX2 size={20} />}
            title={
              statusFilter === "All"
                ? "No leave records yet"
                : `No ${statusLabel(statusFilter).toLowerCase()} leave`
            }
            text={
              statusFilter === "All"
                ? isAdmin
                  ? "Leave you add or that employees request will show up here."
                  : "When you request leave, you can track its approval here."
                : "Nothing matches this status. Try another one."
            }
            action={
              statusFilter !== "All" ? (
                <button
                  onClick={() => setStatusFilter("All")}
                  className={`inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${FOCUS}`}
                >
                  Show all leave
                </button>
              ) : (
                !exhausted && fileButton
              )
            }
          />
        ) : (
          <>
            <div
              className={`hidden border-b border-slate-200 px-5 py-2.5 text-xs font-medium text-slate-500 md:grid md:gap-x-4 ${grid}`}
            >
              {showEmployeeCol && <span>Employee</span>}
              <span>Type</span>
              <span>Date</span>
              <span>Hours</span>
              <span>Status</span>
              {showActions && <span className="sr-only">Actions</span>}
            </div>

            <ul className="divide-y divide-slate-100">
              {paginatedLeaves.map((leave) => {
                const date = new Date(leave.leaveDate);
                const isPending = leave.status === "In Review";
                return (
                  <li
                    key={leave.id}
                    className={`relative px-5 py-3 transition-colors hover:bg-slate-50/70 ${ROW_BASE} ${grid}`}
                  >
                    {isPending && (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-0.5 bg-amber-400"
                      />
                    )}

                    {showEmployeeCol && (
                      <div className="w-full min-w-0 md:w-auto">
                        <PersonCell name={leave.employeeName || "Employee"} />
                      </div>
                    )}

                    <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      <Tag size={12} className="text-amber-600" />
                      {leave.leaveType || "Vacation"}
                    </span>

                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-slate-900">
                        {fmtDate(date)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {date.toLocaleDateString("en-US", { weekday: "long" })}
                      </p>
                    </div>

                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {leave.leaveHours} hrs
                    </span>

                    <StatusBadge status={leave.status} />

                    {showActions && (
                      <div className="flex w-full items-center justify-end gap-1.5 md:w-auto">
                        {isAdmin && isPending && (
                          <>
                            <button
                              onClick={() => triggerApproveModal(leave.id)}
                              className={`inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200/70 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 cursor-pointer ${FOCUS}`}
                            >
                              <Check size={14} />
                              Approve
                            </button>
                            <button
                              onClick={() => triggerDeclineModal(leave.id)}
                              className={`inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200/70 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 cursor-pointer ${FOCUS}`}
                            >
                              <X size={14} />
                              Decline
                            </button>
                          </>
                        )}
                        {!isAdmin && isPending && (
                          <button
                            onClick={() => triggerCancelModal(leave.id)}
                            className={`inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer ${FOCUS}`}
                          >
                            <Ban size={13} />
                            Cancel
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => triggerDeleteModal(leave.id)}
                            aria-label="Delete leave record"
                            className={`rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer ${FOCUS}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {!loading && (
          <PaginationBar
            page={currentPage}
            totalPages={totalPages}
            onPageChange={changePage}
          />
        )}
      </section>

      <LeaveModal
        isOpen={showModal}
        role={role}
        employees={employees}
        selfEmployeeId={loggedInEmployeeId}
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
        onClose={closeConfirm}
      />

      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
