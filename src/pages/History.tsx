import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaySlipModal, { type PaySlipData } from "../components/PaySlipModal";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
}

const ITEMS_PER_PAGE = 5;

// Helper function moved outside component
const sortHistoryNewestFirst = (data: PaySlipData[]) => {
  return [...data].sort((a, b) => {
    const dateA = new Date(a.payPeriodEnd).getTime();
    const dateB = new Date(b.payPeriodEnd).getTime();
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    return b.id - a.id;
  });
};

export default function History() {
  const [history, setHistory] = useState<PaySlipData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "1";

  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    role === "Admin" ? "" : loggedInEmployeeId,
  );

  // Initialize loading to true only if a non-admin user starts with an ID
  const [loading, setLoading] = useState<boolean>(
    role !== "Admin" && Boolean(loggedInEmployeeId),
  );

  const [viewingPaySlip, setViewingPaySlip] = useState<PaySlipData | null>(
    null,
  );
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

  // 1. Fetch Employee List for Admins on Mount
  // 1. Fetch Employee List for Admins on Mount
  useEffect(() => {
    let isMounted = true;
    if (role === "Admin") {
      api
        .get("/Employees")
        .then((res) => {
          if (isMounted && res.data.length > 0) {
            // Filter out admin employees
            const nonAdminEmployees = res.data.filter(
              (emp: Employee) => !emp.isAdmin,
            );
            setEmployees(nonAdminEmployees);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [role]);

  // 2. Fetch History when target employee changes
  useEffect(() => {
    let isMounted = true;
    const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;

    if (!targetId) {
      return;
    }

    api
      .get(`/Payroll/history/${targetId}`)
      .then((res) => {
        if (isMounted) {
          setHistory(sortHistoryNewestFirst(res.data || []));
        }
      })
      .catch(() => {
        if (isMounted) setHistory([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedEmployee, loggedInEmployeeId, role]);

  const executeDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/Payroll/${deleteId}`);
      showToast("Pay slip deleted successfully.");

      const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;
      if (targetId) {
        const res = await api.get(`/Payroll/history/${targetId}`);
        setHistory(sortHistoryNewestFirst(res.data || []));
      }
    } catch {
      showToast("Failed to delete pay slip.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return history.slice(start, start + ITEMS_PER_PAGE);
  }, [history, currentPage]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Pay Slip History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              View past computed pay slips and earnings records.
            </p>
          </div>
        </div>

        {/* Main History Workspace Card */}
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
                      if (!val) {
                        setHistory([]);
                        setLoading(false);
                      } else {
                        setLoading(true);
                      }
                    }}
                    className="w-full h-11 appearance-none border border-slate-300 bg-white px-3 pr-10 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
                  >
                    <option value="" disabled>
                      Select an employee...
                    </option>
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

          {/* Desktop History Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <th className="py-3.5 px-6">Pay Period</th>
                  <th className="py-3.5 px-6">Period End Date</th>
                  <th className="py-3.5 px-6 text-right">Net Receivable</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-slate-400"
                    >
                      <Loader2
                        size={22}
                        className="animate-spin text-amber-600 mx-auto mb-2"
                      />
                      <p className="text-xs font-semibold text-slate-500">
                        Loading history records...
                      </p>
                    </td>
                  </tr>
                ) : role === "Admin" && !selectedEmployee ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-slate-400 text-xs font-medium"
                    >
                      Please select an employee above to view their pay slip
                      history.
                    </td>
                  </tr>
                ) : paginatedHistory.length > 0 ? (
                  paginatedHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-900 text-xs">
                        {item.payPeriod}
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                        {new Date(item.payPeriodEnd).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-900 text-xs">
                        ₱
                        {item.netReceivable.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-6 text-right space-x-1">
                        <button
                          onClick={() => setViewingPaySlip(item)}
                          className="text-slate-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {role === "Admin" && (
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Pay Slip"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-slate-400 text-xs"
                    >
                      No pay slip history available for this employee.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile History Card View */}
          <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
            {loading ? (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 space-y-2">
                <Loader2
                  size={22}
                  className="animate-spin text-amber-600 mx-auto"
                />
                <p className="text-xs font-semibold text-slate-500">
                  Loading history cards...
                </p>
              </div>
            ) : role === "Admin" && !selectedEmployee ? (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs font-medium">
                Please select an employee above to view their pay slip history.
              </div>
            ) : paginatedHistory.length > 0 ? (
              paginatedHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">
                        {item.payPeriod}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        End: {new Date(item.payPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingPaySlip(item)}
                        className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                      {role === "Admin" && (
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">
                      Net Receivable:
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₱
                      {item.netReceivable.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                No pay slip history available.
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

      <PaySlipModal
        isOpen={viewingPaySlip !== null}
        paySlip={viewingPaySlip}
        onClose={() => setViewingPaySlip(null)}
      />

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Pay Slip Record"
        message="Are you sure you want to delete this historical pay slip record?"
        confirmText="Delete"
        type="danger"
        onConfirm={executeDelete}
        onClose={() => setDeleteId(null)}
      />

      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
