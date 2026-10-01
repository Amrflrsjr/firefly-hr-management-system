import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Clock,
  Plus,
  Check,
  X,
  Trash2,
  LogIn,
  LogOut,
  AlertCircle,
  UserCheck,
  Download,
  Loader2,
  ChevronDown,
  CalendarX2,
  Inbox,
  RotateCw,
} from "lucide-react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import LocationCell from "../components/timesheet/LocationCell";
import ManualModal from "../components/timesheet/ManualModal";
import PaginationBar from "../components/timesheet/PaginationBar";
import { FOCUS, ROW_BASE } from "../utils/uiConstants";
import {
  PersonCell,
  SkeletonRows,
  EmptyState,
  Chip,
  StatusBadge,
} from "../components/ListUI";

interface Person {
  firstName: string;
  lastName: string;
}

interface AttendanceRequestItem {
  id: number;
  employeeId: number;
  employee?: Person;
  type: string;
  targetDate: string;
  status: string;
  dateRequested: string;
}

interface TimeRecordItem {
  id: number;
  employeeId: number;
  employee?: Person;
  type: string;
  date: string;
  dateCreated: string;
  latitude: number;
  longitude: number;
  isRequested: boolean;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
}

type StatusFilter = "All" | "Pending" | "Approved" | "Declined";

const ITEMS_PER_PAGE = 15;
const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "Pending",
  "Approved",
  "Declined",
];

/* ---------- layout + style constants (literal strings so Tailwind sees them) ---------- */

// key = `${showEmployee}-${hasActions}`
const RECORD_GRID: Record<string, string> = {
  "1-1": "md:grid-cols-[84px_112px_minmax(0,1fr)_minmax(0,1.3fr)_36px]",
  "1-0": "md:grid-cols-[84px_112px_minmax(0,1fr)_minmax(0,1.3fr)]",
  "0-1": "md:grid-cols-[84px_112px_minmax(0,1fr)_36px]",
  "0-0": "md:grid-cols-[84px_112px_minmax(0,1fr)]",
};
const REQUEST_GRID_ADMIN =
  "md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_112px_112px_96px_216px]";
const REQUEST_GRID_EMPLOYEE =
  "md:grid-cols-[minmax(0,1fr)_112px_112px_96px_36px]";

/* ---------- date helpers ---------- */

const pad = (n: number) => String(n).padStart(2, "0");
const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const personName = (p: Person | undefined, id: number) =>
  p ? `${p.lastName}, ${p.firstName}` : `Employee #${id}`;

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

function describeDay(d: Date) {
  const today = startOfDay(new Date());
  const diff = Math.round(
    (today.getTime() - startOfDay(d).getTime()) / 86_400_000,
  );
  const full = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
  if (diff === 0) return { primary: "Today", secondary: full };
  if (diff === 1) return { primary: "Yesterday", secondary: full };
  return { primary: full, secondary: "" };
}

const PRESETS: { label: string; range: () => [string, string] }[] = [
  {
    label: "Today",
    range: () => [toInputDate(new Date()), toInputDate(new Date())],
  },
  {
    label: "Yesterday",
    range: () => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return [toInputDate(y), toInputDate(y)];
    },
  },
  {
    label: "Last 7 days",
    range: () => {
      const s = new Date();
      s.setDate(s.getDate() - 6);
      return [toInputDate(s), toInputDate(new Date())];
    },
  },
  {
    label: "This month",
    range: () => {
      const n = new Date();
      return [
        toInputDate(new Date(n.getFullYear(), n.getMonth(), 1)),
        toInputDate(n),
      ];
    },
  },
];

/* ---------- small presentational pieces ---------- */

function TypeBadge({ type }: { type: string }) {
  const isIn = type === "IN";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
        isIn
          ? "border-emerald-200/70 bg-emerald-50 text-emerald-700"
          : "border-amber-200/70 bg-amber-50 text-amber-700"
      }`}
    >
      {isIn ? <LogIn size={13} /> : <LogOut size={13} />}
      {isIn ? "Time in" : "Time out"}
    </span>
  );
}

/* ---------- page ---------- */

export default function Timesheet() {
  const [activeTab, setActiveTab] = useState<"records" | "requests">("records");
  const [records, setRecords] = useState<TimeRecordItem[]>([]);
  const [requests, setRequests] = useState<AttendanceRequestItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualType, setManualType] = useState("IN");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [recordsPage, setRecordsPage] = useState<number>(1);
  const [totalRecordsPages, setTotalRecordsPages] = useState<number>(1);
  const [requestsPage, setRequestsPage] = useState<number>(1);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "";
  const isAdmin = role === "Admin";

  // Page-level filter. The modal has its own employee state so picking an
  // employee while adding a record no longer reloads the table behind it.
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    isAdmin ? "all" : loggedInEmployeeId,
  );
  const [modalEmployee, setModalEmployee] = useState<string>("");

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type?: "danger" | "primary";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") =>
    setToast({ text, type });

  // Auto-dismiss; a new toast replaces the object, which restarts the timer.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchTimesheetData = useCallback(
    async (targetId: string, start: string, end: string, page: number) => {
      setLoadingData(true);
      setLoadError(false);
      const effectiveId = isAdmin ? targetId : loggedInEmployeeId;

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", ITEMS_PER_PAGE.toString());
      if (start) params.append("startDate", start);
      if (end) params.append("endDate", end);

      try {
        const recordsEndpoint =
          effectiveId && effectiveId !== "all"
            ? `/TimeRecords/employee/${effectiveId}?${params.toString()}`
            : `/TimeRecords?${params.toString()}`;

        const res = await api.get(recordsEndpoint);
        setRecords(res.data.items || []);
        setTotalRecordsPages(res.data.totalPages || 1);
      } catch {
        setRecords([]);
        setTotalRecordsPages(1);
        setLoadError(true);
      }

      try {
        const reqEndpoint =
          effectiveId && effectiveId !== "all"
            ? `/AttendanceRequests/employee/${effectiveId}`
            : "/AttendanceRequests";
        const reqRes = await api.get(reqEndpoint);
        setRequests(reqRes.data || []);
      } catch {
        setRequests([]);
      } finally {
        setLoadingData(false);
      }
    },
    [isAdmin, loggedInEmployeeId],
  );

  useEffect(() => {
    let isMounted = true;
    const initLoad = async () => {
      if (isAdmin) {
        try {
          const res = await api.get("/Employees");
          if (!isMounted) return;

          const nonAdminEmployees = res.data
            .filter((emp: Employee) => !emp.isAdmin)
            .sort((a: Employee, b: Employee) =>
              a.lastName.localeCompare(b.lastName),
            );

          setEmployees(nonAdminEmployees);
          await fetchTimesheetData(
            selectedEmployee || "all",
            startDate,
            endDate,
            recordsPage,
          );
        } catch {
          if (isMounted) setLoadingData(false);
        }
      } else if (loggedInEmployeeId) {
        await fetchTimesheetData(
          loggedInEmployeeId,
          startDate,
          endDate,
          recordsPage,
        );
      } else {
        if (isMounted) setLoadingData(false);
      }
    };
    initLoad();
    return () => {
      isMounted = false;
    };
  }, [
    isAdmin,
    selectedEmployee,
    startDate,
    endDate,
    loggedInEmployeeId,
    recordsPage,
    fetchTimesheetData,
  ]);

  const reload = () =>
    fetchTimesheetData(selectedEmployee, startDate, endDate, recordsPage);

  const closeConfirm = () =>
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

  const triggerDeleteRecordModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete time record",
      message:
        "Are you sure you want to delete this attendance record? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/TimeRecords/${id}`);
          showToast("Time record deleted.");
          reload();
        } catch {
          showToast("Couldn't delete the time record. Try again.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const triggerDeleteRequestModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete attendance request",
      message:
        "Are you sure you want to delete this attendance correction request? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/AttendanceRequests/${id}`);
          showToast("Attendance request deleted.");
          reload();
        } catch {
          showToast("Couldn't delete the request. Try again.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const openManualModal = () => {
    if (isAdmin) {
      setModalEmployee(
        selectedEmployee !== "all"
          ? selectedEmployee
          : String(employees[0]?.id ?? ""),
      );
    }
    setShowManualModal(true);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = isAdmin ? modalEmployee : loggedInEmployeeId;
    if (!manualDate || !targetId) {
      showToast("Choose an employee and a date and time.", "error");
      return;
    }

    const [selectedDateStr, selectedTimeStr] = manualDate.split("T");
    const targetDateTime = new Date(
      `${selectedDateStr}T${selectedTimeStr || "00:00"}`,
    );

    try {
      if (isAdmin) {
        await api.post("/TimeRecords/time-in-out", {
          employeeId: Number(targetId),
          type: manualType,
          dateCreated: targetDateTime.toISOString(),
        });
        showToast("Attendance record added.");
      } else {
        await api.post("/AttendanceRequests", {
          employeeId: Number(targetId),
          type: manualType,
          targetDate: targetDateTime.toISOString(),
        });
        showToast("Correction request sent for review.");
      }
      setShowManualModal(false);
      setManualDate("");
      reload();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: string } })?.response?.data ||
        "Couldn't save the attendance entry.";
      showToast(
        typeof errorMsg === "string"
          ? errorMsg
          : "Couldn't save the attendance entry.",
        "error",
      );
    }
  };

  const triggerApproveModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Approve attendance request",
      message:
        "Are you sure you want to approve this missed attendance correction?",
      confirmText: "Approve",
      type: "primary",
      onConfirm: async () => {
        try {
          await api.put(`/AttendanceRequests/${id}/approve`);
          showToast("Request approved and added to the timesheet.");
          reload();
        } catch (err: unknown) {
          const errorMsg =
            (err as { response?: { data?: string } })?.response?.data ||
            "Couldn't approve the request.";
          showToast(
            typeof errorMsg === "string"
              ? errorMsg
              : "Couldn't approve the request.",
            "error",
          );
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const triggerDeclineModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Decline attendance request",
      message:
        "Are you sure you want to decline this missed attendance request?",
      confirmText: "Decline",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/AttendanceRequests/${id}/reject`);
          showToast("Request declined.");
          reload();
        } catch {
          showToast("Couldn't decline the request. Try again.", "error");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const exportNeedsEmployee = isAdmin && selectedEmployee === "all";

  const handleExportExcel = async () => {
    if (exportNeedsEmployee) {
      showToast("Choose an employee to export their timesheet.", "error");
      return;
    }
    const targetExportId = isAdmin ? selectedEmployee : loggedInEmployeeId;

    setIsExporting(true);
    try {
      const response = await api.get(
        `/TimeRecords/export/employee/${targetExportId}`,
        { responseType: "blob" },
      );
      const activeEmp = employees.find(
        (e) => e.id.toString() === targetExportId,
      );
      const empName = activeEmp
        ? `${activeEmp.lastName}_${activeEmp.firstName}`
        : "Employee";

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Timesheet_${empName}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("Timesheet exported.");
    } catch {
      showToast("Couldn't export the timesheet. Try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  /* ----- derived data ----- */

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  const statusCounts: Record<StatusFilter, number> = {
    All: requests.length,
    Pending: pendingCount,
    Approved: requests.filter((r) => r.status === "Approved").length,
    Declined: requests.filter((r) => r.status === "Declined").length,
  };

  // Pending first (that's what admins act on), then newest first.
  const visibleRequests = useMemo(() => {
    return requests
      .filter((r) => statusFilter === "All" || r.status === statusFilter)
      .sort(
        (a, b) =>
          Number(b.status === "Pending") - Number(a.status === "Pending") ||
          new Date(b.dateRequested).getTime() -
            new Date(a.dateRequested).getTime(),
      );
  }, [requests, statusFilter]);

  const totalRequestsPages = Math.ceil(visibleRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = useMemo(() => {
    const start = (requestsPage - 1) * ITEMS_PER_PAGE;
    return visibleRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleRequests, requestsPage]);

  // Group the current page of logs by calendar day.
  const recordGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        primary: string;
        secondary: string;
        items: TimeRecordItem[];
      }
    >();
    for (const r of records) {
      const d = new Date(r.dateCreated || r.date);
      const key = toInputDate(d);
      if (!groups.has(key)) {
        groups.set(key, { key, ...describeDay(d), items: [] });
      }
      groups.get(key)!.items.push(r);
    }
    return [...groups.values()];
  }, [records]);

  const showEmployeeCol = isAdmin && selectedEmployee === "all";
  const recordGrid = RECORD_GRID[`${+showEmployeeCol}-${+isAdmin}`];
  const requestGrid = isAdmin ? REQUEST_GRID_ADMIN : REQUEST_GRID_EMPLOYEE;
  const hasDateFilter = Boolean(startDate || endDate);

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
    setSelectedPreset(null);
    setRecordsPage(1);
  };

  const scrollToCard = () =>
    document
      .getElementById("timesheet-card")
      ?.scrollIntoView({ block: "start" });

  const changeRecordsPage = (p: number) => {
    setRecordsPage(p);
    scrollToCard();
  };
  const changeRequestsPage = (p: number) => {
    setRequestsPage(p);
    scrollToCard();
  };

  const dateInput =
    "h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 cursor-pointer focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
            <Clock size={19} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Attendance timesheet
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Review work logs, or file a correction for a missed shift.
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            onClick={handleExportExcel}
            disabled={isExporting || loadingData}
            aria-disabled={exportNeedsEmployee}
            title={
              exportNeedsEmployee
                ? "Choose an employee to export their timesheet"
                : "Download as Excel"
            }
            className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer disabled:opacity-50 sm:flex-none ${FOCUS} ${
              exportNeedsEmployee ? "opacity-60" : ""
            }`}
          >
            {isExporting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            {isExporting ? "Exporting…" : "Export"}
          </button>

          <button
            onClick={openManualModal}
            disabled={loadingData}
            className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-(--primary) px-4 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-(--primary-hover) cursor-pointer disabled:opacity-50 sm:flex-none ${FOCUS}`}
          >
            <Plus size={16} />
            {isAdmin ? "Add record" : "Request correction"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex gap-6 border-b border-slate-200">
        {(
          [
            { id: "records", label: "Recorded logs" },
            { id: "requests", label: isAdmin ? "Requests" : "My requests" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setRecordsPage(1);
              setRequestsPage(1);
            }}
            className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors cursor-pointer ${FOCUS} ${
              activeTab === tab.id
                ? "border-(--primary) text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
            {tab.id === "requests" && pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                {pendingCount} pending
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card */}
      <section
        id="timesheet-card"
        className="scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-b border-slate-200 bg-slate-50/50 p-4 sm:px-5">
          {isAdmin && employees.length > 0 && (
            <label className="flex w-full flex-col gap-1.5 sm:w-64">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <UserCheck size={13} className="text-slate-400" />
                Employee
              </span>
              <span className="relative">
                <select
                  value={selectedEmployee}
                  disabled={loadingData || isExporting}
                  onChange={(e) => {
                    setSelectedEmployee(e.target.value);
                    setRecordsPage(1);
                    setRequestsPage(1);
                  }}
                  className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm font-medium text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60"
                >
                  <option value="all">All employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.lastName}, {emp.firstName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </span>
            </label>
          )}

          {activeTab === "records" ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">
                Date range
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((p) => {
                  const [s, e] = p.range();
                  return (
                    <Chip
                      key={p.label}
                      active={selectedPreset === p.label}
                      onClick={() => {
                        setSelectedPreset(p.label);
                        setStartDate(s);
                        setEndDate(e);
                        setRecordsPage(1);
                      }}
                    >
                      {p.label}
                    </Chip>
                  );
                })}
                <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
                <input
                  type="date"
                  aria-label="From date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => {
                    setSelectedPreset(null);
                    setStartDate(e.target.value);
                    setRecordsPage(1);
                  }}
                  className={dateInput}
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  aria-label="To date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => {
                    setSelectedPreset(null);
                    setEndDate(e.target.value);
                    setRecordsPage(1);
                  }}
                  className={dateInput}
                />
                {hasDateFilter && (
                  <button
                    onClick={clearDates}
                    className={`flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer ${FOCUS}`}
                  >
                    <X size={13} />
                    Clear
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600">Status</span>
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_FILTERS.map((s) => (
                  <Chip
                    key={s}
                    active={statusFilter === s}
                    onClick={() => {
                      setStatusFilter(s);
                      setRequestsPage(1);
                    }}
                  >
                    {s}
                    <span className="ml-1.5 font-normal text-slate-400">
                      {statusCounts[s]}
                    </span>
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        {loadingData ? (
          <SkeletonRows />
        ) : activeTab === "records" ? (
          loadError ? (
            <EmptyState
              icon={<AlertCircle size={20} />}
              title="Couldn't load the time records"
              text="Check your connection and try again."
              action={
                <button
                  onClick={reload}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${FOCUS}`}
                >
                  <RotateCw size={13} />
                  Try again
                </button>
              }
            />
          ) : records.length === 0 ? (
            <EmptyState
              icon={<CalendarX2 size={20} />}
              title={
                hasDateFilter
                  ? "No logs in this date range"
                  : "No attendance logs yet"
              }
              text={
                hasDateFilter
                  ? "Try a wider range, or clear the dates to see everything."
                  : "Logs appear here as soon as someone clocks in or out."
              }
              action={
                hasDateFilter && (
                  <button
                    onClick={clearDates}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${FOCUS}`}
                  >
                    Clear dates
                  </button>
                )
              }
            />
          ) : (
            <>
              <div
                className={`hidden border-b border-slate-200 px-5 py-2.5 text-xs font-medium text-slate-500 md:grid md:gap-x-4 ${recordGrid}`}
              >
                <span>Time</span>
                <span>Type</span>
                {showEmployeeCol && <span>Employee</span>}
                <span>Location</span>
                {isAdmin && <span className="sr-only">Actions</span>}
              </div>

              <div className="divide-y divide-slate-200">
                {recordGroups.map((group) => (
                  <div key={group.key}>
                    <div className="flex items-baseline gap-2 border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs">
                      <h3 className="font-semibold text-slate-900">
                        {group.primary}
                      </h3>
                      {group.secondary && (
                        <span className="text-slate-500">
                          {group.secondary}
                        </span>
                      )}
                      <span className="ml-auto text-slate-400">
                        {group.items.length}{" "}
                        {group.items.length === 1 ? "log" : "logs"}
                      </span>
                    </div>

                    <ul className="divide-y divide-slate-100">
                      {group.items.map((record) => {
                        const d = new Date(record.dateCreated || record.date);
                        return (
                          <li
                            key={record.id}
                            className={`group px-5 py-3 transition-colors hover:bg-slate-50/70 ${ROW_BASE} ${recordGrid}`}
                          >
                            <span className="order-2 w-21 text-sm font-semibold tabular-nums text-slate-900 md:order-0">
                              {fmtTime(d)}
                            </span>
                            <div className="order-3 md:order-0">
                              <TypeBadge type={record.type} />
                            </div>
                            {showEmployeeCol && (
                              <div className="order-1 w-full min-w-0 md:order-0 md:w-auto">
                                <PersonCell
                                  name={personName(
                                    record.employee,
                                    record.employeeId,
                                  )}
                                />
                              </div>
                            )}
                            <div className="order-5 w-full min-w-0 md:order-0 md:w-auto">
                              <LocationCell
                                lat={record.latitude}
                                lon={record.longitude}
                              />
                            </div>
                            {isAdmin && (
                              <div className="order-4 ml-auto md:order-0 md:ml-0 md:justify-self-end">
                                <button
                                  onClick={() =>
                                    triggerDeleteRecordModal(record.id)
                                  }
                                  aria-label={`Delete ${record.type === "IN" ? "time in" : "time out"} log at ${fmtTime(d)}`}
                                  className={`rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer ${FOCUS}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )
        ) : paginatedRequests.length === 0 ? (
          <EmptyState
            icon={<Inbox size={20} />}
            title={
              statusFilter === "All"
                ? "No attendance requests"
                : `No ${statusFilter.toLowerCase()} requests`
            }
            text={
              isAdmin
                ? "Correction requests from employees will show up here for review."
                : "When you request a correction for a missed shift, you can track it here."
            }
            action={
              statusFilter !== "All" && (
                <button
                  onClick={() => setStatusFilter("All")}
                  className={`inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${FOCUS}`}
                >
                  Show all requests
                </button>
              )
            }
          />
        ) : (
          <>
            <div
              className={`hidden border-b border-slate-200 px-5 py-2.5 text-xs font-medium text-slate-500 md:grid md:gap-x-4 ${requestGrid}`}
            >
              {isAdmin && <span>Employee</span>}
              <span>Requested for</span>
              <span>Type</span>
              <span>Status</span>
              <span>Filed</span>
              <span className="sr-only">Actions</span>
            </div>

            <ul className="divide-y divide-slate-100">
              {paginatedRequests.map((req) => {
                const target = new Date(req.targetDate);
                const isPending = req.status === "Pending";
                return (
                  <li
                    key={req.id}
                    className={`relative px-5 py-3 transition-colors hover:bg-slate-50/70 ${ROW_BASE} ${requestGrid}`}
                  >
                    {isPending && (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-0.5 bg-amber-400"
                      />
                    )}
                    {isAdmin && (
                      <div className="w-full min-w-0 md:w-auto">
                        <PersonCell
                          name={personName(req.employee, req.employeeId)}
                        />
                      </div>
                    )}
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-slate-900">
                        {fmtDate(target)}
                      </p>
                      <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                        {fmtTime(target)}
                      </p>
                    </div>
                    <TypeBadge type={req.type} />
                    <StatusBadge status={req.status} />
                    <span className="text-xs text-slate-500">
                      <span className="md:hidden">Filed </span>
                      {fmtDate(new Date(req.dateRequested))}
                    </span>
                    <div className="flex w-full items-center justify-end gap-1.5 md:w-auto">
                      {isAdmin && isPending && (
                        <>
                          <button
                            onClick={() => triggerApproveModal(req.id)}
                            className={`inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200/70 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 cursor-pointer ${FOCUS}`}
                          >
                            <Check size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => triggerDeclineModal(req.id)}
                            className={`inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200/70 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 cursor-pointer ${FOCUS}`}
                          >
                            <X size={14} />
                            Decline
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => triggerDeleteRequestModal(req.id)}
                        aria-label="Delete request"
                        className={`rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer ${FOCUS}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {activeTab === "records" && !loadingData && (
          <PaginationBar
            page={recordsPage}
            totalPages={totalRecordsPages}
            onPageChange={changeRecordsPage}
          />
        )}
        {activeTab === "requests" && !loadingData && (
          <PaginationBar
            page={requestsPage}
            totalPages={totalRequestsPages}
            onPageChange={changeRequestsPage}
          />
        )}
      </section>

      <ManualModal
        isOpen={showManualModal}
        role={role}
        employees={employees}
        selectedEmployee={modalEmployee}
        manualDate={manualDate}
        manualType={manualType}
        onClose={() => setShowManualModal(false)}
        onSubmit={handleManualSubmit}
        onEmployeeChange={setModalEmployee}
        onTypeChange={setManualType}
        onDateChange={setManualDate}
      />

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onClose={closeConfirm}
      />

      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
