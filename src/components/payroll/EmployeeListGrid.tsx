import {
  Calculator,
  ChevronRight,
  Briefcase,
  Clock,
  Loader2,
  CalendarDays,
} from "lucide-react";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  dailySalary: number;
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
}

export default function EmployeeListGrid({
  employees,
  employeeSummaries,
  loadingSummaries,
  payPeriodType,
  onPayPeriodChange,
  onSelectEmployee,
}: EmployeeListGridProps) {
  return (
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
              onPayPeriodChange(e.target.value as "15th" | "30th")
            }
            className="w-full sm:w-72 h-10 border border-slate-300 bg-white px-3 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
          >
            <option value="15th">15th Pay Period (29th/30th - 13th)</option>
            <option value="30th">End of Month Pay Period (14th - 28th)</option>
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
            return (
              <div
                key={emp.id}
                onClick={() => onSelectEmployee(emp.id)}
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

                <button className="w-full bg-slate-900 group-hover:bg-(--primary) group-hover:text-slate-950 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
                  <Calculator size={14} /> Make Payroll
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
