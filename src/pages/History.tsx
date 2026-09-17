import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaySlipModal, { type PaySlipData } from "../components/PaySlipModal";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

const ITEMS_PER_PAGE = 5;

export default function History() {
  const [history, setHistory] = useState<PaySlipData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "1";
  const [selectedEmployee, setSelectedEmployee] =
    useState<string>(loggedInEmployeeId);

  // Initialize loading based on whether we have a target ID to fetch
  const initialTargetId =
    role === "Admin" ? selectedEmployee : loggedInEmployeeId;
  const [loading, setLoading] = useState<boolean>(Boolean(initialTargetId));

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

  // Helper to sort history so newest pay slips are at the top
  const sortHistoryNewestFirst = (data: PaySlipData[]) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.payPeriodEnd).getTime();
      const dateB = new Date(b.payPeriodEnd).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // Newest date first
      }
      return b.id - a.id; // Fallback to highest ID if dates are identical
    });
  };

  // 1. Fetch Employee List for Admins on Mount
  useEffect(() => {
    let isMounted = true;
    if (role === "Admin") {
      api
        .get("/Employees")
        .then((res) => {
          if (isMounted && res.data.length > 0) {
            setEmployees(res.data);
            setSelectedEmployee((prev) =>
              prev === "1" ? String(res.data[0].id) : prev,
            );
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

    if (targetId) {
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
    }

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
      const res = await api.get(`/Payroll/history/${targetId}`);
      setHistory(sortHistoryNewestFirst(res.data || []));
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
              <FileText size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Pay Slip History
            </h1>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            View past computed pay slips and earnings records.
          </p>
        </div>

        {/* Timesheet-style Employee Selection Dropdown */}
        {role === "Admin" && employees.length > 0 && (
          <div className="relative w-full sm:w-56">
            <select
              value={selectedEmployee}
              onChange={(e) => {
                setSelectedEmployee(e.target.value);
                setCurrentPage(1);
                setLoading(true);
              }}
              className="w-full appearance-none border border-slate-200 bg-slate-50 hover:bg-slate-100/80 px-3 py-2 pr-8 rounded-xl text-xs font-semibold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-(--primary) focus:bg-white cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={String(emp.id)}>
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
      </div>

      {/* Desktop History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">Pay Period</th>
              <th className="py-3.5 px-5">Period End Date</th>
              <th className="py-3.5 px-5 text-right">Net Receivable</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  <Loader2
                    size={24}
                    className="animate-spin text-amber-600 mx-auto mb-2"
                  />
                  <p className="text-xs font-semibold text-slate-500">
                    Loading history records...
                  </p>
                </td>
              </tr>
            ) : paginatedHistory.length > 0 ? (
              paginatedHistory.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-4 px-5 font-bold text-slate-900">
                    {item.payPeriod}
                  </td>
                  <td className="py-4 px-5 text-slate-600 text-xs font-medium">
                    {new Date(item.payPeriodEnd).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-5 text-right font-mono font-bold text-amber-800">
                    PHP {item.netReceivable.toFixed(2)}
                  </td>
                  <td className="py-4 px-5 text-right space-x-1">
                    <button
                      onClick={() => setViewingPaySlip(item)}
                      className="text-slate-400 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {role === "Admin" && (
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
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
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
            <Loader2 size={24} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              Loading history cards...
            </p>
          </div>
        ) : paginatedHistory.length > 0 ? (
          paginatedHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {item.payPeriod}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    End: {new Date(item.payPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewingPaySlip(item)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye size={16} />
                  </button>
                  {role === "Admin" && (
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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
                <span className="font-mono font-bold text-blue-600 text-sm">
                  PHP {item.netReceivable.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No pay slip history available.
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
