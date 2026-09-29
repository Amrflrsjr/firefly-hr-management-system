import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Calculator,
  CheckCircle2,
  Eye,
  PlayCircle,
  Search,
} from "lucide-react";
import {
  EMPTY_PARAMS,
  HIGH_OVERTIME_HOURS,
  PERIOD_LABEL,
  estimatePayroll,
  formatPeriodRange,
  peso,
  type Employee,
  type PayPeriodType,
  type PayrollParams,
} from "./payrollUtils";

type Filter = "all" | "pending" | "generated";

interface EmployeeListGridProps {
  employees: Employee[];
  summaries: Record<number, PayrollParams>;
  generatedIds: Set<number>;
  loading: boolean;
  payPeriodType: PayPeriodType;
  onPayPeriodChange: (type: PayPeriodType) => void;
  onSelectEmployee: (id: number) => void;
  onViewPayslip: (id: number) => void;
}

export default function EmployeeListGrid({
  employees,
  summaries,
  generatedIds,
  loading,
  payPeriodType,
  onPayPeriodChange,
  onSelectEmployee,
  onViewPayslip,
}: EmployeeListGridProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () =>
      employees.map((emp) => {
        const params = summaries[emp.id] ?? EMPTY_PARAMS;
        return {
          emp,
          params,
          generated: generatedIds.has(emp.id),
          estimate: estimatePayroll(emp, params),
          noAttendance: params.daysWorked === 0,
          highOvertime: params.overtimeHours > HIGH_OVERTIME_HOURS,
        };
      }),
    [employees, summaries, generatedIds],
  );

  const total = rows.length;
  const generatedCount = rows.filter((r) => r.generated).length;
  const pendingCount = total - generatedCount;
  const pct = total ? Math.round((generatedCount / total) * 100) : 0;
  const totalNet = rows.reduce((sum, r) => sum + r.estimate.net, 0);
  const firstPending = rows.find((r) => !r.generated);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (
      rows
        .filter((r) => {
          if (filter === "pending" && r.generated) return false;
          if (filter === "generated" && !r.generated) return false;
          if (!q) return true;
          return `${r.emp.lastName} ${r.emp.firstName} ${r.emp.firstName} ${r.emp.lastName}`
            .toLowerCase()
            .includes(q);
        })
        // Pending first so finished work doesn't crowd the top. Sort is stable, so names stay A–Z.
        .sort((a, b) => Number(a.generated) - Number(b.generated))
    );
  }, [rows, query, filter]);

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: total },
    { id: "pending", label: "Pending", count: pendingCount },
    { id: "generated", label: "Generated", count: generatedCount },
  ];

  return (
    <div className="space-y-4">
      {/* Period + progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CalendarDays size={18} className="text-amber-700 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                {PERIOD_LABEL[payPeriodType]}
              </p>
              <p className="text-xs text-slate-500">
                {formatPeriodRange(payPeriodType)}
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Pay period"
            className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full lg:w-auto"
          >
            {(["15th", "30th"] as const).map((type) => (
              <button
                key={type}
                role="tab"
                aria-selected={payPeriodType === type}
                onClick={() => onPayPeriodChange(type)}
                className={`flex-1 lg:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-600 ${
                  payPeriodType === type
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="block">{PERIOD_LABEL[type]}</span>
                <span className="block font-medium text-[11px] text-slate-500">
                  {formatPeriodRange(type)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-baseline justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-800">
                {loading
                  ? "Loading…"
                  : `${generatedCount} of ${total} payslips generated`}
              </span>
              <span className="font-mono text-slate-500">{pct}%</span>
            </div>
            <div
              className="h-2 bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Payslips generated"
            >
              <div
                className="h-full bg-emerald-500 rounded-full transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <p className="text-xs text-slate-500">Estimated total net payout</p>
            <p className="font-mono text-base font-bold text-slate-900">
              {loading ? "—" : peso(totalNet)}
            </p>
          </div>

          {!loading &&
            total > 0 &&
            (firstPending ? (
              <button
                onClick={() => onSelectEmployee(firstPending.emp.id)}
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer shadow-xs"
              >
                <PlayCircle size={15} />
                Start next pending
              </button>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={16} />
                All payslips generated
              </span>
            ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {chips.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              aria-pressed={filter === c.id}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                filter === c.id
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {c.label} <span className="font-mono opacity-70">{c.count}</span>
            </button>
          ))}
        </div>
        <label className="relative sm:w-64">
          <span className="sr-only">Search employees</span>
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employee…"
            className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
          />
        </label>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-170 text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500">
              <th scope="col" className="px-4 py-3 font-semibold">
                Employee
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">
                Days
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">
                Overtime
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">
                Est. net pay
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} aria-hidden>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 rounded bg-slate-100 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-xs text-slate-500"
                >
                  {total === 0 ? (
                    "No employees available."
                  ) : (
                    <>
                      No employees match your filters.{" "}
                      <button
                        onClick={() => {
                          setQuery("");
                          setFilter("all");
                        }}
                        className="font-semibold text-amber-800 underline cursor-pointer"
                      >
                        Clear filters
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              visible.map(
                ({
                  emp,
                  params,
                  generated,
                  estimate,
                  noAttendance,
                  highOvertime,
                }) => {
                  const open = () =>
                    generated
                      ? onViewPayslip(emp.id)
                      : onSelectEmployee(emp.id);
                  return (
                    <tr
                      key={emp.id}
                      onClick={open}
                      className={`cursor-pointer transition-colors ${
                        generated
                          ? "bg-emerald-50/30 hover:bg-emerald-50/60"
                          : "hover:bg-amber-50/40"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {emp.lastName}, {emp.firstName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {peso(emp.dailySalary || 0)}/day
                          {emp.dailyAllowance
                            ? ` + ${peso(emp.dailyAllowance)} allowance`
                            : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-slate-800">
                        {params.daysWorked}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-slate-800">
                        {params.overtimeHours} hrs
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-900">
                        {peso(estimate.net)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {generated ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={12} /> Generated
                            </span>
                          ) : (
                            <>
                              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                Pending
                              </span>
                              {noAttendance && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                                  <AlertTriangle size={12} /> No attendance
                                </span>
                              )}
                              {highOvertime && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                                  <AlertTriangle size={12} /> High overtime
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            open();
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-600 ${
                            generated
                              ? "bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                        >
                          {generated ? (
                            <>
                              <Eye size={13} /> View payslip
                            </>
                          ) : (
                            <>
                              <Calculator size={13} /> Make payroll
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                },
              )
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        Net pay is an estimate from attendance and profile rates. Final figures
        are calculated when the payslip is generated.
      </p>
    </div>
  );
}
