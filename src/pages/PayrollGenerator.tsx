import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Download,
  Calculator,
  FileText,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { toPng } from "html-to-image";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

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
  const [payrollData, setPayrollData] = useState<PayrollResult | null>(null);
  const [loadingParams, setLoadingParams] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const payslipRef = useRef<HTMLDivElement>(null);
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

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

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
  }, []);

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
  }, [selectedEmployee, payPeriodType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCalculatedParams();
  }, [fetchCalculatedParams]);

  const handleInputChange = (field: keyof typeof params, value: number) => {
    setParams((prev) => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const executeCompute = async () => {
    if (!selectedEmployee) {
      showToast("Please select a valid employee first.", "error");
      return;
    }

    try {
      const res = await api.get(`/Payroll/compute/${selectedEmployee}`, {
        params: {
          ...params,
          payPeriod: payPeriodType,
        },
      });
      setPayrollData(res.data);
      showToast("Payroll successfully computed!");
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: string } })?.response?.data ||
        "Failed to compute payroll.";
      showToast(errorMsg, "error");
    } finally {
      setShowConfirmModal(false);
    }
  };

  const checkExistingPayslip = useCallback(async () => {
    if (!selectedEmployee) return;
    try {
      const res = await api.get(`/Payroll/history/${selectedEmployee}`);
      const periodName =
        payPeriodType === "15th"
          ? "15th Pay Period"
          : "End of Month Pay Period";
      const currentMonth = new Date().getMonth();

      const existing = res.data.find((p: PaySlipHistoryItem) => {
        const pDate = new Date(p.payPeriodEnd);
        return p.payPeriod === periodName && pDate.getMonth() === currentMonth;
      });

      if (existing) {
        showToast("Existing computed payroll loaded for this period.");
      }
    } catch {
      // No history found
    }
  }, [selectedEmployee, payPeriodType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkExistingPayslip();
  }, [checkExistingPayslip]);

  // Filename formatted strictly as MMDD-15th.png or MMDD-30th.png
  const handleDownloadImage = async () => {
    if (!payslipRef.current) return;
    try {
      const dataUrl = await toPng(payslipRef.current, { cacheBust: true });
      const currentDate = new Date();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const filename = `${month}${day}-${payPeriodType}.png`;

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
      showToast("Payslip image downloaded successfully.");
    } catch {
      showToast("Failed to download payslip image.", "error");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calculator size={22} className="text-blue-600" /> Payroll
              Generator
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Compute employee salaries, allowances, and net receivables.
            </p>
          </div>
        </div>
      </div>

      {/* Control Inputs Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Select Employee
            </label>
            <select
              value={selectedEmployee ?? ""}
              onChange={(e) => setSelectedEmployee(Number(e.target.value))}
              className="w-full border border-slate-300 bg-white p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Pay Period Cutoff
            </label>
            <select
              value={payPeriodType}
              onChange={(e) =>
                setPayPeriodType(e.target.value as "15th" | "30th")
              }
              className="w-full border border-slate-300 bg-white p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="15th">15th Pay Period (29th/30th - 13th)</option>
              <option value="30th">
                End of Month Pay Period (14th - 28th)
              </option>
            </select>
          </div>
        </div>

        {/* Manual Input Fields Grid */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal size={14} /> Computation Parameters
            </h3>
            <button
              onClick={fetchCalculatedParams}
              className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RefreshCw
                size={12}
                className={loadingParams ? "animate-spin" : ""}
              />{" "}
              Recalculate System Parameters
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
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
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
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
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
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
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
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
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
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
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
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
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
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
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
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
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-slate-600 font-medium mb-1">
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
                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
        >
          <Calculator size={16} /> Compute Payroll
        </button>
      </div>

      {/* Payslip Preview */}
      {payrollData && (
        <div className="space-y-4">
          <div
            ref={payslipRef}
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6"
          >
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" /> Firefly
                  Crafts PH
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Pay Slip ({payPeriodType} Cutoff)
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">
                  {payrollData.employeeName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily Salary: PHP {payrollData.dailySalary.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                  Earnings
                </h3>
                <div className="space-y-2 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span>Basic Pay:</span>
                    <span className="font-medium text-slate-900">
                      PHP {payrollData.basicPay.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Pay (+25%):</span>
                    <span className="font-medium text-slate-900">
                      PHP {payrollData.overtimePay.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regular Holiday Pay (200%):</span>
                    <span className="font-medium text-slate-900">
                      PHP {payrollData.regularHolidayPay.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Special Holiday Pay (130%):</span>
                    <span className="font-medium text-slate-900">
                      PHP {payrollData.specialHolidayPay.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-slate-200 pt-2 text-slate-900">
                    <span>Gross Earnings:</span>
                    <span className="text-blue-600">
                      PHP {payrollData.grossEarnings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                  Deductions
                </h3>
                <div className="space-y-2 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span>Late / Undertime:</span>
                    <span className="font-medium text-slate-900">
                      PHP{" "}
                      {(
                        payrollData.lateDeduction +
                        payrollData.undertimeDeduction
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Absent Deduction:</span>
                    <span className="font-medium text-slate-900">
                      PHP {payrollData.absentDeduction.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Advance:</span>
                    <span className="font-medium text-slate-900">
                      PHP {payrollData.cashAdvanceDeduction.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Government Benefits:</span>
                    <span className="font-medium text-slate-900">
                      PHP {payrollData.governmentContributions.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-slate-200 pt-2 text-slate-900">
                    <span>Total Deductions:</span>
                    <span className="text-rose-600">
                      PHP {payrollData.totalDeductions.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
              <span className="font-bold text-blue-900 text-sm">
                Net Receivable:
              </span>
              <span className="text-xl font-bold text-blue-600">
                PHP {payrollData.netReceivable.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleDownloadImage}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-medium text-sm shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Download size={18} /> Download Payslip Image
          </button>
        </div>
      )}

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
