import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Clock,
  PlusCircle,
  CheckCircle,
  X,
  ShieldCheck,
  Trash2,
  LogIn,
  LogOut,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  UserCheck,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  XCircle,
} from "lucide-react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

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
  type: string;
  date: string;
  dateCreated: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

const ITEMS_PER_PAGE = 10;

export default function Timesheet() {
  const [activeTab, setActiveTab] = useState<"records" | "requests">("records");
  const [records, setRecords] = useState<TimeRecordItem[]>([]);
  const [requests, setRequests] = useState<AttendanceRequestItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualType, setManualType] = useState("IN");

  // Filter & Date States
  const [filterDate, setFilterDate] = useState<string>("");

  // Loading States
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Pagination States
  const [recordsPage, setRecordsPage] = useState<number>(1);
  const [requestsPage, setRequestsPage] = useState<number>(1);

  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "";
  const [selectedEmployee, setSelectedEmployee] =
    useState<string>(loggedInEmployeeId);

  // Modal & Toast States
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

  // Core data fetch function used by event handlers and initializers
  const fetchTimesheetData = useCallback(
    async (targetId: string, dateFilter: string) => {
      if (!targetId) {
        setRecords([]);
        setRequests([]);
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      try {
        const recordsEndpoint = dateFilter
          ? `/TimeRecords/employee/${targetId}?date=${dateFilter}`
          : `/TimeRecords/employee/${targetId}`;

        const res = await api.get(recordsEndpoint);
        setRecords(res.data || []);
      } catch {
        setRecords([]);
      }

      try {
        const reqEndpoint =
          role === "Admin"
            ? "/AttendanceRequests"
            : `/AttendanceRequests/employee/${targetId}`;
        const reqRes = await api.get(reqEndpoint);
        setRequests(reqRes.data || []);
      } catch {
        setRequests([]);
      } finally {
        setLoadingData(false);
      }
    },
    [role],
  );

  // Initial load and employee list fetch for Admin
  useEffect(() => {
    let isMounted = true;

    const initLoad = async () => {
      if (role === "Admin") {
        try {
          const res = await api.get("/Employees");
          if (!isMounted) return;

          setEmployees(res.data);
          if (res.data.length > 0) {
            const currentSelected =
              selectedEmployee || res.data[0].id.toString();
            if (!selectedEmployee) {
              setSelectedEmployee(currentSelected);
            }
            await fetchTimesheetData(currentSelected, filterDate);
          } else {
            setLoadingData(false);
          }
        } catch {
          if (isMounted) setLoadingData(false);
        }
      } else if (loggedInEmployeeId) {
        await fetchTimesheetData(loggedInEmployeeId, filterDate);
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
      onConfirm: () => executeDeleteRecord(id),
    });
  };

  const executeDeleteRecord = async (id: number) => {
    try {
      await api.delete(`/TimeRecords/${id}`);
      showToast("Time record deleted successfully.");
      const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;
      fetchTimesheetData(targetId, filterDate);
    } catch {
      showToast("Failed to delete time record.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const triggerDeleteRequestModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Attendance Request",
      message:
        "Are you sure you want to delete this attendance correction request? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: () => executeDeleteRequest(id),
    });
  };

  const executeDeleteRequest = async (id: number) => {
    try {
      await api.delete(`/AttendanceRequests/${id}`);
      showToast("Attendance request deleted successfully.");
      const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;
      fetchTimesheetData(targetId, filterDate);
    } catch {
      showToast("Failed to delete request.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;
    if (!manualDate || !targetId) return;

    const [selectedDateStr, selectedTimeStr] = manualDate.split("T");

    const getFormattedRecordDateStr = (rawDate: string) => {
      const d = new Date(rawDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const existingLog = records.find((rec) => {
      const recDateStr = getFormattedRecordDateStr(rec.dateCreated || rec.date);
      return recDateStr === selectedDateStr && rec.type === manualType;
    });

    if (existingLog) {
      showToast(
        `A Time ${manualType} record already exists for ${selectedDateStr}. An Admin must first delete the existing record before a new entry can be made.`,
        "error",
      );
      return;
    }

    const targetDateTime = new Date(
      `${selectedDateStr}T${selectedTimeStr || "00:00"}`,
    );

    const existingInRecord = records.find((rec) => {
      const recDateStr = getFormattedRecordDateStr(rec.dateCreated || rec.date);
      return recDateStr === selectedDateStr && rec.type === "IN";
    });

    const existingOutRecord = records.find((rec) => {
      const recDateStr = getFormattedRecordDateStr(rec.dateCreated || rec.date);
      return recDateStr === selectedDateStr && rec.type === "OUT";
    });

    if (manualType === "OUT" && existingInRecord) {
      const inTime = new Date(
        existingInRecord.dateCreated || existingInRecord.date,
      );
      if (targetDateTime <= inTime) {
        showToast(
          `Time OUT must be later than Time IN (${inTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}).`,
          "error",
        );
        return;
      }
    }

    if (manualType === "IN" && existingOutRecord) {
      const outTime = new Date(
        existingOutRecord.dateCreated || existingOutRecord.date,
      );
      if (targetDateTime >= outTime) {
        showToast(
          `Time IN must be earlier than Time OUT (${outTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}).`,
          "error",
        );
        return;
      }
    }

    const targetIso = targetDateTime.toISOString();

    try {
      if (role === "Admin") {
        await api.post("/TimeRecords/time-in-out", {
          employeeId: Number(targetId),
          type: manualType,
          dateCreated: targetIso,
        });
        showToast("Attendance record added successfully!");
      } else {
        await api.post("/AttendanceRequests", {
          employeeId: Number(targetId),
          type: manualType,
          targetDate: targetIso,
        });
        showToast("Missed attendance request submitted successfully!");
      }
      setShowManualModal(false);
      setManualDate("");
      fetchTimesheetData(targetId, filterDate);
    } catch (err: unknown) {
      const errorResponse = (err as { response?: { data?: string } })?.response
        ?.data;
      const errorMsg =
        typeof errorResponse === "string"
          ? errorResponse
          : "Failed to process attendance entry.";
      showToast(errorMsg, "error");
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
      onConfirm: () => executeApprove(id),
    });
  };

  const executeApprove = async (id: number) => {
    try {
      await api.put(`/AttendanceRequests/${id}/approve`);
      showToast("Attendance request approved and logged!");
      const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;
      fetchTimesheetData(targetId, filterDate);
    } catch (err: unknown) {
      const errorResponse = (err as { response?: { data?: string } })?.response
        ?.data;
      const errorMsg =
        typeof errorResponse === "string"
          ? errorResponse
          : "Failed to approve request.";
      showToast(errorMsg, "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const triggerDeclineModal = (id: number) => {
    setModalConfig({
      isOpen: true,
      title: "Decline Attendance Request",
      message:
        "Are you sure you want to decline this missed attendance request?",
      confirmText: "Decline",
      type: "danger",
      onConfirm: () => executeDecline(id),
    });
  };

  const executeDecline = async (id: number) => {
    try {
      await api.put(`/AttendanceRequests/${id}/reject`);
      showToast("Attendance request declined successfully.");
      const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;
      fetchTimesheetData(targetId, filterDate);
    } catch {
      showToast("Failed to decline request.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleExportExcel = async () => {
    const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;
    if (!targetId) return;

    setIsExporting(true);
    try {
      const response = await api.get(
        `/TimeRecords/export/employee/${targetId}`,
        {
          responseType: "blob",
        },
      );

      const activeEmp = employees.find((e) => e.id.toString() === targetId);
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

  const totalRecordsPages = Math.ceil(records.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const start = (recordsPage - 1) * ITEMS_PER_PAGE;
    return records.slice(start, start + ITEMS_PER_PAGE);
  }, [records, recordsPage]);

  const totalRequestsPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const paginatedRequests = useMemo(() => {
    const start = (requestsPage - 1) * ITEMS_PER_PAGE;
    return requests.slice(start, start + ITEMS_PER_PAGE);
  }, [requests, requestsPage]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
              <Clock size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Attendance Timesheet
            </h1>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Review recorded work logs or file manual corrections for missed
            shifts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-nowrap">
          {/* Date Filter Picker */}
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setRecordsPage(1);
              }}
              className="border border-slate-200 bg-slate-50 hover:bg-slate-100/80 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-(--primary) focus:bg-white cursor-pointer"
              title="Filter by Date"
            />
            {filterDate && (
              <button
                onClick={() => {
                  setFilterDate("");
                  setRecordsPage(1);
                }}
                className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer border border-slate-200"
                title="Clear date filter"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {role === "Admin" && employees.length > 0 && (
            <div className="relative w-48 shrink-0">
              <select
                value={selectedEmployee}
                disabled={loadingData || isExporting}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  setRecordsPage(1);
                  setRequestsPage(1);
                }}
                className="w-full appearance-none border border-slate-200 bg-slate-50 hover:bg-slate-100/80 px-3 py-2 pr-8 rounded-xl text-xs font-semibold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-(--primary) focus:bg-white disabled:opacity-50 cursor-pointer truncate"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.lastName}, {emp.firstName}
                  </option>
                ))}
              </select>
              <UserCheck
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          )}

          <button
            onClick={handleExportExcel}
            disabled={isExporting || loadingData}
            className="flex items-center gap-1.5 bg-green-900 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 active:scale-[0.98] disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={14} />
                Export Excel
              </>
            )}
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            disabled={loadingData}
            className="flex items-center gap-1.5 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
          >
            <PlusCircle size={14} />
            {role === "Admin" ? "Add Record" : "File Missed"}
          </button>
        </div>
      </div>

      {/* Tabs for Requests vs Records */}
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

      {/* Timesheet Data Table */}
      {activeTab === "records" ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-125">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Log Type</th>
                    <th className="py-3.5 px-5">Date Logged</th>
                    <th className="py-3.5 px-5 text-right">Timestamp</th>
                    {role === "Admin" && (
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingData ? (
                    <tr>
                      <td
                        colSpan={role === "Admin" ? 4 : 3}
                        className="py-12 text-center text-slate-400"
                      >
                        <Loader2
                          size={24}
                          className="animate-spin text-amber-600 mx-auto mb-2"
                        />
                        <p className="text-xs font-semibold text-slate-500">
                          Loading time records...
                        </p>
                      </td>
                    </tr>
                  ) : paginatedRecords.length > 0 ? (
                    paginatedRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
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
                        <td className="py-4 px-5 text-slate-700 font-medium">
                          <div className="flex items-center gap-2">
                            <CalendarDays
                              size={14}
                              className="text-slate-400"
                            />
                            {new Date(
                              record.dateCreated || record.date,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right font-mono text-xs font-bold text-slate-900">
                          {new Date(
                            record.dateCreated || record.date,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                        {role === "Admin" && (
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() =>
                                triggerDeleteRecordModal(record.id)
                              }
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center justify-end"
                              title="Delete Record"
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
                        colSpan={role === "Admin" ? 4 : 3}
                        className="py-12 px-4 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                          <Clock size={32} strokeWidth={1.5} />
                          <p className="text-sm font-semibold text-slate-600">
                            No attendance records found
                          </p>
                          <p className="text-xs text-slate-400">
                            {filterDate
                              ? `No records found for ${filterDate}`
                              : "Time IN and Time OUT logs will appear here."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Records Pagination Controls */}
          {!loadingData && totalRecordsPages > 1 && (
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>
                Page {recordsPage} of {totalRecordsPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setRecordsPage((p) => Math.max(1, p - 1))}
                  disabled={recordsPage === 1}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setRecordsPage((p) => Math.min(totalRecordsPages, p + 1))
                  }
                  disabled={recordsPage === totalRecordsPages}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-150">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    {role === "Admin" && (
                      <th className="py-3.5 px-5">Employee</th>
                    )}
                    <th className="py-3.5 px-5">Log Type</th>
                    <th className="py-3.5 px-5">Target Date</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingData ? (
                    <tr>
                      <td
                        colSpan={role === "Admin" ? 5 : 4}
                        className="py-12 text-center text-slate-400"
                      >
                        <Loader2
                          size={24}
                          className="animate-spin text-blue-600 mx-auto mb-2"
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
                          <td className="py-4 px-5 font-semibold text-slate-900">
                            {req.employee
                              ? `${req.employee.lastName}, ${req.employee.firstName}`
                              : `ID: ${req.employeeId}`}
                          </td>
                        )}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
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
                        <td className="py-4 px-5 text-slate-700 font-medium">
                          {new Date(req.targetDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
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
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {role === "Admin" && req.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => triggerApproveModal(req.id)}
                                  className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-emerald-200/60"
                                  title="Approve Request"
                                >
                                  <CheckCircle size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => triggerDeclineModal(req.id)}
                                  className="text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold border border-rose-200/60"
                                  title="Decline Request"
                                >
                                  <X size={14} /> Decline
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => triggerDeleteRequestModal(req.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Request"
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
                        colSpan={role === "Admin" ? 5 : 4}
                        className="py-12 px-4 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                          <AlertCircle size={32} strokeWidth={1.5} />
                          <p className="text-sm font-semibold text-slate-600">
                            No attendance requests found
                          </p>
                          <p className="text-xs text-slate-400">
                            Attendance correction requests will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Requests Pagination Controls */}
          {!loadingData && totalRequestsPages > 1 && (
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>
                Page {requestsPage} of {totalRequestsPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setRequestsPage((p) => Math.max(1, p - 1))}
                  disabled={requestsPage === 1}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setRequestsPage((p) => Math.min(totalRequestsPages, p + 1))
                  }
                  disabled={requestsPage === totalRequestsPages}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Input / Request Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                {role === "Admin"
                  ? "Direct Administrative Input"
                  : "File Attendance Correction"}
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Log Type
                </label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-(--primary) cursor-pointer"
                >
                  <option value="IN">Time IN</option>
                  <option value="OUT">Time OUT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Target Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary) cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification */}
      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
