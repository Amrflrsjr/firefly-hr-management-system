import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Calculator,
  SlidersHorizontal,
  RefreshCw,
  Loader2,
  CalendarDays,
  Lock,
  Unlock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  AlertCircle,
  ChevronRight,
  Clock,
  Briefcase,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaySlipModal, { type PaySlipData } from "../components/PaySlipModal";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  dailySalary: number;
  dailyAllowance: number;
  hasGovernmentDeductions?: boolean;
  deductionType?: string;
  isAdmin?: boolean;
}

interface PaySlipHistoryItem {
  id: number;
  payPeriod: string;
  payPeriodEnd: string;
  netReceivable: number;
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
  sssDeduction: number;
  philHealthDeduction: number;
  pagIbigDeduction: number;
  governmentContributions: number;
  totalDeductions: number;
  dailySalary: number;
}

interface PayrollResult {
  id?: number;
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
  sssDeduction: number;
  philHealthDeduction: number;
  pagIbigDeduction: number;
  governmentContributions: number;
  totalDeductions: number;
  netReceivable: number;
}

interface EmployeeSummaryParams {
  daysWorked: number;
  overtimeHours: number;
}

export default function PayrollGenerator() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [payPeriodType, setPayPeriodType] = useState<"15th" | "30th">("15th");
  const [payrollData, setPayrollData] = useState<PaySlipData | null>(null);

  // Summary cache for employee cards
  const [employeeSummaries, setEmployeeSummaries] = useState<
    Record<number, EmployeeSummaryParams>
  >({});
  const [loadingSummaries, setLoadingSummaries] = useState<boolean>(true);

  // History & Existing record tracking
  const [historyRecords, setHistoryRecords] = useState<PaySlipHistoryItem[]>(
    [],
  );

  // Loading states
  const [loadingParams, setLoadingParams] = useState<boolean>(false);
  const [isComputing, setIsComputing] = useState<boolean>(false);

  // Manual override lock state per field
  const [unlockedFields, setUnlockedFields] = useState<Record<string, boolean>>(
    {},
  );

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

  // Load employees and pre-fetch quick summary parameters for all cards
  useEffect(() => {
    let isMounted = true;
    api
      .get("/Employees")
      .then(async (res) => {
        const nonAdminEmployees = res.data
          .filter((emp: Employee) => !emp.isAdmin)
          .sort((a: Employee, b: Employee) =>
            a.lastName.localeCompare(b.lastName),
          );

        if (!isMounted) return;
        setEmployees(nonAdminEmployees);

        // Pre-fetch basic metrics for summary cards
        setLoadingSummaries(true);
        const summaries: Record<number, EmployeeSummaryParams> = {};
        await Promise.all(
          nonAdminEmployees.map(async (emp: Employee) => {
            try {
              const paramRes = await api.get(
                `/Payroll/calculate-params/${emp.id}`,
                {
                  params: { payPeriod: payPeriodType },
                },
              );
              summaries[emp.id] = {
                daysWorked: paramRes.data.daysWorked || 0,
                overtimeHours: paramRes.data.overtimeHours || 0,
              };
            } catch {
              summaries[emp.id] = { daysWorked: 0, overtimeHours: 0 };
            }
          }),
        );

        if (isMounted) {
          setEmployeeSummaries(summaries);
          setLoadingSummaries(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          showToast("Failed to load employees list.", "error");
          setLoadingSummaries(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [payPeriodType, showToast]);

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

  const handlePayPeriodChange = (type: "15th" | "30th") => {
    setPayPeriodType(type);
    setPayrollData(null);
  };

  // Fetch history & check existing records whenever employee or cutoff changes
  useEffect(() => {
    if (!selectedEmployee) return;

    let isMounted = true;

    const loadInitialData = async () => {
      setLoadingParams(true);
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
        setHistoryRecords(historyRes.data || []);
      } catch {
        if (isMounted) {
          showToast("Failed to fetch initial payroll data.", "error");
        }
      } finally {
        if (isMounted) setLoadingParams(false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [selectedEmployee, payPeriodType, showToast]);

  // Check if an existing record exists for the currently selected period
  const existingRecord = useMemo(() => {
    const periodName =
      payPeriodType === "15th" ? "15th Pay Period" : "End of Month Pay Period";
    const currentMonth = new Date().getMonth();

    return historyRecords.find((p) => {
      const pDate = new Date(p.payPeriodEnd);
      return (
        p.payPeriod?.toLowerCase().includes(payPeriodType.toLowerCase()) ||
        (p.payPeriod === periodName && pDate.getMonth() === currentMonth)
      );
    });
  }, [historyRecords, payPeriodType]);

  const handleInputChange = (field: keyof typeof params, value: number) => {
    setParams((prev) => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const toggleFieldLock = (field: string) => {
    setUnlockedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const currentEmployeeObj = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployee);
  }, [employees, selectedEmployee]);

  // Live Estimated Calculations Preview
  const estimatedPreview = useMemo(() => {
    if (!currentEmployeeObj) return { gross: 0, deductions: 0, net: 0 };

    const dailyAllowance = currentEmployeeObj.dailyAllowance || 0;
    const dailySalary = currentEmployeeObj.dailySalary || 0;
    const combinedDailyRate = dailySalary + dailyAllowance;
    const hourlyRate = dailySalary / 8.0;

    const basicPay = combinedDailyRate * params.daysWorked;
    const overtimePay = params.overtimeHours * hourlyRate * 1.25;
    const regularHolidayPay = params.regularHolidayHours * hourlyRate * 2.0;
    const specialHolidayPay = params.specialNonWorkingHours * hourlyRate * 1.3;
    const leavePay = params.approvedLeaveHours * hourlyRate;

    const grossEarnings =
      basicPay + overtimePay + regularHolidayPay + specialHolidayPay + leavePay;

    const lateDeduction = params.lateHours * hourlyRate;
    const undertimeDeduction = params.undertimeHours * hourlyRate;
    const absentDeduction = params.absentDays * combinedDailyRate;

    let totalGovtContributions = 0;
    if (currentEmployeeObj.hasGovernmentDeductions) {
      const isPerPeriod = currentEmployeeObj.deductionType === "Per Pay Period";
      const estimatedMonthlySalary = dailySalary * 26.0;

      const monthlyPagIbig = Math.min(estimatedMonthlySalary * 0.02, 200.0);
      const pagIbigDeduction = isPerPeriod
        ? monthlyPagIbig / 2.0
        : monthlyPagIbig;

      const boundedPhilHealthBase = Math.max(
        10000.0,
        Math.min(estimatedMonthlySalary, 100000.0),
      );
      const monthlyPhilHealth = boundedPhilHealthBase * 0.025;
      const philHealthDeduction = isPerPeriod
        ? monthlyPhilHealth / 2.0
        : monthlyPhilHealth;

      const monthlySss =
        estimatedMonthlySalary <= 4250
          ? 400
          : estimatedMonthlySalary >= 29750
            ? 2700
            : (Math.floor((estimatedMonthlySalary - 4250) / 500) * 500 + 4500) *
              0.045;
      const sssDeduction = isPerPeriod ? monthlySss / 2.0 : monthlySss;

      totalGovtContributions =
        sssDeduction + philHealthDeduction + pagIbigDeduction;
    }

    const totalDeductions =
      lateDeduction +
      undertimeDeduction +
      absentDeduction +
      params.cashAdvanceDeduction +
      totalGovtContributions;
    const netReceivable = grossEarnings - totalDeductions;

    return {
      gross: Math.max(0, grossEarnings),
      deductions: Math.max(0, totalDeductions),
      net: Math.max(0, netReceivable),
    };
  }, [currentEmployeeObj, params]);

  const viewExistingPaySlip = () => {
    if (!existingRecord) return;
    const formattedPaySlip: PaySlipData = {
      id: existingRecord.id,
      payPeriod: existingRecord.payPeriod || payPeriodType,
      payPeriodEnd: existingRecord.payPeriodEnd,
      employeeName: currentEmployeeObj
        ? `${currentEmployeeObj.lastName}, ${currentEmployeeObj.firstName}`
        : "Employee",
      dailySalary:
        existingRecord.dailySalary || currentEmployeeObj?.dailySalary || 0,
      dailyAllowance: currentEmployeeObj?.dailyAllowance || 0,
      basicPay: existingRecord.basicPay,
      overtimePay: existingRecord.overtimePay,
      regularHolidayPay: existingRecord.regularHolidayPay,
      specialHolidayPay: existingRecord.specialHolidayPay,
      leavePay: existingRecord.leavePay,
      grossEarnings: existingRecord.grossEarnings,
      lateDeduction: existingRecord.lateDeduction,
      undertimeDeduction: existingRecord.undertimeDeduction,
      absentDeduction: existingRecord.absentDeduction,
      cashAdvanceDeduction: existingRecord.cashAdvanceDeduction,
      sssDeduction: existingRecord.sssDeduction,
      philHealthDeduction: existingRecord.philHealthDeduction,
      pagIbigDeduction: existingRecord.pagIbigDeduction,
      governmentContributions: existingRecord.governmentContributions,
      totalDeductions: existingRecord.totalDeductions,
      netReceivable: existingRecord.netReceivable,
    };
    setPayrollData(formattedPaySlip);
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

      const formattedPaySlip: PaySlipData = {
        id: data.id || Date.now(),
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
        sssDeduction: data.sssDeduction,
        philHealthDeduction: data.philHealthDeduction,
        pagIbigDeduction: data.pagIbigDeduction,
        governmentContributions: data.governmentContributions,
        totalDeductions: data.totalDeductions,
        netReceivable: data.netReceivable,
      };

      setPayrollData(formattedPaySlip);
      showToast("Payroll successfully computed!");

      // Refresh history records list
      const historyRes = await api
        .get(`/Payroll/history/${selectedEmployee}`)
        .catch(() => ({ data: [] }));
      setHistoryRecords(historyRes.data || []);
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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectedEmployee !== null) {
                  setSelectedEmployee(null);
                } else {
                  navigate("/dashboard");
                }
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer shrink-0"
              title={
                selectedEmployee !== null
                  ? "Back to Employee List"
                  : "Return to Dashboard"
              }
            >
              <ArrowLeft size={19} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
                <Calculator size={18} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Payroll Generator
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedEmployee === null
                    ? "Overview of employee work hours per pay period. Select an employee to create payroll."
                    : `Calculating payroll for ${currentEmployeeObj ? `${currentEmployeeObj.lastName}, ${currentEmployeeObj.firstName}` : "Employee"}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: All Employees Summary Dashboard View */}
        {selectedEmployee === null ? (
          <div className="space-y-4">
            {/* Cutoff Selector Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-amber-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Pay Period Cutoff Overview
                </span>
              </div>
              <div className="w-full sm:w-auto">
                <select
                  value={payPeriodType}
                  onChange={(e) =>
                    handlePayPeriodChange(e.target.value as "15th" | "30th")
                  }
                  className="w-full sm:w-72 h-10 border border-slate-300 bg-white px-3 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
                >
                  <option value="15th">
                    15th Pay Period (29th/30th - 13th)
                  </option>
                  <option value="30th">
                    End of Month Pay Period (14th - 28th)
                  </option>
                </select>
              </div>
            </div>

            {/* Employees Summary Grid Cards */}
            {employees.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs shadow-sm">
                No employees available.
              </div>
            ) : loadingSummaries ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 space-y-2 shadow-sm">
                <Loader2
                  size={24}
                  className="animate-spin text-amber-600 mx-auto"
                />
                <p className="text-xs font-semibold text-slate-500">
                  Loading employee period summaries...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((emp) => {
                  const summary = employeeSummaries[emp.id] || {
                    daysWorked: 0,
                    overtimeHours: 0,
                  };
                  return (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployee(emp.id);
                        setPayrollData(null);
                        setUnlockedFields({});
                      }}
                      className="bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-xs"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-900 transition-colors">
                            {emp.lastName}, {emp.firstName}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Briefcase size={12} /> Daily Rate: ₱
                            {emp.dailySalary?.toLocaleString()}
                          </p>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-800 group-hover:bg-amber-100 flex items-center justify-center transition-colors shrink-0">
                          <ChevronRight size={16} />
                        </div>
                      </div>

                      {/* Hours Worked & Overtime Box */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 p-3 rounded-lg">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Days Worked
                          </span>
                          <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                            {summary.daysWorked}{" "}
                            {summary.daysWorked === 1 ? "day" : "days"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Overtime
                          </span>
                          <span className="font-mono font-bold text-amber-900 text-sm mt-0.5 block items-center gap-1">
                            <Clock
                              size={12}
                              className="text-amber-600 shrink-0"
                            />
                            {summary.overtimeHours} hrs
                          </span>
                        </div>
                      </div>

                      <button className="w-full bg-slate-900 group-hover:bg-(--primary) group-hover:text-slate-950 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
                        <Calculator size={14} /> Make Payroll
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* STEP 2: Calculation Table & Parameters View for Selected Employee */
          <div className="space-y-5">
            {/* Selected Employee Card & Switcher */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shrink-0">
                  {currentEmployeeObj?.firstName?.[0]}
                  {currentEmployeeObj?.lastName?.[0]}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Selected Employee
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {currentEmployeeObj?.lastName},{" "}
                    {currentEmployeeObj?.firstName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="w-full sm:w-auto text-xs font-semibold text-slate-600 hover:text-amber-800 bg-white border border-slate-300 px-3 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Back to Employee List
              </button>
            </div>

            {/* Existing Record Notice Banner */}
            {existingRecord && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">
                      Payslip Already Generated for this Period
                    </h4>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      A {payPeriodType} payslip already exists for this
                      employee. To recalculate or change parameters, please
                      delete the existing record from History first. Net Pay:{" "}
                      <strong className="font-mono">
                        ₱
                        {existingRecord.netReceivable.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                          },
                        )}
                      </strong>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={viewExistingPaySlip}
                    className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <FileText size={14} /> View Payslip
                  </button>
                  <button
                    onClick={() => navigate("/history")}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    Go to History to Delete
                  </button>
                </div>
              </div>
            )}

            {/* Main Payroll Workspace */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {/* Pay Period Selection */}
              <div className="p-5 sm:p-6 border-b border-slate-200">
                <div className="max-w-md">
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2 flex items-center gap-1.5">
                    <CalendarDays size={13} className="text-slate-400" />
                    Pay Period Cutoff
                  </label>
                  <select
                    value={payPeriodType}
                    onChange={(e) =>
                      handlePayPeriodChange(e.target.value as "15th" | "30th")
                    }
                    disabled={isComputing}
                    className="w-full h-11 border border-slate-300 bg-white px-3 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
                  >
                    <option value="15th">
                      15th Pay Period (29th/30th - 13th)
                    </option>
                    <option value="30th">
                      End of Month Pay Period (14th - 28th)
                    </option>
                  </select>
                </div>
              </div>

              {/* Computation Parameters */}
              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal
                          size={14}
                          className="text-slate-400"
                        />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                          Computation Parameters
                        </h2>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100">
                        <CheckCircle2 size={11} />
                        Attendance synced
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 ml-6">
                      Values are calculated from attendance and can be manually
                      overridden where permitted.
                    </p>
                  </div>

                  <button
                    onClick={fetchCalculatedParams}
                    disabled={loadingParams || isComputing}
                    className="self-start sm:self-auto shrink-0 text-xs text-slate-600 hover:text-amber-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw
                      size={13}
                      className={
                        loadingParams ? "animate-spin text-amber-600" : ""
                      }
                    />
                    Recalculate System Parameters
                  </button>
                </div>

                {/* Parameter Groups */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                  {/* Earnings */}
                  <section className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={15} className="text-emerald-600" />
                        <h3 className="text-xs font-bold text-slate-800">
                          Earnings & Additions
                        </h3>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Attendance
                      </span>
                    </div>

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      {[
                        { label: "Days Worked", key: "daysWorked", step: "1" },
                        {
                          label: "Overtime (hrs)",
                          key: "overtimeHours",
                          step: "0.5",
                        },
                        {
                          label: "Reg. Holiday (hrs)",
                          key: "regularHolidayHours",
                          step: "1",
                        },
                        {
                          label: "Special Holiday (hrs)",
                          key: "specialNonWorkingHours",
                          step: "1",
                        },
                        {
                          label: "Approved Leave (hrs)",
                          key: "approvedLeaveHours",
                          step: "1",
                        },
                      ].map(({ label, key, step }) => {
                        const isUnlocked = unlockedFields[key];

                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                {label}
                              </label>
                              <button
                                type="button"
                                onClick={() => toggleFieldLock(key)}
                                className={`inline-flex items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer ${
                                  isUnlocked
                                    ? "text-amber-700"
                                    : "text-slate-400 hover:text-slate-600"
                                }`}
                                title={
                                  isUnlocked
                                    ? "Lock input (auto-synced)"
                                    : "Unlock for manual override"
                                }
                              >
                                {isUnlocked ? (
                                  <>
                                    <Unlock size={11} />
                                    Manual
                                  </>
                                ) : (
                                  <>
                                    <Lock size={11} />
                                    Synced
                                  </>
                                )}
                              </button>
                            </div>

                            <input
                              type="number"
                              step={step}
                              value={params[key as keyof typeof params]}
                              onChange={(e) =>
                                handleInputChange(
                                  key as keyof typeof params,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              disabled={isComputing || !isUnlocked}
                              className={`w-full h-10 border px-3 rounded-lg font-mono text-sm font-semibold transition-colors ${
                                loadingParams
                                  ? "animate-pulse bg-amber-50/30"
                                  : ""
                              } ${
                                isUnlocked
                                  ? "border-amber-300 bg-amber-50/20 text-slate-900 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                                  : "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed select-none"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Deductions */}
                  <section className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={15} className="text-rose-500" />
                        <h3 className="text-xs font-bold text-slate-800">
                          Deductions & Adjustments
                        </h3>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Payroll
                      </span>
                    </div>

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      {[
                        { label: "Late (hrs)", key: "lateHours", step: "0.01" },
                        {
                          label: "Undertime (hrs)",
                          key: "undertimeHours",
                          step: "0.01",
                        },
                        {
                          label: "Absent (days)",
                          key: "absentDays",
                          step: "1",
                        },
                        {
                          label: "Cash Advance (PHP)",
                          key: "cashAdvanceDeduction",
                          step: "50",
                        },
                      ].map(({ label, key, step }) => {
                        const isUnlocked = unlockedFields[key];

                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                {label}
                              </label>
                              <button
                                type="button"
                                onClick={() => toggleFieldLock(key)}
                                className={`inline-flex items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer ${
                                  isUnlocked
                                    ? "text-amber-700"
                                    : "text-slate-400 hover:text-slate-600"
                                }`}
                                title={
                                  isUnlocked
                                    ? "Lock input (auto-synced)"
                                    : "Unlock for manual override"
                                }
                              >
                                {isUnlocked ? (
                                  <>
                                    <Unlock size={11} />
                                    Manual
                                  </>
                                ) : (
                                  <>
                                    <Lock size={11} />
                                    Synced
                                  </>
                                )}
                              </button>
                            </div>

                            <input
                              type="number"
                              step={step}
                              value={params[key as keyof typeof params]}
                              onChange={(e) =>
                                handleInputChange(
                                  key as keyof typeof params,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              disabled={isComputing || !isUnlocked}
                              className={`w-full h-10 border px-3 rounded-lg font-mono text-sm font-semibold transition-colors ${
                                loadingParams
                                  ? "animate-pulse bg-amber-50/30"
                                  : ""
                              } ${
                                isUnlocked
                                  ? "border-amber-300 bg-amber-50/20 text-slate-900 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                                  : "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed select-none"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* Payroll Summary */}
                <div className="mt-5 border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2">
                    <Wallet size={15} className="text-amber-700 shrink-0" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        Payroll Summary
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Estimated totals based on active profile rates and
                        parameters.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    <div className="px-4 py-4 sm:px-5">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Gross Earnings
                      </span>
                      <span className="block mt-1 font-mono text-base font-bold text-slate-800">
                        ₱
                        {estimatedPreview.gross.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="px-4 py-4 sm:px-5">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Total Deductions
                      </span>
                      <span className="block mt-1 font-mono text-base font-bold text-rose-600">
                        -₱
                        {estimatedPreview.deductions.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="px-4 py-4 sm:px-5 bg-amber-50/40">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Estimated Net Pay
                      </span>
                      <span className="block mt-1 font-mono text-xl font-black text-slate-950">
                        ₱
                        {estimatedPreview.net.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action */}
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    {existingRecord
                      ? "You can re-compute and overwrite this period's payroll if parameter adjustments are needed."
                      : "Review the calculated parameters before generating the payslip."}
                  </p>

                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isComputing || !selectedEmployee}
                    className="w-full sm:w-auto min-w-65 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-5 py-3 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isComputing ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Computing Payroll...
                      </>
                    ) : existingRecord ? (
                      <>
                        <RefreshCw size={15} />
                        Re-compute & Update Payslip
                      </>
                    ) : (
                      <>
                        <Calculator size={15} />
                        Compute Payroll & Generate Payslip
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
        title={
          existingRecord
            ? "Overwrite Existing Payroll?"
            : "Confirm Payroll Computation"
        }
        message={
          existingRecord
            ? `A payslip has already been generated for this employee (${payPeriodType} cutoff). Do you want to re-compute and update it?`
            : `Are you sure you want to compute payroll for the selected employee (${payPeriodType} cutoff)?`
        }
        confirmText={existingRecord ? "Update & Re-compute" : "Compute"}
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
