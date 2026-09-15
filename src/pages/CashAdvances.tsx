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
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showModal, setShowModal] = useState(false);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = Number(localStorage.getItem("employeeId")) || 1;

  const [formData, setFormData] = useState({
    employeeId: loggedInEmployeeId,
    cashAdvanceAmount: 1000,
    deductionType: "Monthly",
  });

  const [deleteId, setDeleteId] = useState<number | null>(null);
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

    api
      .get("/CashAdvances")
      .then((res) => {
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
      })
      .catch(() => {
        if (isMounted) showToast("Failed to load cash advances.", "error");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
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
    setIsSubmitting(true);
    const amount = Number(formData.cashAdvanceAmount);
    try {
      await api.post("/CashAdvances", {
        employeeId:
          role === "Admin" ? Number(formData.employeeId) : loggedInEmployeeId,
        cashAdvanceAmount: amount,
        remainingBalance: amount,
        deductionType: formData.deductionType,
        date: new Date().toISOString(),
        status: "Active",
      });
      setShowModal(false);
      setFormData({
        employeeId:
          role === "Admin" && employees.length > 0
            ? employees[0].id
            : loggedInEmployeeId,
        cashAdvanceAmount: 1000,
        deductionType: "Monthly",
      });
      showToast("Cash advance record created successfully!");
      loadAdvances();
    } catch {
      showToast("Failed to process cash advance.", "error");
    } finally {
      setIsSubmitting(false);
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

  const totalPages = Math.ceil(advances.length / ITEMS_PER_PAGE);
  const paginatedAdvances = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return advances.slice(start, start + ITEMS_PER_PAGE);
  }, [advances, currentPage]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
              <DollarSign size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Cash Advances
            </h1>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Manage employee cash advance records and active repayment plans.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-(--primary) hover:bg-(--primary-hover) px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus size={16} />{" "}
          {role === "Admin" ? "Add Advance Record" : "Request Advance"}
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">Employee</th>
              <th className="py-3.5 px-5">Amount</th>
              <th className="py-3.5 px-5">Remaining Balance</th>
              <th className="py-3.5 px-5">Deduction Plan</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Loader2
                    size={24}
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
                  <td className="py-4 px-5 font-mono text-xs font-bold">
                    {getEmployeeName(adv)}
                  </td>
                  <td className="py-4 px-5 font-mono text-xs font-bold text-slate-700">
                    PHP {formatCurrency(adv.cashAdvanceAmount)}
                  </td>
                  <td className="py-4 px-5 font-mono text-xs font-bold">
                    PHP{" "}
                    {formatCurrency(
                      adv.remainingBalance ?? adv.cashAdvanceAmount,
                    )}
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-600 font-medium">
                    {adv.deductionType}
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        adv.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-amber-50 border border-amber-200/60"
                      }`}
                    >
                      {adv.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => setDeleteId(adv.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Delete Record"
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
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
            <Loader2
              size={24}
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
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {getEmployeeName(adv)}
                  </h3>
                  <span
                    className={`mt-1 inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                      adv.status === "Paid"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 border border-amber-200"
                    }`}
                  >
                    {adv.status}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteId(adv.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
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
                  <span className="font-mono font-bold">
                    PHP{" "}
                    {formatCurrency(
                      adv.remainingBalance ?? adv.cashAdvanceAmount,
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Plan
                  </span>
                  <span className="font-semibold text-slate-700">
                    {adv.deductionType}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No cash advance records found.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

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
                className="text-slate-400 hover:text-slate-600"
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
                        employeeId: Number(e.target.value),
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary)"
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
                  className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary)"
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
                  className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary)"
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
                  className="px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
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

      {/* Confirmation Modal */}
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
