import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Calculator,
  RefreshCw,
  Loader2,
  CalendarDays,
  FileText,
  AlertCircle,
  Wallet,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaySlipModal, { type PaySlipData } from "../components/PaySlipModal";
import EmployeeListGrid from "../components/payroll/EmployeeListGrid";
import ParameterSection from "../components/payroll/ParameterSection";

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

  const [employeeSummaries, setEmployeeSummaries] = useState<
    Record<number, EmployeeSummaryParams>
  >({});
  const [loadingSummaries, setLoadingSummaries] = useState<boolean>(true);
  const [historyRecords, setHistoryRecords] = useState<PaySlipHistoryItem[]>(
    [],
  );

  const [loadingParams, setLoadingParams] = useState<boolean>(false);
  const [isComputing, setIsComputing] = useState<boolean>(false);
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

        setLoadingSummaries(true);
        const summaries: Record<number, EmployeeSummaryParams> = {};
        await Promise.all(
          nonAdminEmployees.map(async (emp: Employee) => {
            try {
              const paramRes = await api.get(
                `/Payroll/calculate-params/${emp.id}`,
                { params: { payPeriod: payPeriodType } },
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
        { params: { payPeriod: payPeriodType } },
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

  const handleInputChange = (field: string, value: number) => {
    setParams((prev) => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const toggleFieldLock = (field: string) => {
    setUnlockedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const currentEmployeeObj = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployee);
  }, [employees, selectedEmployee]);

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
        params: { ...params, payPeriod: payPeriodType },
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
                    : `Calculating payroll for ${currentEmployeeObj ? `${currentEmployeeObj.lastName},${currentEmployeeObj.firstName}` : "Employee"}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {selectedEmployee === null ? (
          <EmployeeListGrid
            employees={employees}
            employeeSummaries={employeeSummaries}
            loadingSummaries={loadingSummaries}
            payPeriodType={payPeriodType}
            onPayPeriodChange={handlePayPeriodChange}
            onSelectEmployee={(id) => {
              setSelectedEmployee(id);
              setPayrollData(null);
              setUnlockedFields({});
            }}
          />
        ) : (
          <div className="space-y-5">
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
                      employee. Net Pay:{" "}
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

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
                    className="w-full h-11 border border-slate-300 bg-white px-3 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 disabled:bg-slate-50 cursor-pointer"
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

              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                    Computation Parameters
                  </h2>
                  <button
                    onClick={fetchCalculatedParams}
                    disabled={loadingParams || isComputing}
                    className="text-xs text-slate-600 hover:text-amber-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                  <ParameterSection
                    title="Earnings & Additions"
                    type="earnings"
                    items={[
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
                    ]}
                    params={params}
                    unlockedFields={unlockedFields}
                    loadingParams={loadingParams}
                    isComputing={isComputing}
                    onInputChange={handleInputChange}
                    onToggleLock={toggleFieldLock}
                  />

                  <ParameterSection
                    title="Deductions & Adjustments"
                    type="deductions"
                    items={[
                      { label: "Late (hrs)", key: "lateHours", step: "0.01" },
                      {
                        label: "Undertime (hrs)",
                        key: "undertimeHours",
                        step: "0.01",
                      },
                      { label: "Absent (days)", key: "absentDays", step: "1" },
                      {
                        label: "Cash Advance (PHP)",
                        key: "cashAdvanceDeduction",
                        step: "50",
                      },
                    ]}
                    params={params}
                    unlockedFields={unlockedFields}
                    loadingParams={loadingParams}
                    isComputing={isComputing}
                    onInputChange={handleInputChange}
                    onToggleLock={toggleFieldLock}
                  />
                </div>

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
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    Review calculated parameters before generating payslip.
                  </p>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isComputing || !selectedEmployee}
                    className="w-full sm:w-auto min-w-65 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-5 py-3 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
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

      <PaySlipModal
        isOpen={payrollData !== null}
        paySlip={payrollData}
        onClose={() => setPayrollData(null)}
        onShowToast={showToast}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        title={
          existingRecord
            ? "Overwrite Existing Payroll?"
            : "Confirm Payroll Computation"
        }
        message={
          existingRecord
            ? "A payslip has already been generated. Re-compute and update?"
            : "Are you sure you want to compute payroll?"
        }
        confirmText={existingRecord ? "Update & Re-compute" : "Compute"}
        type="primary"
        onConfirm={executeCompute}
        onClose={() => setShowConfirmModal(false)}
      />

      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
