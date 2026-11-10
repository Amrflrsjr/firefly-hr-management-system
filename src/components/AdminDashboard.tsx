import { useState, useEffect, useMemo, useRef } from "react";
import api from "../services/api";
import {
  Users,
  Wallet,
  Briefcase,
  Search,
  MoreHorizontal,
  ChevronRight,
  Clock3,
  CalendarDays,
  BarChart3,
  LogIn,
  LogOut,
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

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeIdNumber?: string;
  jobTitle?: string;
  isAdmin?: boolean;
}

interface TimeRecord {
  id: number;
  employeeId: number;
  type: string;
  dateCreated: string;
}

interface AdminDashboardProps {
  stats: AdminDashboardStats;
  trends: PayrollTrendItem[];
  isLoading: boolean;
  cutoffDate: Date;
  onRefresh: () => void;
  navigate: (path: string) => void;
  employees: Employee[];
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

const formatTime = (dateString?: string) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });
};

export default function AdminDashboard({
  stats,
  trends,
  isLoading,
  cutoffDate,
  navigate,
  employees,
}: AdminDashboardProps) {
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [payrollTrends, setPayrollTrends] = useState<PayrollTrendItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // State for today's time records
  const [todayRecords, setTodayRecords] = useState<TimeRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  // Use refs to capture the initial values of props
  const initialTrends = useRef(trends);
  const initialPayroll = useRef(stats.totalPayrollThisMonth);

  // Fetch chart data and today's time records
  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        // Use the ref values here so the effect can have an empty dependency array
        const res = await api.get("/Dashboard/payroll-trends").catch(() => ({
          data: initialTrends.current.length > 0 ? initialTrends.current : [],
        }));
        if (isMounted) {
          const data =
            res.data && res.data.length > 0
              ? res.data
              : [
                  {
                    period: "Prev Cutoff",
                    amount: initialPayroll.current * 0.4,
                  },
                  {
                    period: "15th Cutoff",
                    amount: initialPayroll.current * 0.6,
                  },
                  {
                    period: "Current Est.",
                    amount: initialPayroll.current,
                  },
                ];
          setPayrollTrends(data);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        if (isMounted) setIsLoadingCharts(false);
      }
    };

    const fetchTodayRecords = async () => {
      try {
        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];

        const res = await api.get(
          `/TimeRecords?startDate=${dateStr}&endDate=${dateStr}&pageSize=1000`,
        );
        if (isMounted) {
          setTodayRecords(res.data.items || []);
        }
      } catch (err) {
        console.error("Failed to load today's records", err);
      } finally {
        if (isMounted) setIsLoadingRecords(false);
      }
    };

    fetchAnalytics();
    fetchTodayRecords();

    return () => {
      isMounted = false;
    };
  }, []); // <-- Empty dependency array

  const maxTrend = Math.max(...payrollTrends.map((t) => t.amount), 1);
  const daysLeft = Math.ceil(
    (cutoffDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24),
  );

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;

    const query = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.firstName.toLowerCase().includes(query) ||
        emp.lastName.toLowerCase().includes(query) ||
        (emp.employeeIdNumber &&
          emp.employeeIdNumber.toLowerCase().includes(query)),
    );
  }, [employees, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonBlock className="h-80 lg:col-span-2" />
          <SkeletonBlock className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 mb-8">
      {/* 1. TOP METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div
          onClick={() => navigate("/employees")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-(--primary) transition cursor-pointer"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <Users size={16} className="text-amber-800" />
            <span className="text-sm font-medium">Total Employees</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-900">
              {stats.totalEmployees}
            </h3>
          </div>
        </div>

        {/* Total Payroll */}
        <div
          onClick={() => navigate("/payroll")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-(--primary) transition cursor-pointer"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <Wallet size={16} className="text-amber-800" />
            <span className="text-sm font-medium">Total Payroll</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900">
              {formatCurrency(stats.totalPayrollThisMonth)}
            </h3>
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => navigate("/timesheet")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-(--primary) transition cursor-pointer"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <Clock3 size={16} className="text-amber-800" />
            <span className="text-sm font-medium">Pending Approvals</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-900">
              {stats.pendingAttendanceRequests + stats.pendingLeaves}
            </h3>
          </div>
        </div>

        {/* Next Cutoff */}
        <div
          onClick={() => navigate("/payroll")}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-(--primary) transition cursor-pointer"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <Briefcase size={16} className="text-amber-800" />
            <span className="text-sm font-medium">Next Cutoff</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900">
              {cutoffDate.toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
              })}
            </h3>
            <span className="text-xs font-medium text-slate-500">
              {daysLeft} days left
            </span>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: CHART & SCHEDULE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                <BarChart3 size={16} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Payroll Trend
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              Current Cutoff
            </span>
          </div>
          {isLoadingCharts ? (
            <SkeletonBlock className="h-48" />
          ) : (
            <div className="flex-1 flex items-end gap-4 sm:gap-6 h-48 mt-2 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-full border-t border-slate-100 border-dashed"
                  />
                ))}
              </div>
              {payrollTrends.map((t, i) => {
                const height = `${Math.max((t.amount / maxTrend) * 100, 5)}%`;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full relative z-10 group"
                  >
                    <div
                      className="w-full max-w-15 bg-(--primary)/80 rounded-t-md transition-all duration-300 group-hover:bg-(--primary) relative"
                      style={{ height }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap transition-opacity pointer-events-none z-20">
                        {formatCurrency(t.amount)}
                      </div>
                    </div>
                    <span className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {t.period}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Recent Activity
              </h3>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => navigate("/timesheet")}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
                  <Clock3 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    Attendance Requests
                  </p>
                  <p className="text-xs text-slate-500">
                    {stats.pendingAttendanceRequests} pending
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
              <div
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => navigate("/leaves")}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
                  <CalendarDays size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    Leave Requests
                  </p>
                  <p className="text-xs text-slate-500">
                    {stats.pendingLeaves} pending
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/timesheet")}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            View All Approvals
          </button>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: EMPLOYEE TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Today's Attendance
            </h3>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
              {employees.length} total
            </span>
          </div>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full sm:w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs focus:border-(--primary) focus:bg-white outline-none transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Employee ID</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-center">Time In</th>
                <th className="px-5 py-3 font-semibold text-center">
                  Time Out
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    {searchQuery
                      ? "No employees match your search."
                      : "No employees found."}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const initials =
                    `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`.toUpperCase();

                  const empRecords = todayRecords.filter(
                    (r) => r.employeeId === emp.id,
                  );
                  const timeInRecord = empRecords.find((r) => r.type === "IN");
                  const timeOutRecord = empRecords
                    .slice()
                    .reverse()
                    .find((r) => r.type === "OUT");

                  const timeInStr = formatTime(timeInRecord?.dateCreated);
                  const timeOutStr = formatTime(timeOutRecord?.dateCreated);

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/50 transition"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {initials || "?"}
                          </div>
                          <span className="font-semibold text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {emp.employeeIdNumber ||
                          `EMP-${emp.id.toString().padStart(3, "0")}`}
                      </td>
                      <td className="px-5 py-3">
                        {emp.jobTitle ||
                          (emp.isAdmin ? "Administrator" : "Staff")}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>{" "}
                          Active
                        </span>
                      </td>

                      <td className="px-5 py-3 text-center">
                        {isLoadingRecords ? (
                          <span className="text-slate-300">...</span>
                        ) : timeInStr ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-mono font-medium text-emerald-700">
                            <LogIn size={12} className="opacity-70" />
                            {timeInStr}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            No Data
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3 text-center">
                        {isLoadingRecords ? (
                          <span className="text-slate-300">...</span>
                        ) : timeOutStr ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-mono font-medium text-amber-700">
                            <LogOut size={12} className="opacity-70" />
                            {timeOutStr}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            No Data
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
