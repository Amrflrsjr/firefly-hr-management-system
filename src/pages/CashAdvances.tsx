import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";
import {
  Plus,
  Trash2,
  DollarSign,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Ban,
  UserCheck,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface CashAdvance {
  id: number;
  employeeId: number;
  employee?: Employee;
  cashAdvanceAmount: number;
  remainingBalance?: number;
  deductionType: string;
  date: string;
  status: string;
}

const ITEMS_PER_PAGE = 5;

const formatCurrency = (val?: number) => {
  const amount = val ?? 0;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function CashAdvances() {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showModal, setShowModal] = useState(false);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = Number(localStorage.getItem("employeeId")) || 1;

  // Admins default to "all" employees, non-admin defaults to their own ID
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    role === "Admin" ? "all" : String(loggedInEmployeeId),
  );

  const [formData, setFormData] = useState({
    employeeId: "",
    cashAdvanceAmount: 1000,
    deductionType: "Monthly",
  });

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);
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

  const loadAdvances = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/CashAdvances");
      if (role === "Employee") {
        setAdvances(
          res.data.filter(
            (ca: CashAdvance) => ca.employeeId === loggedInEmployeeId,
          ),
        );
      } else {
        setAdvances(res.data);
      }
    } catch {
      showToast("Failed to load cash advances.", "error");
    } finally {
      setLoading(false);
    }
  }, [role, loggedInEmployeeId, showToast]);

  useEffect(() => {
    let isMounted = true;

    const initLoad = async () => {
      try {
        const res = await api.get("/CashAdvances");
        if (!isMounted) return;
        if (role === "Employee") {
          setAdvances(
            res.data.filter(
              (ca: CashAdvance) => ca.employeeId === loggedInEmployeeId,
            ),
          );
        } else {
          setAdvances(res.data);
        }
      } catch {
        if (isMounted) showToast("Failed to load cash advances.", "error");
      } finally {
        if (isMounted) setLoading(false);
      }

      if (role === "Admin") {
        try {
          const empRes = await api.get("/Employees");
          if (isMounted && empRes.data.length > 0) {
            setEmployees(empRes.data);
            setFormData((prev) => ({
              ...prev,
              employeeId: String(empRes.data[0].id),
            }));
          }
        } catch {
          // Ignore employee fetch errors
        }
      }
    };

    initLoad();

    return () => {
      isMounted = false;
    };
  }, [role, loggedInEmployeeId, showToast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const targetId =
      role === "Admin" ? Number(formData.employeeId) : loggedInEmployeeId;
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
        status: role === "Admin" ? "Active" : "Pending",
      });
      setShowModal(false);
      setFormData({
        employeeId:
          role === "Admin" && employees.length > 0
            ? String(employees[0].id)
            : String(loggedInEmployeeId),
        cashAdvanceAmount: 1000,
        deductionType: "Monthly",
      });
      showToast(
        role === "Admin"
          ? "Cash advance record created successfully!"
          : "Cash advance request submitted for approval!",
      );
      loadAdvances();
    } catch {
      showToast("Failed to process cash advance.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/CashAdvances/${id}/approve`);
      showToast("Cash advance approved successfully!");
      loadAdvances();
    } catch {
      showToast("Failed to approve cash advance.", "error");
    }
  };

  const handleDecline = async (id: number) => {
    try {
      await api.put(`/CashAdvances/${id}/decline`);
      showToast("Cash advance request declined.");
      loadAdvances();
    } catch {
      showToast("Failed to decline cash advance.", "error");
    }
  };

  const executeCancel = async () => {
    if (cancelId === null) return;
    try {
      await api.put(`/CashAdvances/${cancelId}/cancel`);
      showToast("Cash advance request canceled.");
      loadAdvances();
    } catch {
      showToast("Failed to cancel cash advance request.", "error");
    } finally {
      setCancelId(null);
    }
  };

  const executeDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/CashAdvances/${deleteId}`);
      setAdvances((prev) => prev.filter((a) => a.id !== deleteId));
      showToast("Cash advance record deleted successfully.");
    } catch {
      showToast("Failed to delete cash advance.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const getEmployeeName = (adv: CashAdvance) => {
    if (adv.employee) {
      return `${adv.employee.lastName}, ${adv.employee.firstName}`;
    }
    return `Employee ID: ${adv.employeeId}`;
  };

  // Filter advances based on active tab and admin's selected employee dropdown filter
  const filteredAdvances = useMemo(() => {
    let result = advances;

    // Filter by employee selection if admin chose a specific employee
    if (role === "Admin" && selectedEmployee !== "all") {
      result = result.filter(
        (a) => a.employeeId.toString() === selectedEmployee,
      );
    }

    // Filter by tab
    if (activeTab === "pending") {
      return result.filter((a) => a.status === "Pending");
    }
    return result.filter((a) => a.status !== "Pending");
  }, [advances, activeTab, role, selectedEmployee]);

  const pendingCount = useMemo(() => {
    let result = advances;
    if (role === "Admin" && selectedEmployee !== "all") {
      result = result.filter(
        (a) => a.employeeId.toString() === selectedEmployee,
      );
    }
    return result.filter((a) => a.status === "Pending").length;
  }, [advances, role, selectedEmployee]);

  const totalPages = Math.ceil(filteredAdvances.length / ITEMS_PER_PAGE);
  const paginatedAdvances = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAdvances.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAdvances, currentPage]);

  const hasActionsOnPage = useMemo(() => {
    if (role === "Admin") return true;
    return paginatedAdvances.some((adv) => adv.status === "Pending");
  }, [role, paginatedAdvances]);

  const tableColSpan =
    role === "Admin" && selectedEmployee === "all"
      ? hasActionsOnPage
        ? 6
        : 5
      : hasActionsOnPage
        ? 5
        : 4;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <DollarSign size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Cash Advances
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage employee cash advance records and active repayment plans.
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
            {role === "Admin" ? "Add Advance Record" : "Request Advance"}
          </button>
        </div>

        {/* Tabs for All Advances vs Pending Requests */}
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
            All Advances
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
                      setSelectedEmployee(e.target.value);
                      setCurrentPage(1);
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
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Remaining Balance</th>
                  <th className="py-3.5 px-6">Deduction Plan</th>
                  <th className="py-3.5 px-6">Status</th>
                  {hasActionsOnPage && (
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
                        Loading cash advances...
                      </p>
                    </td>
                  </tr>
                ) : paginatedAdvances.length > 0 ? (
                  paginatedAdvances.map((adv) => (
                    <tr
                      key={adv.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {role === "Admin" && selectedEmployee === "all" && (
                        <td className="py-4 px-6 font-semibold text-slate-900 text-xs">
                          {getEmployeeName(adv)}
                        </td>
                      )}
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700">
                        PHP {formatCurrency(adv.cashAdvanceAmount)}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700">
                        PHP{" "}
                        {formatCurrency(
                          adv.remainingBalance ?? adv.cashAdvanceAmount,
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                        {adv.deductionType}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                            adv.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : adv.status === "Declined" ||
                                  adv.status === "Canceled"
                                ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                : adv.status === "Paid"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  : "bg-amber-50 text-amber-800 border border-amber-200/60"
                          }`}
                        >
                          {adv.status === "Active" || adv.status === "Paid" ? (
                            <CheckCircle2 size={13} />
                          ) : adv.status === "Declined" ||
                            adv.status === "Canceled" ? (
                            <XCircle size={13} />
                          ) : (
                            <AlertCircle size={13} />
                          )}
                          {adv.status}
                        </span>
                      </td>
                      {hasActionsOnPage && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {role === "Admin" && adv.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(adv.id)}
                                  className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-emerald-200/60"
                                  title="Approve Request"
                                >
                                  <Check size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => handleDecline(adv.id)}
                                  className="text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-rose-200/60"
                                  title="Decline Request"
                                >
                                  <X size={14} /> Decline
                                </button>
                              </>
                            )}

                            {role !== "Admin" && adv.status === "Pending" && (
                              <button
                                onClick={() => setCancelId(adv.id)}
                                className="text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-slate-200"
                                title="Cancel Request"
                              >
                                <Ban size={14} /> Cancel
                              </button>
                            )}

                            {role === "Admin" && (
                              <button
                                onClick={() => setDeleteId(adv.id)}
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
                      No cash advance records found.
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
                  Loading cards...
                </p>
              </div>
            ) : paginatedAdvances.length > 0 ? (
              paginatedAdvances.map((adv) => (
                <div
                  key={adv.id}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">
                        {getEmployeeName(adv)}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Plan: {adv.deductionType}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {role === "Admin" && adv.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(adv.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleDecline(adv.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {adv.status === "Pending" && role !== "Admin" && (
                        <button
                          onClick={() => setCancelId(adv.id)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Cancel Request"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                      {role === "Admin" && (
                        <button
                          onClick={() => setDeleteId(adv.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Amount
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        PHP {formatCurrency(adv.cashAdvanceAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Balance
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        PHP{" "}
                        {formatCurrency(
                          adv.remainingBalance ?? adv.cashAdvanceAmount,
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-50">
                    <span className="text-slate-400 text-[11px]">Status</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                        adv.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : adv.status === "Declined" ||
                              adv.status === "Canceled"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : adv.status === "Paid"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {adv.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                No cash advance records found.
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

      {/* Add / Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">
                {role === "Admin"
                  ? "Add Cash Advance Record"
                  : "Request Cash Advance"}
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
                  Advance Amount (PHP)
                </label>
                <input
                  type="number"
                  value={formData.cashAdvanceAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cashAdvanceAmount: Number(e.target.value),
                    })
                  }
                  disabled={isSubmitting}
                  className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-mono font-bold"
                  min={100}
                  step={50}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Deduction Plan
                </label>
                <select
                  value={formData.deductionType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deductionType: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Per Pay Period">Per Pay Period</option>
                </select>
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
                  className="px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
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

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={cancelId !== null}
        title="Cancel Cash Advance Request"
        message="Are you sure you want to cancel this pending cash advance request?"
        confirmText="Cancel Request"
        type="danger"
        onConfirm={executeCancel}
        onClose={() => setCancelId(null)}
      />

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Cash Advance"
        message="Are you sure you want to delete this cash advance record?"
        confirmText="Delete"
        type="danger"
        onConfirm={executeDelete}
        onClose={() => setDeleteId(null)}
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
