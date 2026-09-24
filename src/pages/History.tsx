import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  ChevronRight as ChevronRightIcon,
  ArrowLeft,
  Calendar,
  CreditCard,
} from "lucide-react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaySlipModal, { type PaySlipData } from "../components/PaySlipModal";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  dailySalary: number;
  dailyAllowance: number;
  isAdmin?: boolean;
}

const ITEMS_PER_PAGE = 5;

export default function History() {
  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "1";

  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    role === "Admin" ? "" : loggedInEmployeeId,
  );

  const initialTargetId =
    role === "Admin" ? selectedEmployee : loggedInEmployeeId;

  const [history, setHistory] = useState<PaySlipData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
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

  // 1. Fetch Employee List for Admins on Mount
  useEffect(() => {
    let isMounted = true;
    if (role === "Admin") {
      api
        .get("/Employees")
        .then((res) => {
          if (isMounted && res.data.length > 0) {
            const nonAdminEmployees = res.data
              .filter((emp: Employee) => !emp.isAdmin)
              .sort((a: Employee, b: Employee) =>
                a.lastName.localeCompare(b.lastName),
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

  // 2. Fetch Paginated History when target employee or page changes
  useEffect(() => {
    let isMounted = true;
    const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;

    if (!targetId) {
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/Payroll/history/${targetId}?page=${currentPage}&pageSize=${ITEMS_PER_PAGE}`,
        );
        if (isMounted) {
          setHistory(res.data.items || []);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch {
        if (isMounted) {
          setHistory([]);
          setTotalPages(1);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedEmployee, loggedInEmployeeId, role, currentPage]);

  const executeDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/Payroll/${deleteId}`);
      showToast("Pay slip deleted successfully.");

      const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;
      if (targetId) {
        const res = await api.get(
          `/Payroll/history/${targetId}?page=${currentPage}&pageSize=${ITEMS_PER_PAGE}`,
        );
        setHistory(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      showToast("Failed to delete pay slip.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  // Group current page history items by Month and Year
  const groupedHistoryByMonth = useMemo(() => {
    const groups: Record<string, PaySlipData[]> = {};
    history.forEach((item) => {
      const date = new Date(item.payPeriodEnd);
      const monthYear = isNaN(date.getTime())
        ? "General History"
        : date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          });

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(item);
    });
    return groups;
  }, [history]);

  const currentEmployeeObj = useMemo(() => {
    return employees.find((e) => String(e.id) === selectedEmployee);
  }, [employees, selectedEmployee]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {role === "Admin" && selectedEmployee && (
              <button
                onClick={() => {
                  setSelectedEmployee("");
                  setHistory([]);
                  setCurrentPage(1);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer shrink-0"
                title="Back to Employee List"
              >
                <ArrowLeft size={19} />
              </button>
            )}

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <FileText size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                {role === "Admin" && selectedEmployee && currentEmployeeObj
                  ? `Pay Slip History: ${currentEmployeeObj.lastName}, ${currentEmployeeObj.firstName}`
                  : "Pay Slip History"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {role === "Admin" && !selectedEmployee
                  ? "Select an employee card below to view their archived payslips."
                  : "View past computed pay slips and earnings records grouped by month."}
              </p>
            </div>
          </div>

          {role === "Admin" && selectedEmployee && (
            <button
              onClick={() => {
                setSelectedEmployee("");
                setHistory([]);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-amber-800 bg-white border border-slate-300 px-3 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Switch Employee
            </button>
          )}
        </div>

        {/* ADMIN VIEW: Employee Selection Grid Cards */}
        {role === "Admin" && !selectedEmployee ? (
          <div className="space-y-4">
            {employees.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs shadow-sm">
                No employees available.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployee(String(emp.id));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-900 transition-colors">
                          {emp.lastName}, {emp.firstName}
                        </h3>
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Briefcase size={12} className="text-slate-400" />{" "}
                            Daily Rate:{" "}
                            <span className="font-mono font-semibold text-slate-700">
                              ₱{emp.dailySalary?.toLocaleString()}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <CreditCard size={12} className="text-slate-400" />{" "}
                            Daily Allowance:{" "}
                            <span className="font-mono font-semibold text-emerald-600">
                              ₱{emp.dailyAllowance?.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-800 group-hover:bg-amber-100 flex items-center justify-center transition-colors shrink-0">
                        <ChevronRightIcon size={16} />
                      </div>
                    </div>

                    <button className="w-full bg-slate-950 group-hover:bg-(--primary) group-hover:text-slate-950 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
                      <FileText size={14} /> View Payslip History
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* HISTORY LIST & MONTHLY SECTIONS VIEW */
          <div className="space-y-6">
            {Object.keys(groupedHistoryByMonth).length > 0 && !loading && (
              <div className="space-y-6">
                {Object.entries(groupedHistoryByMonth).map(
                  ([monthYear, items]) => (
                    <div
                      key={monthYear}
                      className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
                    >
                      {/* Month Section Header */}
                      <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center gap-2">
                        <Calendar size={15} className="text-amber-700" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                          {monthYear}
                        </h2>
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                          {items.length}{" "}
                          {items.length === 1 ? "payslip" : "payslips"}
                        </span>
                      </div>

                      {/* Month Items Table / Cards */}
                      <div className="divide-y divide-slate-100">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                          >
                            <div>
                              <h3 className="font-bold text-slate-900 text-xs">
                                {item.payPeriod}
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Cutoff End Date:{" "}
                                {new Date(
                                  item.payPeriodEnd,
                                ).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                ₱
                                {item.netReceivable.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setViewingPaySlip(item)}
                                  className="text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  <Eye size={14} /> View
                                </button>
                                {role === "Admin" && (
                                  <button
                                    onClick={() => setDeleteId(item.id)}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete Record"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {/* Loading & Empty States */}
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 space-y-2 shadow-sm">
                <Loader2
                  size={24}
                  className="animate-spin text-amber-600 mx-auto"
                />
                <p className="text-xs font-semibold text-slate-500">
                  Loading history records...
                </p>
              </div>
            ) : history.length === 0 && !loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs shadow-sm">
                No pay slip history available for this employee.
              </div>
            ) : null}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between text-xs font-semibold text-slate-600">
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
        )}
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
