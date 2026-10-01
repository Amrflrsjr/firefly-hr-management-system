import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import {
  Plus,
  Check,
  Trash2,
  X,
  Clock,
  UserCheck,
  AlertCircle,
  Ban,
  ChevronDown,
  CalendarX2,
  RotateCw,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaginationBar from "../components/timesheet/PaginationBar";
import OvertimeModal from "../components/overtime/OvertimeModal";
import { FOCUS, ROW_BASE, statusLabel } from "../utils/uiConstants";
import {
  PersonCell,
  SkeletonRows,
  EmptyState,
  Chip,
  StatusBadge,
} from "../components/ListUI";

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
  isAdmin?: boolean;
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

// key = `${showEmployee}-${actionsKind}`[cite: 4]
const OVERTIME_GRID: Record<string, string> = {
  "1-admin": "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_88px_120px_216px]",
  "1-emp": "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_88px_120px_96px]",
  "1-none": "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_88px_120px]",
  "0-admin": "md:grid-cols-[minmax(0,1fr)_88px_120px_216px]",
  "0-emp": "md:grid-cols-[minmax(0,1fr)_88px_120px_96px]",
  "0-none": "md:grid-cols-[minmax(0,1fr)_88px_120px]",
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const DEFAULT_FORM = {
  overtimeDate: "",
  timeIn: "17:00",
  timeOut: "19:00",
};

export default function Overtime() {
  const [overtimes, setOvertimes] = useState<OvertimeItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  // Nothing to fetch for a signed-out employee, so don't start in a loading state.[cite: 4]
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

  // The modal has its own employee field, so it never changes the page filter.[cite: 4]
  const [formData, setFormData] = useState({
    employeeId: "",
    ...DEFAULT_FORM,
  });

  // Hours between start and end; an earlier end time means it runs past midnight.[cite: 4]
  const calculatedHours = useMemo(() => {
    if (!formData.timeIn || !formData.timeOut) return 0;
    const [inHours, inMinutes] = formData.timeIn.split(":").map(Number);
    const [outHours, outMinutes] = formData.timeOut.split(":").map(Number);

    let diffMinutes = outHours * 60 + outMinutes - (inHours * 60 + inMinutes);
    if (diffMinutes < 0) diffMinutes += 24 * 60;

    return Number((diffMinutes / 60).toFixed(2));
  }, [formData.timeIn, formData.timeOut]);

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

  // Auto-dismiss; a new toast replaces the object, which restarts the timer.[cite: 4]
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Employee list is only needed by admins (filter + modal), so load it once.[cite: 4]
  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    const loadEmployees = async () => {
      try {
        const res = await api.get("/Employees");
        if (!alive) return;
        const nonAdmins = (res.data || [])
          .filter((emp: Employee) => !emp.isAdmin)
          .sort((a: Employee, b: Employee) =>
            a.lastName.localeCompare(b.lastName),
          );
        setEmployees(nonAdmins);
      } catch {
        // The employee filter simply stays hidden if this fails.[cite: 4]
      }
    };
    loadEmployees();
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  // Fetch logic encapsulated entirely inside useEffect to avoid cascading setState warnings[cite: 4]
  useEffect(() => {
    let isMounted = true;

    async function fetchOvertimes() {
      if (!isAdmin && !loggedInEmployeeId) {
        if (isMounted) setLoading(false);
        return;
      }
      const effectiveId = isAdmin ? selectedEmployee : loggedInEmployeeId;

      try {
        const endpoint =
          effectiveId && effectiveId !== "all"
            ? `/Overtimes/employee/${effectiveId}`
            : "/Overtimes";
        const res = await api.get(endpoint);
        if (!isMounted) return;
        setOvertimes(res.data || []);
      } catch {
        if (!isMounted) return;
        setOvertimes([]);
        setLoadError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOvertimes();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, loggedInEmployeeId, selectedEmployee]);

  // Loading state is switched on by the event that triggers a fetch (not inside
  // the effect), so the effect itself only reacts to the async result.[cite: 4]
  const startLoading = () => {
    setLoading(true);
    setLoadError(false);
  };

  const reload = () => {
    startLoading();
    const effectiveId = isAdmin ? selectedEmployee : loggedInEmployeeId;
    if (!isAdmin && !loggedInEmployeeId) return;

    api
      .get(
        effectiveId && effectiveId !== "all"
          ? `/Overtimes/employee/${effectiveId}`
          : "/Overtimes",
      )
      .then((res) => setOvertimes(res.data || []))
      .catch(() => {
        setOvertimes([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  };

  const closeConfirm = () =>
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

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

    if (calculatedHours <= 0) {
      showToast("End time must be later than start time.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/Overtimes", {
        employeeId: Number(targetId),
        overtimeDate: new Date(formData.overtimeDate).toISOString(),
        overtimeHours: calculatedHours,
        status: isAdmin ? "Approved" : "In Review",
      });
      setShowModal(false);
      setFormData((prev) => ({ ...prev, ...DEFAULT_FORM }));
      showToast(
        isAdmin
          ? "Overtime record added."
          : "Overtime request sent for review.",
      );
      reload();
    } catch {
      showToast("Couldn't save the overtime. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerApproveModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Approve overtime request",
      message: "Are you sure you want to approve this overtime request?",
      confirmText: "Approve",
      type: "primary",
      onConfirm: async () => {
        try {
          await api.put(`/Overtimes/${id}/status`, JSON.stringify("Approved"), {
            headers: { "Content-Type": "application/json" },
          });
          showToast("Overtime request approved.");
          reload();
        } catch {
          showToast("Couldn't approve the overtime. Try again.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const triggerDeclineModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Decline overtime request",
      message: "Are you sure you want to decline this overtime request?",
      confirmText: "Decline",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/Overtimes/${id}/reject`);
          showToast("Overtime request declined.");
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
      title: "Cancel overtime request",
      message: "Are you sure you want to cancel this pending overtime request?",
      confirmText: "Cancel request",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/Overtimes/${id}/cancel`);
          showToast("Overtime request cancelled.");
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
      title: "Delete overtime record",
      message:
        "Are you sure you want to delete this overtime record permanently?",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/Overtimes/${id}`);
          showToast("Overtime record deleted.");
          reload();
        } catch {
          showToast("Couldn't delete the overtime record. Try again.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  /* ----- derived data -----[cite: 4] */

  const statusCounts: Record<StatusFilter, number> = {
    All: overtimes.length,
    "In Review": overtimes.filter((o) => o.status === "In Review").length,
    Approved: overtimes.filter((o) => o.status === "Approved").length,
    Declined: overtimes.filter((o) => o.status === "Declined").length,
    Cancelled: overtimes.filter((o) => o.status === "Cancelled").length,
  };
  const pendingCount = statusCounts["In Review"];

  // In-review first (that's what admins act on), then newest date first.[cite: 4]
  const visibleOvertimes = useMemo(() => {
    return overtimes
      .filter((o) => statusFilter === "All" || o.status === statusFilter)
      .sort(
        (a, b) =>
          Number(b.status === "In Review") - Number(a.status === "In Review") ||
          new Date(b.overtimeDate).getTime() -
            new Date(a.overtimeDate).getTime(),
      );
  }, [overtimes, statusFilter]);

  const totalPages = Math.ceil(visibleOvertimes.length / ITEMS_PER_PAGE);
  const paginatedOvertimes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return visibleOvertimes.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleOvertimes, currentPage]);

  const showActions = paginatedOvertimes.some(
    (o) => isAdmin || o.status === "In Review",
  );
  const actionsKind = !showActions ? "none" : isAdmin ? "admin" : "emp";
  const showEmployeeCol = isAdmin && selectedEmployee === "all";
  const grid = OVERTIME_GRID[`${+showEmployeeCol}-${actionsKind}`];

  const changePage = (p: number) => {
    setCurrentPage(p);
    document
      .getElementById("overtime-card")
      ?.scrollIntoView({ block: "start" });
  };

  const fileButton = (
    <button
      onClick={openModal}
      disabled={loading}
      className={`flex h-10 items-center justify-center gap-1.5 rounded-lg bg-(--primary) px-4 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-(--primary-hover) cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
    >
      <Plus size={16} />
      {isAdmin ? "Add overtime record" : "Request overtime"}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
            <Clock size={19} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Overtime management
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Track extended working hours and review submissions.
            </p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
          {fileButton}
        </div>
      </div>

      {/* Card */}
      <section
        id="overtime-card"
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
                      {emp.lastName}, {emp.firstName}
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
                  {statusLabel(s)}
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
            title="Couldn't load overtime records"
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
        ) : paginatedOvertimes.length === 0 ? (
          <EmptyState
            icon={<CalendarX2 size={20} />}
            title={
              statusFilter === "All"
                ? "No overtime records yet"
                : `No ${statusLabel(statusFilter).toLowerCase()} overtime`
            }
            text={
              statusFilter === "All"
                ? isAdmin
                  ? "Overtime you add or that employees request will show up here."
                  : "When you request overtime, you can track its approval here."
                : "Nothing matches this status. Try another one."
            }
            action={
              statusFilter !== "All" ? (
                <button
                  onClick={() => setStatusFilter("All")}
                  className={`inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${FOCUS}`}
                >
                  Show all overtime
                </button>
              ) : (
                fileButton
              )
            }
          />
        ) : (
          <>
            <div
              className={`hidden border-b border-slate-200 px-5 py-2.5 text-xs font-medium text-slate-500 md:grid md:gap-x-4 ${grid}`}
            >
              {showEmployeeCol && <span>Employee</span>}
              <span>Date</span>
              <span>Hours</span>
              <span>Status</span>
              {showActions && <span className="sr-only">Actions</span>}
            </div>

            <ul className="divide-y divide-slate-100">
              {paginatedOvertimes.map((ot) => {
                const date = new Date(ot.overtimeDate);
                const isPending = ot.status === "In Review";
                return (
                  <li
                    key={ot.id}
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
                        <PersonCell name={ot.employeeName || "Employee"} />
                      </div>
                    )}

                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-slate-900">
                        {fmtDate(date)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {date.toLocaleDateString("en-US", { weekday: "long" })}
                      </p>
                    </div>

                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {ot.overtimeHours} hrs
                    </span>

                    <StatusBadge status={ot.status} />

                    {showActions && (
                      <div className="flex w-full items-center justify-end gap-1.5 md:w-auto">
                        {isAdmin && isPending && (
                          <>
                            <button
                              onClick={() => triggerApproveModal(ot.id)}
                              className={`inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200/70 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 cursor-pointer ${FOCUS}`}
                            >
                              <Check size={14} />
                              Approve
                            </button>
                            <button
                              onClick={() => triggerDeclineModal(ot.id)}
                              className={`inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200/70 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 cursor-pointer ${FOCUS}`}
                            >
                              <X size={14} />
                              Decline
                            </button>
                          </>
                        )}
                        {!isAdmin && isPending && (
                          <button
                            onClick={() => triggerCancelModal(ot.id)}
                            className={`inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer ${FOCUS}`}
                          >
                            <Ban size={13} />
                            Cancel
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => triggerDeleteModal(ot.id)}
                            aria-label="Delete overtime record"
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

      <OvertimeModal
        isOpen={showModal}
        role={role}
        employees={employees}
        formData={formData}
        calculatedHours={calculatedHours}
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
