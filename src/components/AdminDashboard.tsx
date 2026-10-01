import { useState, useEffect } from "react";
import api from "../services/api";
import {
  ShieldAlert,
  RefreshCw,
  Users,
  CheckSquare,
  CalendarDays,
  Wallet,
  Calculator,
  Clock3,
  ChevronRight,
  ArrowRight,
  BarChart3,
  PieChart,
} from "lucide-react";

interface AdminDashboardStats {
  totalEmployees: number;
  pendingAttendanceRequests: number;
  pendingLeaves: number;
  totalPayrollThisMonth: number;
}

interface PayrollTrendItem {
  period: string;
  amount: number;
}

interface AttendanceTrendItem {
  day: string;
  attendanceRate: number;
}

interface LeaveBreakdownItem {
  type: string;
  count: number;
  color: string;
}

interface LeaveItem {
  id: number;
  leaveType: string;
  status: string;
}

interface AdminDashboardProps {
  stats: AdminDashboardStats;
  trends: PayrollTrendItem[];
  isLoading: boolean;
  cutoffDate: Date;
  onRefresh: () => void;
  navigate: (path: string) => void;
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
  );
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(val);

export default function AdminDashboard({
  stats,
  cutoffDate,
  onRefresh,
  navigate,
}: AdminDashboardProps) {
  const [payrollTrends, setPayrollTrends] = useState<PayrollTrendItem[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<
    AttendanceTrendItem[]
  >([]);
  const [leaveBreakdown, setLeaveBreakdown] = useState<LeaveBreakdownItem[]>(
    [],
  );
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      try {
        const [payrollRes, attendanceRes, leaveRes] = await Promise.all([
          api.get("/Dashboard/payroll-trends").catch(() => ({ data: [] })),
          api.get("/Dashboard/attendance-trends").catch(() => ({ data: [] })),
          api.get("/Leaves").catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          setPayrollTrends(payrollRes.data);

          const rawAttendance: AttendanceTrendItem[] = attendanceRes.data || [];
          const defaultDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

          const completeAttendance = defaultDays.map((day) => {
            const found = rawAttendance.find(
              (item) =>
                item.day.toLowerCase().slice(0, 3) === day.toLowerCase(),
            );
            return found || { day, attendanceRate: 0 };
          });

          setAttendanceTrends(completeAttendance);

          const rawLeaves: LeaveItem[] = leaveRes.data || [];

          const counts: Record<string, number> = {
            Vacation: 0,
            "Sick Leave": 0,
            Emergency: 0,
          };

          rawLeaves.forEach((l) => {
            const t = l.leaveType || "Vacation";
            if (counts[t] !== undefined) {
              counts[t] += 1;
            } else {
              counts[t] = 1;
            }
          });

          setLeaveBreakdown([
            {
              type: "Vacation",
              count: counts["Vacation"] || 0,
              color: "bg-sky-500",
            },
            {
              type: "Sick Leave",
              count: counts["Sick Leave"] || 0,
              color: "bg-amber-500",
            },
            {
              type: "Emergency",
              count: counts["Emergency"] || 0,
              color: "bg-rose-500",
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        if (isMounted) setIsLoadingCharts(false);
      }
    };

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalLeavesCount =
    leaveBreakdown.reduce((acc, item) => acc + item.count, 0) || 1;

  const avgAttendance =
    attendanceTrends.length > 0
      ? Math.round(
          attendanceTrends.reduce((acc, item) => acc + item.attendanceRate, 0) /
            attendanceTrends.length,
        )
      : 0;

  return (
    <div className="space-y-5 mb-8">
      {/* Header Banner */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--primary) text-slate-950 font-bold shadow-xs">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Administrative Management Portal
              </h2>
              <p className="text-xs text-slate-500">
                Monitor overall employee counts, attendance compliance, pending
                approvals, and payroll metrics in real-time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw size={13} />
            Refresh stats
          </button>
        </div>
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          onClick={() => navigate("/timesheet")}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-400 transition cursor-pointer"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
            <Users size={16} />
          </div>
          <p className="text-base font-bold text-slate-900 sm:text-lg font-mono">
            {stats.totalEmployees}
          </p>
          <p className="text-xs font-medium text-slate-500">Active employees</p>
        </div>

        <div
          onClick={() => navigate("/timesheet")}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-400 transition cursor-pointer"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
            <CheckSquare size={16} />
          </div>
          <p className="text-base font-bold text-slate-900 sm:text-lg font-mono">
            {stats.pendingAttendanceRequests}
          </p>
          <p className="text-xs font-medium text-slate-500">
            Pending attendance requests
          </p>
        </div>

        <div
          onClick={() => navigate("/leaves")}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-400 transition cursor-pointer"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
            <CalendarDays size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-base font-bold text-slate-900 sm:text-lg font-mono">
              {stats.pendingLeaves}
            </p>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200">
              Pending
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Leave requests ({totalLeavesCount} tracked)
          </p>
        </div>

        <div
          onClick={() => navigate("/payroll")}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-400 transition cursor-pointer"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Wallet size={16} />
          </div>
          <p className="text-base font-bold text-slate-900 sm:text-lg font-mono">
            {formatCurrency(stats.totalPayrollThisMonth)}
          </p>
          <p className="text-xs font-medium text-slate-500">
            Est. monthly payroll
          </p>
        </div>
      </div>

      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dynamic Payroll Trend */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                  <BarChart3 size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Payroll Disbursement Trend
                  </h3>
                </div>
              </div>
              <button
                onClick={() => navigate("/payroll")}
                className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Open generator <ArrowRight size={13} />
              </button>
            </div>

            {isLoadingCharts ? (
              <SkeletonBlock className="h-28" />
            ) : (
              <div className="space-y-2.5 pt-1">
                {payrollTrends.map((trend, idx) => {
                  const absAmount = Math.abs(trend.amount);
                  const maxVal = Math.max(
                    ...payrollTrends.map((t) => Math.abs(t.amount)),
                    1,
                  );
                  const pct = Math.round((absAmount / maxVal) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{trend.period}</span>
                        <span className="font-mono text-slate-900 font-bold">
                          {formatCurrency(absAmount)}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-(--primary) rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-medium text-slate-400">
            Updated live from current financial ledger
          </div>
        </div>

        {/* Weekly Attendance Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                <Clock3 size={15} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Weekly Attendance Rate
              </h3>
            </div>

            {isLoadingCharts ? (
              <SkeletonBlock className="h-32" />
            ) : (
              <div className="space-y-2 pt-0.5">
                {attendanceTrends.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>{item.day}</span>
                      <span className="font-mono text-emerald-600 font-bold">
                        {item.attendanceRate}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${item.attendanceRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600 flex justify-between items-center">
            <span className="text-slate-400 font-normal">Average</span>
            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-md border border-emerald-200">
              {avgAttendance}% compliance
            </span>
          </div>
        </div>
      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leave Distribution & Analytics */}
        <div
          onClick={() => navigate("/leaves")}
          className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-amber-400 transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                <PieChart size={15} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Leave Distribution
              </h3>
            </div>

            {isLoadingCharts ? (
              <SkeletonBlock className="h-24" />
            ) : (
              <div className="space-y-3">
                <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 gap-0.5 p-0.5">
                  {leaveBreakdown.map((leave, idx) => {
                    const widthPct = Math.round(
                      (leave.count / totalLeavesCount) * 100,
                    );
                    return (
                      <div
                        key={idx}
                        className={`h-full rounded-xs ${leave.color} transition-all duration-300`}
                        style={{ width: `${widthPct}%` }}
                        title={`${leave.type}: ${leave.count}`}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {leaveBreakdown.map((leave, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5"
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${leave.color}`}
                        />
                        <span className="text-[9px] font-bold text-slate-500 truncate uppercase">
                          {leave.type}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 font-mono pl-3">
                        {leave.count}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-semibold text-amber-800 flex items-center justify-between">
            <span>Manage approvals</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Quick Operations Box */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Administrative Quick Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => navigate("/payroll")}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 text-xs font-semibold text-slate-800 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Calculator size={15} className="text-amber-800" /> Run
                  payroll
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              <button
                onClick={() => navigate("/timesheet")}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 text-xs font-semibold text-slate-800 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Clock3 size={15} className="text-amber-800" /> Timesheets
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              <button
                onClick={() => navigate("/leaves")}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 text-xs font-semibold text-slate-800 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-amber-800" /> Leaves
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center font-medium">
            <span>Next active payroll cutoff cycle</span>
            <span className="font-bold text-slate-900 font-mono">
              {cutoffDate.toLocaleDateString("en-PH", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
