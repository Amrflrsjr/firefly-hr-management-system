import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Calculator,
  SlidersHorizontal,
  RefreshCw,
  Loader2,
  UserCheck,
  CalendarDays,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaySlipModal, { type PaySlipData } from "../components/PaySlipModal";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface PaySlipHistoryItem {
  id: number;
  payPeriod: string;
  payPeriodEnd: string;
  netReceivable: number;
}

interface PayrollResult {
  employeeName: string;
  dailySalary: number;
  basicPay: number;
  overtimePay: number;
  regularHolidayPay: number;
  specialHolidayPay: number;
  leavePay: number;
  grossEarnings: number;
  lateDeduction: number;
  undertimeDeduction: number;
  absentDeduction: number;
  cashAdvanceDeduction: number;
  governmentContributions: number;
  totalDeductions: number;
  netReceivable: number;
}

export default function PayrollGenerator() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [payPeriodType, setPayPeriodType] = useState<"15th" | "30th">("15th");
  const [payrollData, setPayrollData] = useState<PaySlipData | null>(null);

  // Loading states
  const [loadingParams, setLoadingParams] = useState<boolean>(false);
  const [isComputing, setIsComputing] = useState<boolean>(false);

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const navigate = useNavigate();

  const [params, setParams] = useState({
    daysWorked: 0,
    approvedLeaveHours: 0,
    overtimeHours: 0,
    regularHolidayHours: 0,
    specialNonWorkingHours: 0,
    lateHours: 0,
    undertimeHours: 0,
    absentDays: 0,
    cashAdvanceDeduction: 0,
  });

  const showToast = useCallback(
    (text: string, type: "success" | "error" = "success") => {
      setToast({ text, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  useEffect(() => {
    api
      .get("/Employees")
      .then((res) => {
        setEmployees(res.data);
        if (res.data.length > 0) {
          setSelectedEmployee(res.data[0].id);
        }
      })
      .catch(() => {
        showToast("Failed to load employees list.", "error");
      });
  }, [showToast]);

  const fetchCalculatedParams = useCallback(async () => {
    if (!selectedEmployee) return;
    setLoadingParams(true);
    try {
      const res = await api.get(
        `/Payroll/calculate-params/${selectedEmployee}`,
        {
          params: { payPeriod: payPeriodType },
        },
      );
      setParams(res.data);
      showToast("System parameters updated successfully.");
    } catch {
      showToast("Failed to auto-fetch system parameters.", "error");
    } finally {
      setLoadingParams(false);
    }
  }, [selectedEmployee, payPeriodType, showToast]);

  // Handle Selection Changes: Resets generated payslip and refreshes params
  const handleEmployeeChange = (id: number) => {
    setSelectedEmployee(id);
    setPayrollData(null);
  };

  const handlePayPeriodChange = (type: "15th" | "30th") => {
    setPayPeriodType(type);
    setPayrollData(null);
  };

  useEffect(() => {
    if (!selectedEmployee) return;

    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [paramsRes, historyRes] = await Promise.all([
          api.get(`/Payroll/calculate-params/${selectedEmployee}`, {
            params: { payPeriod: payPeriodType },
          }),
          api
            .get(`/Payroll/history/${selectedEmployee}`)
            .catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        setParams(paramsRes.data);

        const periodName =
          payPeriodType === "15th"
            ? "15th Pay Period"
            : "End of Month Pay Period";
        const currentMonth = new Date().getMonth();

        const existing = historyRes.data.find((p: PaySlipHistoryItem) => {
          const pDate = new Date(p.payPeriodEnd);
          return (
            p.payPeriod === periodName && pDate.getMonth() === currentMonth
          );
        });

        if (existing) {
          showToast("Existing computed payroll loaded for this period.");
        }
      } catch {
        if (isMounted) {
          showToast("Failed to auto-fetch system parameters.", "error");
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [selectedEmployee, payPeriodType, showToast]);

  const handleInputChange = (field: keyof typeof params, value: number) => {
    setParams((prev) => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const executeCompute = async () => {
    if (!selectedEmployee) {
      showToast("Please select a valid employee first.", "error");
      return;
    }

    setShowConfirmModal(false);
    setIsComputing(true);

    try {
      const res = await api.get(`/Payroll/compute/${selectedEmployee}`, {
        params: {
          ...params,
          payPeriod: payPeriodType,
        },
      });

      const data: PayrollResult = res.data;

      // Map API Response to PaySlipData format for PaySlipModal
      const formattedPaySlip: PaySlipData = {
        id: Date.now(),
        payPeriod: payPeriodType === "15th" ? "15th Cutoff" : "30th Cutoff",
        payPeriodEnd: new Date().toISOString(),
        employeeName: data.employeeName,
        dailySalary: data.dailySalary,
        basicPay: data.basicPay,
        overtimePay: data.overtimePay,
        regularHolidayPay: data.regularHolidayPay,
        specialHolidayPay: data.specialHolidayPay,
        leavePay: data.leavePay,
        grossEarnings: data.grossEarnings,
        lateDeduction: data.lateDeduction,
        undertimeDeduction: data.undertimeDeduction,
        absentDeduction: data.absentDeduction,
        cashAdvanceDeduction: data.cashAdvanceDeduction,
        governmentContributions: data.governmentContributions,
        totalDeductions: data.totalDeductions,
        netReceivable: data.netReceivable,
      };

      setPayrollData(formattedPaySlip);
      showToast("Payroll successfully computed!");
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: string } })?.response?.data ||
        "Failed to compute payroll.";
      showToast(errorMsg, "error");
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
                <Calculator size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Payroll Generator
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Compute employee salaries, allowances, and net receivables.
            </p>
          </div>
        </div>
      </div>

      {/* Control Inputs Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <UserCheck size={14} className="text-slate-400" /> Select Employee
            </label>
            <select
              value={selectedEmployee ?? ""}
              onChange={(e) => handleEmployeeChange(Number(e.target.value))}
              disabled={isComputing}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-50 cursor-pointer"
            >
              {employees.length === 0 && (
                <option value="">No employees found</option>
              )}
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.lastName}, {emp.firstName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-slate-400" /> Pay Period
              Cutoff
            </label>
            <select
              value={payPeriodType}
              onChange={(e) =>
                handlePayPeriodChange(e.target.value as "15th" | "30th")
              }
              disabled={isComputing}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-50 cursor-pointer"
            >
              <option value="15th">15th Pay Period (29th/30th - 13th)</option>
              <option value="30th">
                End of Month Pay Period (14th - 28th)
              </option>
            </select>
          </div>
        </div>

        {/* Manual Input Fields Grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal size={14} /> Computation Parameters
            </h3>
            <button
              onClick={fetchCalculatedParams}
              disabled={loadingParams || isComputing}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={loadingParams ? "animate-spin text-amber-600" : ""}
              />
              Recalculate System Parameters
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Days Worked
              </label>
              <input
                type="number"
                step="1"
                value={params.daysWorked}
                onChange={(e) =>
                  handleInputChange(
                    "daysWorked",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={isComputing}
                className="w-full bg-white border border-slate-300 p-2 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Overtime (hrs)
              </label>
              <input
                type="number"
                step="0.5"
                value={params.overtimeHours}
                onChange={(e) =>
                  handleInputChange(
                    "overtimeHours",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={isComputing}
                className="w-full bg-white border border-slate-300 p-2 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Reg. Holiday (hrs)
              </label>
              <input
                type="number"
                step="1"
                value={params.regularHolidayHours}
                onChange={(e) =>
                  handleInputChange(
                    "regularHolidayHours",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={isComputing}
                className="w-full bg-white border border-slate-300 p-2 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Special Holiday (hrs)
              </label>
              <input
                type="number"
                step="1"
                value={params.specialNonWorkingHours}
                onChange={(e) =>
                  handleInputChange(
                    "specialNonWorkingHours",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={isComputing}
                className="w-full bg-white border border-slate-300 p-2 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Approved Leave (hrs)
              </label>
              <input
                type="number"
                step="1"
                value={params.approvedLeaveHours}
                onChange={(e) =>
                  handleInputChange(
                    "approvedLeaveHours",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={isComputing}
                className="w-full bg-white border border-slate-300 p-2 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Late (hrs)
              </label>
              <input
                type="number"
                step="0.01"
                value={params.lateHours}
                onChange={(e) =>
                  handleInputChange(
                    "lateHours",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={isComputing}
                className="w-full bg-white border border-slate-300 p-2 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Undertime (hrs)
              </label>
              <input
                type="number"
                step="0.01"
                value={params.undertimeHours}
                onChange={(e) =>
                  handleInputChange(
                    "undertimeHours",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={isComputing}
                className="w-full bg-white border border-slate-300 p-2 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Absent (Days)
              </label>
              <input
                type="number"
                step="1"
                value={params.absentDays}
                onChange={(e) =>
                  handleInputChange(
                    "absentDays",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={isComputing}
                className="w-full bg-white border border-slate-300 p-2 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-100"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Cash Advance (PHP)
              </label>
              <input
                type="number"
                step="50"
                value={params.cashAdvanceDeduction}
                onChange={(e) =>
                  handleInputChange(
                    "cashAdvanceDeduction",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={isComputing}
                className="w-full bg-white border border-slate-300 p-2 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={isComputing || !selectedEmployee}
          className="w-full bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-6 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isComputing ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Computing
              Payroll...
            </>
          ) : (
            <>
              <Calculator size={16} /> Compute Payroll
            </>
          )}
        </button>
      </div>

      {/* Reusable PaySlip Modal */}
      <PaySlipModal
        isOpen={payrollData !== null}
        paySlip={payrollData}
        onClose={() => setPayrollData(null)}
        onShowToast={showToast}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Payroll Computation"
        message={`Are you sure you want to compute payroll for the selected employee (${payPeriodType} cutoff)?`}
        confirmText="Compute"
        type="primary"
        onConfirm={executeCompute}
        onClose={() => setShowConfirmModal(false)}
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
