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
    <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />
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

          // Ensure Saturday is represented in the attendance trend list
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
    <div className="space-y-6 mb-8">
      {/* Header Banner */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--primary) text-slate-950 font-bold">
              <ShieldAlert size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-950">
                Administrative Management Portal
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                Monitor overall employee counts, attendance compliance, pending
                approvals, and payroll metrics in real-time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw size={14} />
            Refresh Stats
          </button>
        </div>
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          onClick={() => navigate("/timesheet")}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 hover:border-amber-400 transition cursor-pointer"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
            <Users size={18} />
          </div>
          <p className="text-lg font-bold text-slate-950 sm:text-xl">
            {stats.totalEmployees}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Active Employees</p>
        </div>

        <div
          onClick={() => navigate("/timesheet")}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 hover:border-amber-400 transition cursor-pointer"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
            <CheckSquare size={18} />
          </div>
          <p className="text-lg font-bold text-slate-950 sm:text-xl">
            {stats.pendingAttendanceRequests}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Pending Attendance Req.
          </p>
        </div>

        <div
          onClick={() => navigate("/leaves")}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 hover:border-amber-400 transition cursor-pointer"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
            <CalendarDays size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-bold text-slate-950 sm:text-xl">
              {stats.pendingLeaves}
            </p>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Pending Review
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Total Leave Requests ({totalLeavesCount} tracked)
          </p>
        </div>

        <div
          onClick={() => navigate("/payroll")}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 hover:border-amber-400 transition cursor-pointer"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Wallet size={18} />
          </div>
          <p className="text-lg font-bold text-slate-950 sm:text-xl">
            {formatCurrency(stats.totalPayrollThisMonth)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Est. Monthly Payroll</p>
        </div>
      </div>

      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dynamic Payroll Trend */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-amber-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Payroll Disbursement Trend
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison across recent pay periods and cutoffs from records.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/payroll")}
              className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Open Generator <ArrowRight size={14} />
            </button>
          </div>

          {isLoadingCharts ? (
            <SkeletonBlock className="h-44 rounded-lg" />
          ) : (
            <div className="space-y-3 pt-2">
              {payrollTrends.map((trend, idx) => {
                const absAmount = Math.abs(trend.amount); // Force positive amount value
                const maxVal = Math.max(
                  ...payrollTrends.map((t) => Math.abs(t.amount)),
                  1,
                );
                const pct = Math.round((absAmount / maxVal) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{trend.period}</span>
                      <span className="font-mono">
                        {formatCurrency(absAmount)}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-(--primary) rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly Attendance Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock3 size={18} className="text-amber-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Weekly Attendance Rate
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Percentage of on-time clock-ins per day.
            </p>

            {isLoadingCharts ? (
              <SkeletonBlock className="h-48 rounded-lg" />
            ) : (
              <div className="space-y-2 pt-1">
                {attendanceTrends.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{item.day}</span>
                      <span className="font-mono text-emerald-600 font-bold">
                        {item.attendanceRate}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${item.attendanceRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-right">
            Avg Rate: {avgAttendance}%
          </div>
        </div>
      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Leave Distribution & Analytics */}
        <div
          onClick={() => navigate("/leaves")}
          className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:border-amber-400 transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <PieChart size={18} className="text-amber-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Leave Distribution & Count
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Breakdown of total leave statuses and requests across staff.
            </p>

            {isLoadingCharts ? (
              <SkeletonBlock className="h-32 rounded-lg" />
            ) : (
              <div className="space-y-3">
                <div className="flex h-3.5 w-full rounded-full overflow-hidden bg-slate-100 gap-0.5 shadow-inner">
                  {leaveBreakdown.map((leave, idx) => {
                    const widthPct = Math.round(
                      (leave.count / totalLeavesCount) * 100,
                    );
                    return (
                      <div
                        key={idx}
                        className={`h-full ${leave.color}`}
                        style={{ width: `${widthPct}%` }}
                        title={`${leave.type}: ${leave.count}`}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {leaveBreakdown.map((leave, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${leave.color}`}
                        />
                        <span className="text-[11px] font-semibold text-slate-700 truncate">
                          {leave.type}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 font-mono pl-4">
                        {leave.count}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          requests
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-amber-800 font-semibold flex items-center justify-between">
            <span>Manage approvals & records</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Quick Operations Box */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Quick Operations
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Jump directly to core administrative tasks.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => navigate("/payroll")}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 text-xs font-semibold text-slate-800 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Calculator size={15} className="text-amber-700" /> Make
                  Payroll
                </span>
                <ChevronRight size={15} className="text-slate-400" />
              </button>
              <button
                onClick={() => navigate("/timesheet")}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 text-xs font-semibold text-slate-800 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Clock3 size={15} className="text-amber-700" /> Review
                  Timesheets
                </span>
                <ChevronRight size={15} className="text-slate-400" />
              </button>
              <button
                onClick={() => navigate("/leaves")}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 text-xs font-semibold text-slate-800 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-amber-700" /> Manage
                  Leaves
                </span>
                <ChevronRight size={15} className="text-slate-400" />
              </button>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center">
            <span>Next payroll cutoff cycle</span>
            <span className="font-semibold text-slate-700">
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
