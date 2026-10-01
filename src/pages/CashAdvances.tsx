import { useEffect, useState, useMemo, useCallback } from "react";
import api from "../services/api";
import {
  Plus,
  Trash2,
  DollarSign,
  Check,
  X,
  Ban,
  UserCheck,
  ChevronDown,
  CalendarX2,
  RotateCw,
  AlertCircle,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaginationBar from "../components/timesheet/PaginationBar";
import CashAdvanceModal from "../components/cashAdvances/CashAdvanceModal";
import { FOCUS, ROW_BASE, statusLabel } from "../utils/uiConstants";
import {
  PersonCell,
  SkeletonRows,
  EmptyState,
  Chip,
  StatusBadge,
} from "../components/ListUI";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
}

interface CashAdvance {
  id: number;
  employeeId: number;
  employeeName?: string;
  employee?: Employee;
  cashAdvanceAmount: number;
  remainingBalance?: number;
  deductionType: string;
  date: string;
  status: string;
}

type StatusFilter =
  | "All"
  | "Pending"
  | "Active"
  | "Paid"
  | "Declined"
  | "Canceled";

const ITEMS_PER_PAGE = 15;
const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "Pending",
  "Active",
  "Paid",
  "Declined",
  "Canceled",
];

const CASH_ADVANCE_GRID: Record<string, string> = {
  "1-admin": "md:grid-cols-[minmax(0,1.2fr)_130px_150px_130px_120px_216px]",
  "1-emp": "md:grid-cols-[minmax(0,1.2fr)_130px_150px_130px_120px_96px]",
  "1-none": "md:grid-cols-[minmax(0,1.2fr)_130px_150px_130px_120px]",
  "0-admin": "md:grid-cols-[130px_150px_130px_120px_216px]",
  "0-emp": "md:grid-cols-[130px_150px_130px_120px_96px]",
  "0-none": "md:grid-cols-[130px_150px_130px_120px]",
};

const formatCurrency = (val?: number) => {
  const amount = val ?? 0;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function CashAdvances() {
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [showModal, setShowModal] = useState(false);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = Number(localStorage.getItem("employeeId")) || 1;
  const isAdmin = role === "Admin";

  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    isAdmin ? "all" : String(loggedInEmployeeId),
  );

  const [formData, setFormData] = useState({
    employeeId: "",
    cashAdvanceAmount: 1000,
    deductionType: "Monthly",
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
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load employee list once for admins
  useEffect(() => {
    if (!isAdmin) return;
    let isMounted = true;
    const loadEmployees = async () => {
      try {
        const empRes = await api.get("/Employees");
        if (!isMounted) return;
        if (empRes.data.length > 0) {
          const nonAdminEmployees = empRes.data
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
        }
      } catch {
        // Ignore employee fetch errors
      }
    };
    loadEmployees();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  // Encapsulated fetch logic fetching all cash advances and handling permissions/filtering cleanly
  useEffect(() => {
    let isMounted = true;

    async function fetchCashAdvances() {
      setLoading(true);
      setLoadError(false);

      try {
        const res = await api.get("/CashAdvances");

        if (!isMounted) return;

        if (!isAdmin) {
          setAdvances(
            (res.data || []).filter(
              (ca: CashAdvance) => ca.employeeId === loggedInEmployeeId,
            ),
          );
        } else {
          setAdvances(res.data || []);
        }
      } catch {
        if (!isMounted) return;
        setAdvances([]);
        setLoadError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCashAdvances();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, loggedInEmployeeId]);

  const reload = () => {
    setLoading(true);
    setLoadError(false);

    api
      .get("/CashAdvances")
      .then((res) => {
        if (!isAdmin) {
          setAdvances(
            (res.data || []).filter(
              (ca: CashAdvance) => ca.employeeId === loggedInEmployeeId,
            ),
          );
        } else {
          setAdvances(res.data || []);
        }
      })
      .catch(() => {
        setAdvances([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  };

  const closeConfirm = () =>
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const targetId = isAdmin ? Number(formData.employeeId) : loggedInEmployeeId;
    const amount = Number(formData.cashAdvanceAmount);

    if (!targetId || targetId.toString() === "all") {
      showToast("Please select a valid employee.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/CashAdvances", {
        employeeId: targetId,
        cashAdvanceAmount: amount,
        remainingBalance: amount,
        deductionType: formData.deductionType,
        date: new Date().toISOString(),
        status: isAdmin ? "Active" : "Pending",
      });
      setShowModal(false);
      setFormData({
        employeeId:
          isAdmin && employees.length > 0
            ? String(employees[0].id)
            : String(loggedInEmployeeId),
        cashAdvanceAmount: 1000,
        deductionType: "Monthly",
      });
      showToast(
        isAdmin
          ? "Cash advance record created successfully!"
          : "Cash advance request submitted for approval!",
      );
      reload();
    } catch {
      showToast("Failed to process cash advance.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Approve cash advance",
      message: "Are you sure you want to approve this cash advance request?",
      confirmText: "Approve",
      type: "primary",
      onConfirm: async () => {
        try {
          await api.put(`/CashAdvances/${id}/approve`);
          showToast("Cash advance approved successfully!");
          reload();
        } catch {
          showToast("Failed to approve cash advance.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const handleDecline = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Decline cash advance",
      message: "Are you sure you want to decline this cash advance request?",
      confirmText: "Decline",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/CashAdvances/${id}/decline`);
          showToast("Cash advance request declined.");
          reload();
        } catch {
          showToast("Failed to decline cash advance.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const handleCancel = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Cancel cash advance request",
      message:
        "Are you sure you want to cancel this pending cash advance request?",
      confirmText: "Cancel request",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/CashAdvances/${id}/cancel`);
          showToast("Cash advance request canceled.");
          reload();
        } catch {
          showToast("Failed to cancel cash advance request.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const handleDelete = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete cash advance record",
      message:
        "Are you sure you want to delete this cash advance record permanently?",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/CashAdvances/${id}`);
          showToast("Cash advance record deleted successfully.");
          reload();
        } catch {
          showToast("Failed to delete cash advance.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const getEmployeeName = (adv: CashAdvance) => {
    if (adv.employeeName) return adv.employeeName;
    if (adv.employee) {
      return `${adv.employee.lastName}, ${adv.employee.firstName}`;
    }
    return `Employee ID: ${adv.employeeId}`;
  };

  const statusCounts: Record<StatusFilter, number> = {
    All: advances.filter((a) =>
      isAdmin && selectedEmployee !== "all"
        ? a.employeeId.toString() === selectedEmployee
        : true,
    ).length,
    Pending: advances.filter(
      (a) =>
        (isAdmin && selectedEmployee !== "all"
          ? a.employeeId.toString() === selectedEmployee
          : true) && a.status === "Pending",
    ).length,
    Active: advances.filter(
      (a) =>
        (isAdmin && selectedEmployee !== "all"
          ? a.employeeId.toString() === selectedEmployee
          : true) && a.status === "Active",
    ).length,
    Paid: advances.filter(
      (a) =>
        (isAdmin && selectedEmployee !== "all"
          ? a.employeeId.toString() === selectedEmployee
          : true) && a.status === "Paid",
    ).length,
    Declined: advances.filter(
      (a) =>
        (isAdmin && selectedEmployee !== "all"
          ? a.employeeId.toString() === selectedEmployee
          : true) && a.status === "Declined",
    ).length,
    Canceled: advances.filter(
      (a) =>
        (isAdmin && selectedEmployee !== "all"
          ? a.employeeId.toString() === selectedEmployee
          : true) && a.status === "Canceled",
    ).length,
  };
  const pendingCount = statusCounts["Pending"];

  const visibleAdvances = useMemo(() => {
    let result = advances;

    if (isAdmin && selectedEmployee !== "all") {
      result = result.filter(
        (a) => a.employeeId.toString() === selectedEmployee,
      );
    }

    return result
      .filter((a) => statusFilter === "All" || a.status === statusFilter)
      .sort(
        (a, b) =>
          Number(b.status === "Pending") - Number(a.status === "Pending") ||
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
  }, [advances, statusFilter, isAdmin, selectedEmployee]);

  const totalPages = Math.ceil(visibleAdvances.length / ITEMS_PER_PAGE);
  const paginatedAdvances = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return visibleAdvances.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleAdvances, currentPage]);

  const showActions = paginatedAdvances.some(
    (a) => isAdmin || a.status === "Pending",
  );
  const actionsKind = !showActions ? "none" : isAdmin ? "admin" : "emp";
  const showEmployeeCol = isAdmin && selectedEmployee === "all";
  const grid = CASH_ADVANCE_GRID[`${+showEmployeeCol}-${actionsKind}`];

  const changePage = (p: number) => {
    setCurrentPage(p);
    document
      .getElementById("cash-advance-card")
      ?.scrollIntoView({ block: "start" });
  };

  const fileButton = (
    <button
      onClick={() => {
        if (isAdmin && employees.length > 0) {
          setFormData((prev) => ({
            ...prev,
            employeeId: String(employees[0].id),
          }));
        }
        setShowModal(true);
      }}
      disabled={loading}
      className={`flex h-10 items-center justify-center gap-1.5 rounded-lg bg-(--primary) px-4 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-(--primary-hover) cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
    >
      <Plus size={16} />
      {isAdmin ? "Add advance record" : "Request advance"}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
            <DollarSign size={19} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Cash advances
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage employee cash advance records and active repayment plans.
            </p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
          {fileButton}
        </div>
      </div>

      {/* Card */}
      <section
        id="cash-advance-card"
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
                  {s === "Pending" && pendingCount > 0 && (
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
            title="Couldn't load cash advances"
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
        ) : paginatedAdvances.length === 0 ? (
          <EmptyState
            icon={<CalendarX2 size={20} />}
            title={
              statusFilter === "All"
                ? "No cash advances yet"
                : `No ${statusLabel(statusFilter).toLowerCase()} cash advances`
            }
            text={
              statusFilter === "All"
                ? isAdmin
                  ? "Cash advances you add or that employees request will show up here."
                  : "When you request a cash advance, you can track its approval here."
                : "Nothing matches this status. Try another one."
            }
            action={
              statusFilter !== "All" ? (
                <button
                  onClick={() => setStatusFilter("All")}
                  className={`inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${FOCUS}`}
                >
                  Show all cash advances
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
              <span>Amount</span>
              <span>Balance</span>
              <span>Plan</span>
              <span>Status</span>
              {showActions && <span className="sr-only">Actions</span>}
            </div>

            <ul className="divide-y divide-slate-100">
              {paginatedAdvances.map((adv) => {
                const isPending = adv.status === "Pending";
                return (
                  <li
                    key={adv.id}
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
                        <PersonCell name={getEmployeeName(adv)} />
                      </div>
                    )}

                    <span className="text-sm font-semibold tabular-nums text-slate-900 font-mono">
                      PHP {formatCurrency(adv.cashAdvanceAmount)}
                    </span>

                    <span className="text-sm font-semibold tabular-nums text-slate-700 font-mono">
                      PHP{" "}
                      {formatCurrency(
                        adv.remainingBalance ?? adv.cashAdvanceAmount,
                      )}
                    </span>

                    <span className="text-xs font-medium text-slate-600">
                      {adv.deductionType}
                    </span>

                    <StatusBadge status={adv.status} />

                    {showActions && (
                      <div className="flex w-full items-center justify-end gap-1.5 md:w-auto">
                        {isAdmin && isPending && (
                          <>
                            <button
                              onClick={() => handleApprove(adv.id)}
                              className={`inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200/70 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 cursor-pointer ${FOCUS}`}
                            >
                              <Check size={14} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecline(adv.id)}
                              className={`inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200/70 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 cursor-pointer ${FOCUS}`}
                            >
                              <X size={14} />
                              Decline
                            </button>
                          </>
                        )}
                        {!isAdmin && isPending && (
                          <button
                            onClick={() => handleCancel(adv.id)}
                            className={`inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer ${FOCUS}`}
                          >
                            <Ban size={13} />
                            Cancel
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(adv.id)}
                            aria-label="Delete cash advance record"
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

      <CashAdvanceModal
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
