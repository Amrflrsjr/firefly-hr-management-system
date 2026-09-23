import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  LogIn,
  LogOut,
  Clock3,
  CalendarDays,
  FileText,
  History,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  ChevronRight,
  RefreshCw,
  Timer,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import AdminDashboard from "../components/AdminDashboard";

interface DashboardMetrics {
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  estimatedPayout: number;
  lastTimeIn: string | null;
  lastTimeOut: string | null;
  hasClockedInToday: boolean;
  hasClockedOutToday: boolean;
  missedRecordsCount: number;
}

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

interface Holiday {
  id: number;
  description: string;
  holidayDate: string;
  holidayType: string;
}

type LogType = "IN" | "OUT";

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-mono font-bold text-slate-900">
      {time.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })}
    </span>
  );
}

const getPayrollCutoff = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  const cutoffDates = [
    new Date(year, month, 13),
    new Date(year, month, lastDayOfMonth - 2),
  ];

  const nextCutoff = cutoffDates.find(
    (date) =>
      date.getTime() >=
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ).getTime(),
  );

  if (nextCutoff) {
    return nextCutoff;
  }

  return new Date(year, month + 1, 13);
};

const getDaysUntil = (targetDate: Date) => {
  const today = new Date();

  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const target = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  );

  return Math.max(
    0,
    Math.ceil((target.getTime() - start.getTime()) / 86400000),
  );
};

const formatCutoffDate = (date: Date) => {
  return date.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const employeeId = localStorage.getItem("employeeId") || "1";
  const role = localStorage.getItem("role") || "Employee";
  const userName = localStorage.getItem("userName") || "Employee";
  const isAdmin = role === "Admin";

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [adminStats, setAdminStats] = useState<AdminDashboardStats>({
    totalEmployees: 0,
    pendingAttendanceRequests: 0,
    pendingLeaves: 0,
    totalPayrollThisMonth: 0,
  });
  const [payrollTrends, setPayrollTrends] = useState<PayrollTrendItem[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(!isAdmin);
  const [isLoadingAdminStats, setIsLoadingAdminStats] = useState(isAdmin);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metricsError, setMetricsError] = useState(false);

  // Dynamic cutoff & holiday states
  const [payrollCutoff, setPayrollCutoff] = useState<Date>(getPayrollCutoff());
  const [daysUntilCutoff, setDaysUntilCutoff] = useState<number>(
    getDaysUntil(getPayrollCutoff()),
  );
  const [, setHolidays] = useState<Holiday[]>([]);

  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [confirmType, setConfirmType] = useState<LogType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const refreshDashboardData = useCallback(
    async (silent = false) => {
      if (isAdmin) {
        setIsLoadingAdminStats(true);
        try {
          const [empRes, reqRes, leaveRes, payrollSummaryRes] =
            await Promise.all([
              api.get("/Employees").catch(() => ({ data: [] })),
              api.get("/AttendanceRequests").catch(() => ({ data: [] })),
              api.get("/LeaveRequests").catch(() => ({ data: [] })),
              api
                .get("/Dashboard/payroll-summary")
                .catch(() => ({ data: { totalPayrollThisMonth: 0 } })),
            ]);

          const nonAdmins = (empRes.data || []).filter(
            (e: { isAdmin?: boolean }) => !e.isAdmin,
          );
          const pendingAtt = (reqRes.data || []).filter(
            (r: { status?: string }) => r.status === "Pending",
          ).length;
          const pendingLev = (leaveRes.data || []).filter(
            (l: { status?: string }) =>
              l.status === "Pending" || l.status === "In Review",
          ).length;

          setAdminStats({
            totalEmployees: nonAdmins.length,
            pendingAttendanceRequests: pendingAtt,
            pendingLeaves: pendingLev,
            totalPayrollThisMonth: payrollSummaryRes.data.totalPayrollThisMonth,
          });
        } catch {
          // Fallback stats
        } finally {
          setIsLoadingAdminStats(false);
        }
        return;
      }

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoadingMetrics(true);
      }
      setMetricsError(false);

      try {
        const res = await api.get(
          `/TimeRecords/dashboard-metrics/${employeeId}`,
        );
        setMetrics(res.data);
      } catch {
        setMetricsError(true);
      } finally {
        setIsLoadingMetrics(false);
        setIsRefreshing(false);
      }
    },
    [employeeId, isAdmin],
  );

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (isAdmin) {
        try {
          const [empRes, reqRes, leaveRes, payrollSummaryRes] =
            await Promise.all([
              api.get("/Employees").catch(() => ({ data: [] })),
              api.get("/AttendanceRequests").catch(() => ({ data: [] })),
              api.get("/LeaveRequests").catch(() => ({ data: [] })),
              api
                .get("/Dashboard/payroll-summary")
                .catch(() => ({ data: { totalPayrollThisMonth: 0 } })),
            ]);

          if (!isMounted) return;

          const nonAdmins = (empRes.data || []).filter(
            (e: { isAdmin?: boolean }) => !e.isAdmin,
          );
          const pendingAtt = (reqRes.data || []).filter(
            (r: { status?: string }) => r.status === "Pending",
          ).length;
          const pendingLev = (leaveRes.data || []).filter(
            (l: { status?: string }) =>
              l.status === "Pending" || l.status === "In Review",
          ).length;

          setAdminStats({
            totalEmployees: nonAdmins.length,
            pendingAttendanceRequests: pendingAtt,
            pendingLeaves: pendingLev,
            totalPayrollThisMonth: payrollSummaryRes.data.totalPayrollThisMonth,
          });

          setPayrollTrends([
            {
              period: "Prev Cutoff",
              amount: payrollSummaryRes.data.totalPayrollThisMonth * 0.45,
            },
            {
              period: "15th Cutoff",
              amount: payrollSummaryRes.data.totalPayrollThisMonth * 0.5,
            },
            {
              period: "Current Est.",
              amount: payrollSummaryRes.data.totalPayrollThisMonth,
            },
          ]);
        } catch {
          // Ignore
        } finally {
          if (isMounted) setIsLoadingAdminStats(false);
        }
        return;
      }

      try {
        const res = await api.get(
          `/TimeRecords/dashboard-metrics/${employeeId}`,
        );
        if (isMounted) {
          setMetrics(res.data);
        }
      } catch {
        if (isMounted) {
          setMetricsError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMetrics(false);
        }
      }
    };

    const loadHolidaysAndCutoff = async () => {
      try {
        const res = await api.get("/Holidays");
        if (isMounted && res.data) {
          setHolidays(res.data);
          const calculatedCutoff = getPayrollCutoff();
          setPayrollCutoff(calculatedCutoff);
          setDaysUntilCutoff(getDaysUntil(calculatedCutoff));
        }
      } catch {
        const fallbackCutoff = getPayrollCutoff();
        setPayrollCutoff(fallbackCutoff);
        setDaysUntilCutoff(getDaysUntil(fallbackCutoff));
      }
    };

    loadInitialData();
    loadHolidaysAndCutoff();

    return () => {
      isMounted = false;
    };
  }, [employeeId, isAdmin]);

  const renderFormattedTime = (timeStr: string | null) => {
    if (!timeStr || timeStr === "00:00") return "00:00";

    if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(timeStr.trim())) {
      return timeStr.trim();
    }

    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
      });
    }

    return timeStr;
  };

  const executeTimeLog = async () => {
    if (!confirmType || isSubmitting) return;

    setIsSubmitting(true);

    const sendLogRequest = async (
      latitude: number = 0,
      longitude: number = 0,
    ) => {
      try {
        await api.post("/TimeRecords/time-in-out", {
          employeeId: Number(employeeId),
          type: confirmType,
          latitude,
          longitude,
        });

        showToast(`Time ${confirmType} recorded successfully.`, "success");
        await refreshDashboardData(true);
      } catch (err: unknown) {
        const errorResponse = (err as { response?: { data?: string } })
          ?.response?.data;
        const errorMsg =
          typeof errorResponse === "string"
            ? errorResponse
            : `Unable to record Time ${confirmType}.`;
        showToast(errorMsg, "error");
      } finally {
        setIsSubmitting(false);
        setConfirmType(null);
      }
    };

    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent,
    );

    if (!isMobileDevice || !navigator.geolocation) {
      await sendLogRequest(0, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendLogRequest(latitude, longitude);
      },
      (error) => {
        console.warn("Mobile geolocation skipped or denied:", error.message);
        sendLogRequest(0, 0);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  };

  const attendanceReady = !isLoadingMetrics && !metricsError && !!metrics;
  const timeInDisabled = !attendanceReady || metrics!.hasClockedInToday;
  const timeOutDisabled =
    !attendanceReady ||
    !metrics!.hasClockedInToday ||
    metrics!.hasClockedOutToday;

  return (
    <div className="min-h-full w-full bg-slate-50">
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <header className="mb-6 sm:mb-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">
                {isAdmin ? "Administrative Portal" : "Employee Dashboard"}
              </p>

              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {getGreeting()}, {userName}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {isAdmin
                  ? "Manage system-wide operations, approvals, and records."
                  : "Manage your attendance, requests, and work records."}
              </p>
            </div>

            <div className="hidden shrink-0 space-y-0.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-right shadow-sm sm:block">
              <p className="text-xs font-medium text-slate-400">
                {new Date().toLocaleDateString("en-PH", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <div className="text-sm">
                <LiveClock />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs shadow-sm sm:hidden">
            <span className="font-medium text-slate-500">
              {new Date().toLocaleDateString("en-PH", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <LiveClock />
          </div>
        </header>

        {/* ADMIN DASHBOARD VIEW */}
        {isAdmin && (
          <AdminDashboard
            stats={adminStats}
            trends={payrollTrends}
            isLoading={isLoadingAdminStats}
            cutoffDate={payrollCutoff}
            onRefresh={() => refreshDashboardData(true)}
            navigate={navigate}
          />
        )}

        {/* ATTENDANCE HERO */}
        {!isAdmin && (
          <section
            aria-labelledby="attendance-heading"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-1">
                <div>
                  <h2
                    id="attendance-heading"
                    className="text-base font-bold text-slate-950"
                  >
                    Today's Attendance
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Record your attendance for today's shift.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => refreshDashboardData(true)}
                    disabled={isLoadingMetrics || isRefreshing}
                    aria-label="Refresh attendance data"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw
                      size={15}
                      className={isRefreshing ? "animate-spin" : ""}
                    />
                  </button>

                  {isLoadingMetrics ? (
                    <SkeletonBlock className="h-7 w-36 rounded-full" />
                  ) : metricsError ? (
                    <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                      <AlertCircle size={14} />
                      Couldn't load status
                    </div>
                  ) : metrics!.hasClockedOutToday ? (
                    <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={14} />
                      Shift completed
                    </div>
                  ) : metrics!.hasClockedInToday ? (
                    <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-(--brand-light)/30 px-3 py-1.5 text-xs font-semibold text-slate-900">
                      <Clock3 size={14} />
                      Currently clocked in
                    </div>
                  ) : (
                    <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      <CircleHelp size={14} />
                      Not clocked in
                    </div>
                  )}
                </div>
              </div>
            </div>

            {metricsError ? (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center sm:px-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    We couldn't load today's attendance
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Check your connection and try again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => refreshDashboardData()}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-(--primary) px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-(--primary-hover) cursor-pointer"
                >
                  <RefreshCw size={13} />
                  Try again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="border-b border-slate-100 p-5 sm:p-7 lg:col-span-7 lg:border-b-0 lg:border-r">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Attendance actions
                  </p>

                  {isLoadingMetrics ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <SkeletonBlock className="h-32 rounded-xl" />
                      <SkeletonBlock className="h-32 rounded-xl" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={timeInDisabled || isSubmitting}
                        onClick={() => setConfirmType("IN")}
                        aria-label={
                          timeInDisabled
                            ? "Time IN already recorded for today"
                            : "Record Time IN"
                        }
                        className={`
                          group relative flex min-h-32 flex-col justify-between
                          rounded-xl border p-5 text-left
                          transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2
                          ${
                            timeInDisabled
                              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                              : "cursor-pointer border-(--primary) bg-(--primary) text-slate-950 shadow-sm hover:bg-(--primary-hover) hover:shadow-md active:scale-[0.99]"
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={`
                              flex h-10 w-10 items-center justify-center rounded-lg font-bold
                              ${
                                timeInDisabled
                                  ? "bg-slate-200 text-slate-400"
                                  : "bg-white/20 text-slate-950"
                              }
                            `}
                          >
                            <LogIn size={20} />
                          </span>

                          {metrics!.hasClockedInToday && (
                            <CheckCircle2
                              size={18}
                              className="text-emerald-600"
                            />
                          )}
                        </div>

                        <div>
                          <p className="text-base font-bold">Time IN</p>

                          <p
                            className={`mt-1 text-xs font-semibold ${
                              timeInDisabled
                                ? "text-slate-400"
                                : "text-slate-900/80"
                            }`}
                          >
                            {metrics!.hasClockedInToday
                              ? "Already recorded today"
                              : "Start your workday"}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={timeOutDisabled || isSubmitting}
                        onClick={() => setConfirmType("OUT")}
                        aria-label={
                          metrics!.hasClockedOutToday
                            ? "Time OUT already recorded for today"
                            : !metrics!.hasClockedInToday
                              ? "Time OUT unavailable until Time IN is recorded"
                              : "Record Time OUT"
                        }
                        className={`
                          group relative flex min-h-32 flex-col justify-between
                          rounded-xl border p-5 text-left
                          transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2
                          ${
                            timeOutDisabled
                              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                              : "cursor-pointer border-slate-300 bg-white text-slate-900 hover:border-(--primary) hover:bg-amber-50/20 hover:shadow-sm active:scale-[0.99]"
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={`
                              flex h-10 w-10 items-center justify-center rounded-lg
                              ${
                                timeOutDisabled
                                  ? "bg-slate-200 text-slate-400"
                                  : "bg-amber-100 text-amber-900"
                              }
                            `}
                          >
                            <LogOut size={20} />
                          </span>

                          {metrics!.hasClockedOutToday && (
                            <CheckCircle2
                              size={18}
                              className="text-emerald-600"
                            />
                          )}
                        </div>

                        <div>
                          <p className="text-base font-bold">Time OUT</p>

                          <p className="mt-1 text-xs text-slate-500">
                            {metrics!.hasClockedOutToday
                              ? "Already recorded today"
                              : !metrics!.hasClockedInToday
                                ? "Available after Time IN"
                                : "End your workday"}
                          </p>
                        </div>
                      </button>
                    </div>
                  )}

                  <div className="mt-4 flex gap-3 rounded-lg border border-(--brand-light)/40 bg-amber-50/30 p-3.5">
                    <CircleHelp
                      size={17}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />

                    <p className="text-xs leading-5 text-slate-600">
                      <span className="font-semibold text-slate-800">
                        Payroll record:
                      </span>{" "}
                      Your first Time IN of the day is used for payroll
                      computation. Once recorded, Time IN is disabled to prevent
                      duplicate entries.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-7 lg:col-span-5">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Today's record
                  </p>

                  {isLoadingMetrics ? (
                    <div className="space-y-3">
                      <SkeletonBlock className="h-17 rounded-xl" />
                      <SkeletonBlock className="h-17 rounded-xl" />
                      <SkeletonBlock className="h-17 rounded-xl" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                            <LogIn size={17} />
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Time IN
                            </p>

                            <p className="text-sm font-bold text-slate-900">
                              {renderFormattedTime(metrics!.lastTimeIn)}
                            </p>
                          </div>
                        </div>

                        {metrics!.hasClockedInToday && (
                          <CheckCircle2
                            size={17}
                            className="text-emerald-600"
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                            <LogOut size={17} />
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Time OUT
                            </p>

                            <p className="text-sm font-bold text-slate-900">
                              {renderFormattedTime(metrics!.lastTimeOut)}
                            </p>
                          </div>
                        </div>

                        {metrics!.hasClockedOutToday && (
                          <CheckCircle2
                            size={17}
                            className="text-emerald-600"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* QUICK ACCESS MODULES */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Quick Access
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Frequently used employee modules.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-3 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => navigate("/timesheet")}
              className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-(--primary) hover:shadow-md focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2 sm:p-5 cursor-pointer"
            >
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-900 sm:mb-8">
                <Clock3 size={20} />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">Timesheet</p>

                  <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                    View and manage attendance.
                  </p>
                </div>

                <ChevronRight
                  size={17}
                  className="hidden shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 sm:block"
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/leaves")}
              className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-(--primary) hover:shadow-md focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2 sm:p-5 cursor-pointer"
            >
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-900 sm:mb-8">
                <CalendarDays size={20} />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">Leaves</p>

                  <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                    Request and track leave.
                  </p>
                </div>

                <ChevronRight
                  size={17}
                  className="hidden shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 sm:block"
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/overtime")}
              className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-(--primary) hover:shadow-md focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2 sm:p-5 cursor-pointer"
            >
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-900 sm:mb-8">
                <FileText size={20} />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">Overtime</p>

                  <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                    Submit and monitor overtime.
                  </p>
                </div>

                <ChevronRight
                  size={17}
                  className="hidden shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 sm:block"
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/history")}
              className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-(--primary) hover:shadow-md focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2 sm:p-5 cursor-pointer"
            >
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-900 sm:mb-8">
                <History size={20} />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">History</p>

                  <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                    Review previous records.
                  </p>
                </div>

                <ChevronRight
                  size={17}
                  className="hidden shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 sm:block"
                />
              </div>
            </button>
          </div>
        </section>

        {/* THIS PERIOD SNAPSHOT */}
        {!isAdmin && !metricsError && (
          <section className="mt-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  This Period
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Hours logged and estimated payout for the current cutoff.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {isLoadingMetrics ? (
                <>
                  <SkeletonBlock className="h-26 rounded-xl" />
                  <SkeletonBlock className="h-26 rounded-xl" />
                  <SkeletonBlock className="h-26 rounded-xl" />
                  <SkeletonBlock className="h-26 rounded-xl" />
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Timer size={18} />
                    </div>
                    <p className="text-lg font-bold text-slate-950 sm:text-xl">
                      {metrics!.regularHours.toFixed(1)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Regular hours
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <TrendingUp size={18} />
                    </div>
                    <p className="text-lg font-bold text-slate-950 sm:text-xl">
                      {metrics!.overtimeHours.toFixed(1)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Overtime hours
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Clock3 size={18} />
                    </div>
                    <p className="text-lg font-bold text-slate-950 sm:text-xl">
                      {metrics!.totalHours.toFixed(1)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Total hours</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-(--brand-light)/30 text-slate-950">
                      <Wallet size={18} />
                    </div>
                    <p className="text-lg font-bold text-slate-950 sm:text-xl">
                      {formatCurrency(metrics!.estimatedPayout)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Est. payout</p>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* MISSED RECORDS & PAYROLL CUTOFF */}
        {!isAdmin && (
          <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {isLoadingMetrics ? (
              <SkeletonBlock className="h-21 rounded-xl" />
            ) : (
              <button
                type="button"
                onClick={() => navigate("/timesheet")}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-(--primary) hover:shadow-md focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`
                      flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                      ${
                        (metrics?.missedRecordsCount ?? 0) > 0
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }
                    `}
                  >
                    {(metrics?.missedRecordsCount ?? 0) > 0 ? (
                      <AlertCircle size={21} />
                    ) : (
                      <CheckCircle2 size={21} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Missed Time Records
                      </p>

                      <span
                        className={`
                          rounded-full px-2 py-0.5 text-xs font-bold
                          ${
                            (metrics?.missedRecordsCount ?? 0) > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }
                        `}
                      >
                        {metrics?.missedRecordsCount ?? 0}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {(metrics?.missedRecordsCount ?? 0) > 0
                        ? "Days without a recorded Time IN."
                        : "No missed attendance records."}
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={18}
                  className="text-slate-400 transition-transform group-hover:translate-x-1"
                />
              </button>
            )}

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--brand-light)/30 text-slate-950">
                  <CalendarDays size={21} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Next Payroll Cut-off
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatCutoffDate(payrollCutoff)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-slate-950">
                  {daysUntilCutoff}
                </p>

                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {daysUntilCutoff === 1 ? "day" : "days"} left
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <ConfirmModal
        isOpen={confirmType !== null}
        title={`Confirm Time ${confirmType}`}
        message={
          confirmType === "IN"
            ? "Are you sure you want to record your Time IN for today?"
            : "Are you sure you want to record your Time OUT for today?"
        }
        confirmText={
          isSubmitting ? "Recording..." : `Confirm Time ${confirmType}`
        }
        onConfirm={executeTimeLog}
        onClose={() => {
          if (!isSubmitting) {
            setConfirmType(null);
          }
        }}
      />

      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
