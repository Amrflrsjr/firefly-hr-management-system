import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Clock,
  PlusCircle,
  CheckCircle,
  X,
  Trash2,
  LogIn,
  LogOut,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Download,
  Loader2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import LocationCell from "../components/timesheet/LocationCell";
import ManualModal from "../components/timesheet/ManualModal";
import PaginationBar from "../components/timesheet/PaginationBar";

interface AttendanceRequestItem {
  id: number;
  employeeId: number;
  employee?: { firstName: string; lastName: string };
  type: string;
  targetDate: string;
  status: string;
  dateRequested: string;
}

interface TimeRecordItem {
  id: number;
  employeeId: number;
  employee?: { firstName: string; lastName: string };
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

const ITEMS_PER_PAGE = 15;

export default function Timesheet() {
  const [activeTab, setActiveTab] = useState<"records" | "requests">("records");
  const [records, setRecords] = useState<TimeRecordItem[]>([]);
  const [requests, setRequests] = useState<AttendanceRequestItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualType, setManualType] = useState("IN");

  const [filterDate, setFilterDate] = useState<string>("");
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [recordsPage, setRecordsPage] = useState<number>(1);
  const [totalRecordsPages, setTotalRecordsPages] = useState<number>(1);

  const [requestsPage, setRequestsPage] = useState<number>(1);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "";

  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    role === "Admin" ? "all" : loggedInEmployeeId,
  );

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

  const showToast = useCallback(
    (text: string, type: "success" | "error" = "success") => {
      setToast({ text, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  const fetchTimesheetData = useCallback(
    async (targetId: string, dateFilter: string, page: number) => {
      setLoadingData(true);
      const effectiveId = role === "Admin" ? targetId : loggedInEmployeeId;

      try {
        let recordsEndpoint = `/TimeRecords?page=${page}&pageSize=${ITEMS_PER_PAGE}`;
        if (effectiveId && effectiveId !== "all") {
          recordsEndpoint = dateFilter
            ? `/TimeRecords/employee/${effectiveId}?date=${dateFilter}&page=${page}&pageSize=${ITEMS_PER_PAGE}`
            : `/TimeRecords/employee/${effectiveId}?page=${page}&pageSize=${ITEMS_PER_PAGE}`;
        } else {
          recordsEndpoint = dateFilter
            ? `/TimeRecords?date=${dateFilter}&page=${page}&pageSize=${ITEMS_PER_PAGE}`
            : `/TimeRecords?page=${page}&pageSize=${ITEMS_PER_PAGE}`;
        }

        const res = await api.get(recordsEndpoint);
        setRecords(res.data.items || []);
        setTotalRecordsPages(res.data.totalPages || 1);
      } catch {
        setRecords([]);
        setTotalRecordsPages(1);
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
    [role, loggedInEmployeeId],
  );

  useEffect(() => {
    let isMounted = true;
    const initLoad = async () => {
      if (role === "Admin") {
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
            filterDate,
            recordsPage,
          );
        } catch {
          if (isMounted) setLoadingData(false);
        }
      } else if (loggedInEmployeeId) {
        await fetchTimesheetData(loggedInEmployeeId, filterDate, recordsPage);
      } else {
        if (isMounted) setLoadingData(false);
      }
    };
    initLoad();
    return () => {
      isMounted = false;
    };
  }, [
    role,
    selectedEmployee,
    filterDate,
    loggedInEmployeeId,
    recordsPage,
    fetchTimesheetData,
  ]);

  const triggerDeleteRecordModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Time Record",
      message:
        "Are you sure you want to delete this attendance record? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/TimeRecords/${id}`);
          showToast("Time record deleted successfully.");
          fetchTimesheetData(selectedEmployee, filterDate, recordsPage);
        } catch {
          showToast("Failed to delete time record.", "error");
        } finally {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const triggerDeleteRequestModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Attendance Request",
      message:
        "Are you sure you want to delete this attendance correction request? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/AttendanceRequests/${id}`);
          showToast("Attendance request deleted successfully.");
          fetchTimesheetData(selectedEmployee, filterDate, recordsPage);
        } catch {
          showToast("Failed to delete request.", "error");
        } finally {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId =
      role === "Admin" && selectedEmployee !== "all"
        ? selectedEmployee
        : loggedInEmployeeId;
    if (!manualDate || !targetId) {
      showToast("Please select a specific employee to add a record.", "error");
      return;
    }

    const [selectedDateStr, selectedTimeStr] = manualDate.split("T");
    const targetDateTime = new Date(
      `${selectedDateStr}T${selectedTimeStr || "00:00"}`,
    );

    try {
      if (role === "Admin") {
        await api.post("/TimeRecords/time-in-out", {
          employeeId: Number(targetId),
          type: manualType,
          dateCreated: targetDateTime.toISOString(),
        });
        showToast("Attendance record added successfully!");
      } else {
        await api.post("/AttendanceRequests", {
          employeeId: Number(targetId),
          type: manualType,
          targetDate: targetDateTime.toISOString(),
        });
        showToast("Missed attendance request submitted successfully!");
      }
      setShowManualModal(false);
      setManualDate("");
      fetchTimesheetData(selectedEmployee, filterDate, recordsPage);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: string } })?.response?.data ||
        "Failed to process attendance entry.";
      showToast(
        typeof errorMsg === "string"
          ? errorMsg
          : "Failed to process attendance entry.",
        "error",
      );
    }
  };

  const triggerApproveModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Approve Attendance Request",
      message:
        "Are you sure you want to approve this missed attendance correction?",
      confirmText: "Approve",
      type: "primary",
      onConfirm: async () => {
        try {
          await api.put(`/AttendanceRequests/${id}/approve`);
          showToast("Attendance request approved and logged!");
          fetchTimesheetData(selectedEmployee, filterDate, recordsPage);
        } catch (err: unknown) {
          const errorMsg =
            (err as { response?: { data?: string } })?.response?.data ||
            "Failed to approve request.";
          showToast(
            typeof errorMsg === "string"
              ? errorMsg
              : "Failed to approve request.",
            "error",
          );
        } finally {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const triggerDeclineModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Decline Attendance Request",
      message:
        "Are you sure you want to decline this missed attendance request?",
      confirmText: "Decline",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/AttendanceRequests/${id}/reject`);
          showToast("Attendance request declined successfully.");
          fetchTimesheetData(selectedEmployee, filterDate, recordsPage);
        } catch {
          showToast("Failed to decline request.", "error");
        } finally {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleExportExcel = async () => {
    const targetExportId =
      role === "Admin" ? selectedEmployee : loggedInEmployeeId;
    if (targetExportId === "all") {
      showToast(
        "Please select a specific employee to export individual timesheet.",
        "error",
      );
      return;
    }

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
      showToast("Timesheet exported to .xlsx successfully!");
    } catch {
      showToast("Failed to export timesheet.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  const totalRequestsPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const paginatedRequests = useMemo(() => {
    const start = (requestsPage - 1) * ITEMS_PER_PAGE;
    return requests.slice(start, start + ITEMS_PER_PAGE);
  }, [requests, requestsPage]);

  const recordsColSpan = role === "Admin" && selectedEmployee === "all" ? 6 : 5;
  const requestsColSpan = role === "Admin" ? 6 : 5;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <Clock size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Attendance Timesheet
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review recorded work logs or file manual corrections for missed
                shifts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setRecordsPage(1);
                }}
                className="w-full sm:w-auto border border-slate-300 bg-white px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-(--primary) cursor-pointer"
              />
              {filterDate && (
                <button
                  onClick={() => {
                    setFilterDate("");
                    setRecordsPage(1);
                  }}
                  className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer border border-slate-200 shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={handleExportExcel}
              disabled={
                isExporting ||
                loadingData ||
                (role === "Admin" && selectedEmployee === "all")
              }
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Export
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (
                  role === "Admin" &&
                  employees.length > 0 &&
                  selectedEmployee === "all"
                ) {
                  setSelectedEmployee(String(employees[0].id));
                }
                setShowManualModal(true);
              }}
              disabled={loadingData}
              className="flex items-center gap-1.5 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <PlusCircle size={14} />
              {role === "Admin" ? "Add Record" : "File Missed"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-8 px-2">
          <button
            onClick={() => {
              setActiveTab("records");
              setRecordsPage(1);
            }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "records"
                ? "border-(--primary) text-amber-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Recorded Logs
          </button>
          <button
            onClick={() => {
              setActiveTab("requests");
              setRequestsPage(1);
            }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "requests"
                ? "border-(--primary) text-amber-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            {role === "Admin" ? "Pending Requests" : "My Requests"}
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Workspace Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {role === "Admin" && employees.length > 0 && (
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50">
              <div className="max-w-md">
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2 flex items-center gap-1.5">
                  <UserCheck size={13} className="text-slate-400" />
                  Select Employee
                </label>
                <div className="relative">
                  <select
                    value={selectedEmployee}
                    disabled={loadingData || isExporting}
                    onChange={(e) => {
                      setSelectedEmployee(e.target.value);
                      setRecordsPage(1);
                      setRequestsPage(1);
                    }}
                    className="w-full h-11 appearance-none border border-slate-300 bg-white px-3 pr-10 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 cursor-pointer"
                  >
                    <option value="all">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>
                        {emp.lastName}, {emp.firstName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          {activeTab === "records" ? (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {role === "Admin" && selectedEmployee === "all" && (
                      <th className="py-3.5 px-6">Employee</th>
                    )}
                    <th className="py-3.5 px-6">Log Type</th>
                    <th className="py-3.5 px-6">Date Logged</th>
                    <th className="py-3.5 px-6">Location</th>
                    <th className="py-3.5 px-6 text-right">Timestamp</th>
                    {role === "Admin" && (
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingData ? (
                    <tr>
                      <td
                        colSpan={recordsColSpan}
                        className="py-12 text-center text-slate-400"
                      >
                        <Loader2
                          size={22}
                          className="animate-spin text-amber-600 mx-auto mb-2"
                        />
                        <p className="text-xs font-semibold text-slate-500">
                          Loading time records...
                        </p>
                      </td>
                    </tr>
                  ) : records.length > 0 ? (
                    records.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {role === "Admin" && selectedEmployee === "all" && (
                          <td className="py-4 px-6 font-semibold text-slate-900 text-xs">
                            {record.employee
                              ? `${record.employee.lastName}, ${record.employee.firstName}`
                              : `ID: ${record.employeeId}`}
                          </td>
                        )}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                              record.type === "IN"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-amber-50 text-amber-700 border border-amber-200/60"
                            }`}
                          >
                            {record.type === "IN" ? (
                              <LogIn size={13} className="text-emerald-600" />
                            ) : (
                              <LogOut size={13} className="text-amber-600" />
                            )}
                            Time {record.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                          {new Date(
                            record.dateCreated || record.date,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <LocationCell
                            lat={record.latitude}
                            lon={record.longitude}
                          />
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-xs font-bold text-slate-900">
                          {new Date(
                            record.dateCreated || record.date,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                        {role === "Admin" && (
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() =>
                                triggerDeleteRecordModal(record.id)
                              }
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={recordsColSpan}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {role === "Admin" && (
                      <th className="py-3.5 px-6">Employee</th>
                    )}
                    <th className="py-3.5 px-6">Log Type</th>
                    <th className="py-3.5 px-6">Time Requested</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Date Filed</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingData ? (
                    <tr>
                      <td
                        colSpan={requestsColSpan}
                        className="py-12 text-center text-slate-400"
                      >
                        <Loader2
                          size={22}
                          className="animate-spin text-amber-600 mx-auto mb-2"
                        />
                        <p className="text-xs font-semibold text-slate-500">
                          Loading attendance requests...
                        </p>
                      </td>
                    </tr>
                  ) : paginatedRequests.length > 0 ? (
                    paginatedRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {role === "Admin" && (
                          <td className="py-4 px-6 font-semibold text-slate-900 text-xs">
                            {req.employee
                              ? `${req.employee.lastName}, ${req.employee.firstName}`
                              : `ID: ${req.employeeId}`}
                          </td>
                        )}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                              req.type === "IN"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-amber-50 text-amber-700 border border-amber-200/60"
                            }`}
                          >
                            {req.type === "IN" ? (
                              <LogIn size={13} className="text-emerald-600" />
                            ) : (
                              <LogOut size={13} className="text-amber-600" />
                            )}
                            Time {req.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs font-bold text-slate-900">
                          {new Date(req.targetDate).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                              req.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : req.status === "Declined"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/60"
                            }`}
                          >
                            {req.status === "Approved" ? (
                              <CheckCircle2 size={13} />
                            ) : req.status === "Declined" ? (
                              <XCircle size={13} />
                            ) : (
                              <AlertCircle size={13} />
                            )}
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 text-xs">
                          {new Date(req.dateRequested).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {role === "Admin" && req.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => triggerApproveModal(req.id)}
                                  className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-emerald-200/60"
                                >
                                  <CheckCircle size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => triggerDeclineModal(req.id)}
                                  className="text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-rose-200/60"
                                >
                                  <X size={14} /> Decline
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => triggerDeleteRequestModal(req.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={requestsColSpan}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        No attendance requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Card View */}
          {activeTab === "records" ? (
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
              {loadingData ? (
                <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400">
                  <Loader2
                    size={22}
                    className="animate-spin text-amber-600 mx-auto"
                  />
                </div>
              ) : records.length > 0 ? (
                records.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                      <div>
                        {role === "Admin" && selectedEmployee === "all" && (
                          <h3 className="font-bold text-slate-900 text-xs">
                            {record.employee
                              ? `${record.employee.lastName}, ${record.employee.firstName}`
                              : `ID: ${record.employeeId}`}
                          </h3>
                        )}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Date:{" "}
                          {new Date(
                            record.dateCreated || record.date,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      {role === "Admin" && (
                        <button
                          onClick={() => triggerDeleteRecordModal(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <LocationCell
                      lat={record.latitude}
                      lon={record.longitude}
                    />
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-50">
                      <span className="font-mono font-bold text-slate-700">
                        {new Date(
                          record.dateCreated || record.date,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          record.type === "IN"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        Time {record.type}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-400 text-xs">
                  No records found.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
              {loadingData ? (
                <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-400">
                  <Loader2
                    size={22}
                    className="animate-spin text-amber-600 mx-auto"
                  />
                </div>
              ) : paginatedRequests.length > 0 ? (
                paginatedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                      <div>
                        {role === "Admin" && (
                          <h3 className="font-bold text-slate-900 text-xs">
                            {req.employee
                              ? `${req.employee.lastName}, ${req.employee.firstName}`
                              : `ID: ${req.employeeId}`}
                          </h3>
                        )}
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          Requested Time:{" "}
                          <span className="font-bold text-slate-800">
                            {new Date(req.targetDate).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {role === "Admin" && req.status === "Pending" && (
                          <>
                            <button
                              onClick={() => triggerApproveModal(req.id)}
                              className="p-1.5 text-emerald-600 rounded-lg"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => triggerDeclineModal(req.id)}
                              className="p-1.5 text-rose-600 rounded-lg"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => triggerDeleteRequestModal(req.id)}
                          className="p-1.5 text-slate-400 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">
                        Time {req.type}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                          req.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : req.status === "Declined"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-400 text-xs">
                  No requests found.
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {activeTab === "records" && (
            <PaginationBar
              page={recordsPage}
              totalPages={totalRecordsPages}
              onPageChange={setRecordsPage}
            />
          )}
          {activeTab === "requests" && (
            <PaginationBar
              page={requestsPage}
              totalPages={totalRequestsPages}
              onPageChange={setRequestsPage}
            />
          )}
        </div>
      </div>

      <ManualModal
        isOpen={showManualModal}
        role={role}
        employees={employees}
        selectedEmployee={selectedEmployee}
        manualDate={manualDate}
        manualType={manualType}
        onClose={() => setShowManualModal(false)}
        onSubmit={handleManualSubmit}
        onEmployeeChange={setSelectedEmployee}
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
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
