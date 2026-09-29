import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Calculator,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaySlipModal, { type PaySlipData } from "../components/PaySlipModal";
import EmployeeListGrid from "../components/payroll/EmployeeListGrid";
import ParameterSection, {
  type ParameterItem,
} from "../components/payroll/ParameterSection";
import {
  EMPTY_PARAMS,
  PERIOD_LABEL,
  estimatePayroll,
  findCurrentRecord,
  formatPeriodRange,
  normalizeParams,
  peso,
  pickAmounts,
  type Employee,
  type PayPeriodType,
  type PayrollAmounts,
  type PayrollParamKey,
  type PayrollParams,
  type PaySlipHistoryItem,
} from "../components/payroll/payrollUtils";

interface PayrollResult extends PayrollAmounts {
  id?: number;
  employeeName: string;
}

// Max values are sanity limits for typos, not business rules. Adjust to your policy.
const EARNING_ITEMS: ParameterItem[] = [
  { label: "Days worked", key: "daysWorked", step: "1", unit: "days", max: 16 },
  {
    label: "Overtime",
    key: "overtimeHours",
    step: "0.5",
    unit: "hrs",
    max: 120,
  },
  {
    label: "Regular holiday",
    key: "regularHolidayHours",
    step: "1",
    unit: "hrs",
    max: 48,
  },
  {
    label: "Special holiday",
    key: "specialNonWorkingHours",
    step: "1",
    unit: "hrs",
    max: 48,
  },
  {
    label: "Approved leave",
    key: "approvedLeaveHours",
    step: "1",
    unit: "hrs",
    max: 80,
  },
];

const DEDUCTION_ITEMS: ParameterItem[] = [
  { label: "Late", key: "lateHours", step: "0.01", unit: "hrs", max: 80 },
  {
    label: "Undertime",
    key: "undertimeHours",
    step: "0.01",
    unit: "hrs",
    max: 80,
  },
  { label: "Absent", key: "absentDays", step: "1", unit: "days", max: 16 },
  {
    label: "Cash advance",
    key: "cashAdvanceDeduction",
    step: "50",
    unit: "PHP",
    max: 1_000_000,
  },
];

function buildPaySlip(
  src: Partial<PayrollAmounts> & { id?: number },
  meta: Pick<
    PaySlipData,
    "payPeriod" | "payPeriodEnd" | "employeeName" | "dailyAllowance"
  >,
): PaySlipData {
  return {
    id: src.id ?? Date.now(),
    ...meta,
    ...pickAmounts(src),
  } as PaySlipData;
}

function Line({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  if (value === 0) return null;
  return (
    <div className="flex justify-between text-xs py-1">
      <dt className="text-slate-600">{label}</dt>
      <dd
        className={`font-mono ${negative ? "text-rose-600" : "text-slate-800"}`}
      >
        {negative ? "−" : ""}
        {peso(value)}
      </dd>
    </div>
  );
}

export default function PayrollGenerator() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [generatedIds, setGeneratedIds] = useState<Set<number>>(new Set());
  const [summaries, setSummaries] = useState<Record<number, PayrollParams>>({});
  const [loadingSummaries, setLoadingSummaries] = useState(true);

  const [payPeriodType, setPayPeriodType] = useState<PayPeriodType>("15th");
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [payrollData, setPayrollData] = useState<PaySlipData | null>(null);

  const [params, setParams] = useState<PayrollParams>(EMPTY_PARAMS);
  const [syncedParams, setSyncedParams] = useState<PayrollParams>(EMPTY_PARAMS);
  const [overridden, setOverridden] = useState<Record<string, boolean>>({});
  const [historyRecords, setHistoryRecords] = useState<PaySlipHistoryItem[]>(
    [],
  );

  const [loadingParams, setLoadingParams] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRequest = useRef(0);
  const detailRequest = useRef(0);

  const showToast = useCallback(
    (text: string, type: "success" | "error" = "success") => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ text, type });
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  /* ----------------------------- Data loading ----------------------------- */

  // Lightweight refresh: only "who's generated", no per-employee calls.
  const refreshGenerated = useCallback(async (period: PayPeriodType) => {
    try {
      const res = await api.get("/Payroll/status-summary", {
        params: { payPeriod: period },
      });
      setGeneratedIds(new Set<number>(res.data || []));
    } catch {
      /* keep the current state */
    }
  }, []);

  // Full load: employees + who's generated + per-employee attendance summary.
  const loadAllData = useCallback(
    async (period: PayPeriodType) => {
      const requestId = ++listRequest.current;
      setLoadingSummaries(true);
      try {
        const [empRes, statusRes] = await Promise.all([
          api.get("/Employees"),
          api.get("/Payroll/status-summary", { params: { payPeriod: period } }),
        ]);

        const list: Employee[] = empRes.data
          .filter((e: Employee) => !e.isAdmin)
          .sort((a: Employee, b: Employee) =>
            a.lastName.localeCompare(b.lastName),
          );

        const entries = await Promise.all(
          list.map(async (emp) => {
            try {
              const res = await api.get(`/Payroll/calculate-params/${emp.id}`, {
                params: { payPeriod: period },
              });
              return [emp.id, normalizeParams(res.data)] as const;
            } catch {
              return [emp.id, EMPTY_PARAMS] as const;
            }
          }),
        );

        if (requestId !== listRequest.current) return;
        setEmployees(list);
        setGeneratedIds(new Set<number>(statusRes.data || []));
        setSummaries(Object.fromEntries(entries));
      } catch {
        if (requestId === listRequest.current)
          showToast("Failed to load employees list.", "error");
      } finally {
        if (requestId === listRequest.current) setLoadingSummaries(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    let isMounted = true;

    const initLoad = async () => {
      await loadAllData(payPeriodType);
    };

    if (isMounted) {
      initLoad();
    }

    return () => {
      isMounted = false;
    };
  }, [payPeriodType, loadAllData]);

  const fetchEmployeeDetails = useCallback(
    async (empId: number, period: PayPeriodType) => {
      const requestId = ++detailRequest.current;
      setLoadingParams(true);
      try {
        const [paramsRes, historyRes] = await Promise.all([
          api.get(`/Payroll/calculate-params/${empId}`, {
            params: { payPeriod: period },
          }),
          api
            .get(`/Payroll/history/${empId}`)
            .catch(() => ({ data: { items: [] } })),
        ]);
        if (requestId !== detailRequest.current) return;
        const fresh = normalizeParams(paramsRes.data);
        setParams(fresh);
        setSyncedParams(fresh);
        setHistoryRecords(historyRes.data?.items || []);
      } catch {
        if (requestId === detailRequest.current)
          showToast("Failed to fetch initial payroll data.", "error");
      } finally {
        if (requestId === detailRequest.current) setLoadingParams(false);
      }
    },
    [showToast],
  );

  /* ------------------------------ Navigation ------------------------------ */

  const openEmployee = (id: number) => {
    const cached = summaries[id] ?? EMPTY_PARAMS;
    setSelectedEmployee(id);
    setPayrollData(null);
    setOverridden({});
    setHistoryRecords([]);
    setParams(cached);
    setSyncedParams(cached);
    fetchEmployeeDetails(id, payPeriodType);
  };

  const backToList = () => {
    setSelectedEmployee(null);
    refreshGenerated(payPeriodType);
  };

  const handlePayPeriodChange = (type: PayPeriodType) => {
    if (type === payPeriodType) return;
    setPayPeriodType(type);
    setPayrollData(null);
  };

  /* ------------------------------ Derived data ------------------------------ */

  const currentEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployee),
    [employees, selectedEmployee],
  );

  const existingRecord = useMemo(
    () => findCurrentRecord(historyRecords, payPeriodType),
    [historyRecords, payPeriodType],
  );

  const isLocked =
    Boolean(existingRecord) ||
    (selectedEmployee !== null && generatedIds.has(selectedEmployee));

  const nextPendingId = useMemo(() => {
    if (selectedEmployee === null) return null;
    const idx = employees.findIndex((e) => e.id === selectedEmployee);
    const ordered = [
      ...employees.slice(idx + 1),
      ...employees.slice(0, Math.max(idx, 0)),
    ];
    return ordered.find((e) => !generatedIds.has(e.id))?.id ?? null;
  }, [employees, generatedIds, selectedEmployee]);

  const estimate = useMemo(
    () =>
      currentEmployee
        ? estimatePayroll(currentEmployee, params, payPeriodType)
        : null,
    [currentEmployee, params, payPeriodType],
  );

  const allKeys = [...EARNING_ITEMS, ...DEDUCTION_ITEMS].map((i) => i.key);
  const modifiedCount = allKeys.filter(
    (k) => overridden[k] && params[k] !== syncedParams[k],
  ).length;

  /* ------------------------------ Field handlers ------------------------------ */

  const handleChange = (key: PayrollParamKey, value: number) =>
    setParams((prev) => ({ ...prev, [key]: Math.max(0, value) }));

  const handleOverride = (key: PayrollParamKey) =>
    setOverridden((prev) => ({ ...prev, [key]: true }));

  const handleReset = (key: PayrollParamKey) => {
    setParams((prev) => ({ ...prev, [key]: syncedParams[key] }));
    setOverridden((prev) => ({ ...prev, [key]: false }));
  };

  const handleResetAll = (keys: PayrollParamKey[]) => {
    setParams((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = syncedParams[k]));
      return next;
    });
    setOverridden((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = false));
      return next;
    });
  };

  const refreshSyncedValues = async () => {
    if (!selectedEmployee) return;
    setLoadingParams(true);
    try {
      const res = await api.get(
        `/Payroll/calculate-params/${selectedEmployee}`,
        {
          params: { payPeriod: payPeriodType },
        },
      );
      const fresh = normalizeParams(res.data);
      setSyncedParams(fresh);
      setParams((prev) => {
        const next = { ...fresh };
        (Object.keys(next) as PayrollParamKey[]).forEach((k) => {
          if (overridden[k]) next[k] = prev[k];
        });
        return next;
      });
      showToast(
        modifiedCount > 0
          ? `System values refreshed. ${modifiedCount} manual edit${modifiedCount > 1 ? "s" : ""} kept.`
          : "System values refreshed.",
      );
    } catch {
      showToast("Failed to refresh system values.", "error");
    } finally {
      setLoadingParams(false);
    }
  };

  /* ------------------------------ Payslip actions ------------------------------ */

  const viewPaySlip = async (empId: number) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    try {
      const res = await api.get(`/Payroll/history/${empId}`);
      const record = findCurrentRecord<PaySlipHistoryItem>(
        res.data?.items || [],
        payPeriodType,
      );
      if (!record) {
        showToast("Payslip record not found in database.", "error");
        return;
      }
      setPayrollData(
        buildPaySlip(record, {
          payPeriod: record.payPeriod || payPeriodType,
          payPeriodEnd: record.payPeriodEnd || new Date().toISOString(),
          employeeName: `${emp.lastName}, ${emp.firstName}`,
          dailyAllowance: emp.dailyAllowance || 0,
        }),
      );
    } catch {
      showToast("Failed to load payslip record.", "error");
    }
  };

  const executeCompute = async () => {
    setShowConfirmModal(false);
    if (!selectedEmployee || isLocked) {
      showToast("Payroll already exists for this period.", "error");
      return;
    }
    setIsComputing(true);
    try {
      const res = await api.get(`/Payroll/compute/${selectedEmployee}`, {
        params: { ...params, payPeriod: payPeriodType },
      });
      const data: PayrollResult = res.data;

      setPayrollData(
        buildPaySlip(data, {
          payPeriod:
            payPeriodType === "15th"
              ? "15th Pay Period"
              : "End of Month Pay Period",
          payPeriodEnd: new Date().toISOString(),
          employeeName: data.employeeName,
          dailyAllowance: currentEmployee?.dailyAllowance || 0,
        }),
      );
      setGeneratedIds((prev) => new Set(prev).add(selectedEmployee));
      showToast("Payslip generated.");

      const historyRes = await api
        .get(`/Payroll/history/${selectedEmployee}`)
        .catch(() => ({ data: { items: [] } }));
      setHistoryRecords(historyRes.data?.items || []);
      refreshGenerated(payPeriodType);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: string } })?.response?.data ||
        "Failed to compute payroll.";
      showToast(
        typeof msg === "string" ? msg : "Failed to compute payroll.",
        "error",
      );
    } finally {
      setIsComputing(false);
    }
  };

  const confirmMessage = currentEmployee
    ? `Generate the ${PERIOD_LABEL[payPeriodType]} payslip (${formatPeriodRange(payPeriodType)}) for ${currentEmployee.lastName}, ${currentEmployee.firstName}? Estimated net pay: ${peso(estimate?.net ?? 0)}.` +
      (modifiedCount > 0
        ? ` ${modifiedCount} value${modifiedCount > 1 ? "s were" : " was"} edited manually.`
        : "") +
      " Once generated, it can only be changed by deleting it from History."
    : "Generate payroll for this employee?";

  /* ---------------------------------- UI ---------------------------------- */

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              selectedEmployee !== null ? backToList() : navigate("/dashboard")
            }
            aria-label={
              selectedEmployee !== null
                ? "Back to employee list"
                : "Back to dashboard"
            }
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
            <Calculator size={18} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Payroll Generator
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedEmployee === null
                ? "Review each employee's attendance, then generate their payslip."
                : `Payroll for ${currentEmployee ? `${currentEmployee.lastName},${currentEmployee.firstName}` : "employee"}`}
            </p>
          </div>
        </div>

        {selectedEmployee === null ? (
          <EmployeeListGrid
            employees={employees}
            summaries={summaries}
            generatedIds={generatedIds}
            loading={loadingSummaries}
            payPeriodType={payPeriodType}
            onPayPeriodChange={handlePayPeriodChange}
            onSelectEmployee={openEmployee}
            onViewPayslip={viewPaySlip}
          />
        ) : (
          <div className="space-y-5">
            {/* Employee + period bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shrink-0">
                  {currentEmployee?.firstName?.[0]}
                  {currentEmployee?.lastName?.[0]}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">
                    {currentEmployee?.lastName}, {currentEmployee?.firstName}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-amber-700" />
                    {PERIOD_LABEL[payPeriodType]} ·{" "}
                    {formatPeriodRange(payPeriodType)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={backToList}
                  className="flex-1 sm:flex-none text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3 py-2 rounded-lg cursor-pointer"
                >
                  Back to list
                </button>
                {nextPendingId !== null && (
                  <button
                    onClick={() => openEmployee(nextPendingId)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-lg cursor-pointer"
                  >
                    Next pending <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>

            {isLocked && (
              <div
                role="status"
                className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={20}
                    className="text-amber-800 shrink-0 mt-0.5"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Payslip already generated for this period
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {existingRecord
                        ? `Net pay ${peso(existingRecord.netReceivable)}. `
                        : ""}
                      Values below are locked. To recompute, delete the record
                      in History.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() =>
                      currentEmployee && viewPaySlip(currentEmployee.id)
                    }
                    className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <Eye size={14} /> View payslip
                  </button>
                  <button
                    onClick={() => navigate("/history")}
                    className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Open History
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
              {/* Parameters */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-slate-800">
                    Computation inputs
                  </h2>
                  <button
                    onClick={refreshSyncedValues}
                    disabled={loadingParams || isComputing || isLocked}
                    className="text-xs text-slate-600 hover:text-amber-800 font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw
                      size={13}
                      className={
                        loadingParams ? "animate-spin text-amber-600" : ""
                      }
                    />
                    Refresh from attendance
                  </button>
                </div>

                <ParameterSection
                  title="Earnings"
                  description="Time worked and paid, from attendance records."
                  type="earnings"
                  items={EARNING_ITEMS}
                  params={params}
                  synced={syncedParams}
                  overridden={overridden}
                  loading={loadingParams}
                  disabled={isLocked || isComputing}
                  onChange={handleChange}
                  onOverride={handleOverride}
                  onReset={handleReset}
                  onResetAll={handleResetAll}
                />
                <ParameterSection
                  title="Deductions"
                  description="Time lost and amounts withheld."
                  type="deductions"
                  items={DEDUCTION_ITEMS}
                  params={params}
                  synced={syncedParams}
                  overridden={overridden}
                  loading={loadingParams}
                  disabled={isLocked || isComputing}
                  onChange={handleChange}
                  onOverride={handleOverride}
                  onReset={handleReset}
                  onResetAll={handleResetAll}
                />
              </div>

              {/* Live summary */}
              <aside
                aria-label="Estimated payslip"
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden lg:sticky lg:top-6"
              >
                <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    Estimated payslip
                  </h3>
                  {loadingParams && (
                    <Loader2
                      size={14}
                      className="animate-spin text-amber-600"
                    />
                  )}
                </div>

                {estimate && (
                  <div className="p-4 space-y-3">
                    <dl className="divide-y divide-slate-100">
                      <Line label="Basic pay" value={estimate.basicPay} />
                      <Line label="Overtime" value={estimate.overtimePay} />
                      <Line
                        label="Regular holiday"
                        value={estimate.regularHolidayPay}
                      />
                      <Line
                        label="Special holiday"
                        value={estimate.specialHolidayPay}
                      />
                      <Line label="Leave pay" value={estimate.leavePay} />
                    </dl>
                    <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2">
                      <span className="text-slate-700">Gross earnings</span>
                      <span className="font-mono text-slate-900">
                        {peso(estimate.gross)}
                      </span>
                    </div>

                    <dl className="divide-y divide-slate-100">
                      <Line
                        label="Late"
                        value={estimate.lateDeduction}
                        negative
                      />
                      <Line
                        label="Undertime"
                        value={estimate.undertimeDeduction}
                        negative
                      />
                      <Line
                        label="Absent"
                        value={estimate.absentDeduction}
                        negative
                      />
                      <Line
                        label="Cash advance"
                        value={estimate.cashAdvance}
                        negative
                      />
                      {/* Government Contributions Detailed Breakdown */}
                      <div className="py-1">
                        <div className="flex justify-between text-xs py-0.5 text-slate-600 font-medium">
                          <span>Gov't contributions</span>
                          <span className="font-mono text-rose-600">
                            −{peso(estimate.govt)}
                          </span>
                        </div>
                        <div className="pl-3 space-y-0.5 border-l border-slate-100 my-1">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>• SSS</span>
                            <span className="font-mono">
                              −{peso(estimate.sss)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>• PhilHealth</span>
                            <span className="font-mono">
                              −{peso(estimate.philHealth)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>• Pag-IBIG</span>
                            <span className="font-mono">
                              −{peso(estimate.pagIbig)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </dl>
                    <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2">
                      <span className="text-slate-700">Total deductions</span>
                      <span className="font-mono text-rose-600">
                        −{peso(estimate.deductions)}
                      </span>
                    </div>

                    <div className="rounded-lg bg-amber-50/60 border border-amber-100 px-3 py-3">
                      <p className="text-xs font-semibold text-slate-600">
                        Estimated net pay
                      </p>
                      <p className="font-mono text-2xl font-black text-slate-950">
                        {peso(estimate.net)}
                      </p>
                    </div>

                    {!isLocked && (
                      <ul className="space-y-1.5 text-xs">
                        {params.daysWorked === 0 && (
                          <li className="flex gap-1.5 text-rose-700 font-medium">
                            <AlertCircle
                              size={13}
                              className="shrink-0 mt-0.5"
                            />
                            No days worked recorded for this period.
                          </li>
                        )}
                        {estimate.isNegative && (
                          <li className="flex gap-1.5 text-rose-700 font-medium">
                            <AlertCircle
                              size={13}
                              className="shrink-0 mt-0.5"
                            />
                            Deductions exceed earnings. Check cash advance and
                            absences.
                          </li>
                        )}
                        {modifiedCount > 0 && (
                          <li className="flex gap-1.5 text-amber-800 font-medium">
                            <AlertCircle
                              size={13}
                              className="shrink-0 mt-0.5"
                            />
                            {modifiedCount} value{modifiedCount > 1 ? "s" : ""}{" "}
                            edited manually.
                          </li>
                        )}
                      </ul>
                    )}

                    {isLocked ? (
                      <button
                        onClick={() =>
                          currentEmployee && viewPaySlip(currentEmployee.id)
                        }
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white px-4 py-3 rounded-lg text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2"
                      >
                        <Eye size={15} /> View payslip
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={isComputing || loadingParams}
                        className="w-full bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-4 py-3 rounded-lg text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isComputing ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />{" "}
                            Generating…
                          </>
                        ) : (
                          <>
                            <Calculator size={15} /> Generate payslip
                          </>
                        )}
                      </button>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Estimate only. Final amounts, including government
                      contributions, are calculated by the server when you
                      generate.
                    </p>
                  </div>
                )}
              </aside>
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
        title="Generate payslip"
        message={confirmMessage}
        confirmText="Generate"
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
