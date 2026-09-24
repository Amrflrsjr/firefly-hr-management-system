import {
  Calculator,
  ChevronRight,
  Briefcase,
  Clock,
  Loader2,
  CalendarDays,
  CreditCard,
  Eye,
} from "lucide-react";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  dailySalary: number;
  dailyAllowance: number;
}

interface EmployeeSummaryParams {
  daysWorked: number;
  overtimeHours: number;
}

interface EmployeeListGridProps {
  employees: Employee[];
  employeeSummaries: Record<number, EmployeeSummaryParams>;
  loadingSummaries: boolean;
  payPeriodType: "15th" | "30th";
  onPayPeriodChange: (type: "15th" | "30th") => void;
  onSelectEmployee: (id: number) => void;
  hasExistingRecord: (empId: number) => boolean;
  onViewPayslip: (empId: number) => void;
}

export default function EmployeeListGrid({
  employees,
  employeeSummaries,
  loadingSummaries,
  payPeriodType,
  onPayPeriodChange,
  onSelectEmployee,
  hasExistingRecord,
  onViewPayslip,
}: EmployeeListGridProps) {
  return (
    <div className="space-y-4">
      {/* Cutoff Selector Toggle Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-amber-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Pay Period Cutoff Overview
          </span>
        </div>

        {/* Segmented Pill Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => onPayPeriodChange("15th")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              payPeriodType === "15th"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            15th Pay Period (29th - 13th)
          </button>
          <button
            onClick={() => onPayPeriodChange("30th")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              payPeriodType === "30th"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            End of Month (14th - 28th)
          </button>
        </div>
      </div>

      {/* Employees Summary Grid Cards */}
      {employees.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs shadow-sm">
          No employees available.
        </div>
      ) : loadingSummaries ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 space-y-2 shadow-sm">
          <Loader2 size={24} className="animate-spin text-amber-600 mx-auto" />
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
            const alreadyGenerated = hasExistingRecord(emp.id);

            return (
              <div
                key={emp.id}
                onClick={() => {
                  if (alreadyGenerated) {
                    onViewPayslip(emp.id);
                  } else {
                    onSelectEmployee(emp.id);
                  }
                }}
                className={`bg-white border rounded-xl p-5 transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-xs ${
                  alreadyGenerated
                    ? "border-emerald-300 bg-emerald-50/20 hover:border-emerald-400 shadow-xs"
                    : "border-slate-200 hover:border-amber-400 hover:shadow-md"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-slate-950 transition-colors">
                        {emp.lastName}, {emp.firstName}
                      </h3>
                      {alreadyGenerated && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          Generated
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Briefcase size={12} className="text-slate-400" /> Daily
                        Rate:{" "}
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
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      alreadyGenerated
                        ? "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200"
                        : "bg-amber-50 text-amber-800 group-hover:bg-amber-100"
                    }`}
                  >
                    <ChevronRight size={16} />
                  </div>
                </div>

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
                      <Clock size={12} className="text-amber-600 shrink-0" />
                      {summary.overtimeHours} hrs
                    </span>
                  </div>
                </div>

                {alreadyGenerated ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewPayslip(emp.id);
                    }}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Eye size={14} /> View Payslip
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEmployee(emp.id);
                    }}
                    className="w-full bg-slate-900 group-hover:bg-(--primary) group-hover:text-slate-950 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Calculator size={14} /> Make Payroll
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
