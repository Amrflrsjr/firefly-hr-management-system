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
  UserCheck,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  XCircle,
  MapPin,
  ChevronDown,
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
}

const ITEMS_PER_PAGE = 5;

// Haversine formula to calculate distance in meters from Firefly Crafts PH shop pin
function calculateShopDistance(lat: number, lon: number): number {
  if (!lat || !lon || (lat === 0 && lon === 0)) return -1;

  const shopLat = 10.3685651;
  const shopLon = 123.9304048;
  const earthRadiusMeters = 6371e3;

  const toRad = (angle: number) => (angle * Math.PI) / 180.0;
  const dLat = toRad(lat - shopLat);
  const dLon = toRad(lon - shopLon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(shopLat)) *
      Math.cos(toRad(lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

const addressCache: Record<string, string> = {};

function LocationCell({ lat, lon }: { lat: number; lon: number }) {
  const isNoGps = !lat || !lon || (lat === 0 && lon === 0);
  const cacheKey = isNoGps ? "" : `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cachedAddress = cacheKey ? addressCache[cacheKey] : undefined;

  const [address, setAddress] = useState<string>(
    isNoGps ? "Shop / PC (No GPS)" : cachedAddress || "Loading location...",
  );
  const [loading, setLoading] = useState<boolean>(!isNoGps && !cachedAddress);

  const distanceMeters = calculateShopDistance(lat, lon);
  const isAtShop = distanceMeters >= 0 && distanceMeters <= 150;

  useEffect(() => {
    if (isNoGps || cachedAddress) {
      return;
    }

    let isMounted = true;
    const fetchAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await response.json();
        if (!isMounted) return;

        if (data && data.address) {
          const addr = data.address;
          const street = addr.road || addr.suburb || addr.neighbourhood || "";
          const city = addr.city || addr.municipality || addr.town || "Mandaue";
          const formatted = street
            ? `${street}, ${city}`
            : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

          addressCache[cacheKey] = formatted;
          setAddress(formatted);
        } else {
          setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
      } catch {
        if (isMounted) setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAddress();

    return () => {
      isMounted = false;
    };
  }, [lat, lon, isNoGps, cachedAddress, cacheKey]);

  return (
    <div
      className="flex flex-col gap-0.5 max-w-xs"
      title={`Lat: ${lat}, Lon: ${lon}`}
    >
      <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
        <MapPin size={13} className="text-amber-700 shrink-0" />
        <span className="truncate">{loading ? "Resolving..." : address}</span>
      </div>

      <div className="flex items-center gap-1.5 pl-4">
        {isNoGps ? (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
            Office Network / PC
          </span>
        ) : isAtShop ? (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            At Shop (~{Math.round(distanceMeters)}m)
          </span>
        ) : (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            Location (~
            {Math.round(
              distanceMeters >= 1000 ? distanceMeters / 1000 : distanceMeters,
            )}
            {distanceMeters >= 1000 ? "km" : "m"} away)
          </span>
        )}
      </div>
    </div>
  );
}

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
    async (targetId: string, dateFilter: string) => {
      setLoadingData(true);
      const effectiveId = role === "Admin" ? targetId : loggedInEmployeeId;

      try {
        let recordsEndpoint = "/TimeRecords";

        if (effectiveId && effectiveId !== "all") {
          recordsEndpoint = dateFilter
            ? `/TimeRecords/employee/${effectiveId}?date=${dateFilter}`
            : `/TimeRecords/employee/${effectiveId}`;
        } else {
          recordsEndpoint = dateFilter
            ? `/TimeRecords?date=${dateFilter}`
            : `/TimeRecords`;
        }

        const res = await api.get(recordsEndpoint);
        setRecords(res.data || []);
      } catch {
        setRecords([]);
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

          setEmployees(res.data);
          const currentSelected = selectedEmployee || "all";
          await fetchTimesheetData(currentSelected, filterDate);
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
      fetchTimesheetData(selectedEmployee, filterDate);
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
      fetchTimesheetData(selectedEmployee, filterDate);
    } catch {
      showToast("Failed to delete request.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
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

    const getFormattedRecordDateStr = (rawDate: string) => {
      const d = new Date(rawDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const existingLog = records.find((rec) => {
      const recDateStr = getFormattedRecordDateStr(rec.dateCreated || rec.date);
      return (
        recDateStr === selectedDateStr &&
        rec.type === manualType &&
        rec.employeeId.toString() === targetId
      );
    });

    if (existingLog) {
      showToast(
        `A Time ${manualType} record already exists for this employee on ${selectedDateStr}.`,
        "error",
      );
      return;
    }

    const targetDateTime = new Date(
      `${selectedDateStr}T${selectedTimeStr || "00:00"}`,
    );
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
      fetchTimesheetData(selectedEmployee, filterDate);
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
      fetchTimesheetData(selectedEmployee, filterDate);
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
      fetchTimesheetData(selectedEmployee, filterDate);
    } catch {
      showToast("Failed to decline request.", "error");
    } finally {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
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
        {
          responseType: "blob",
        },
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

  const recordsColSpan = role === "Admin" && selectedEmployee === "all" ? 6 : 5;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Page Header */}
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

          {/* Header Action Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Date Filter Picker */}
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setRecordsPage(1);
                }}
                className="w-full sm:w-auto border border-slate-300 bg-white px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-(--primary) cursor-pointer"
                title="Filter by Date"
              />
              {filterDate && (
                <button
                  onClick={() => {
                    setFilterDate("");
                    setRecordsPage(1);
                  }}
                  className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer border border-slate-200 shrink-0"
                  title="Clear date filter"
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
              title={
                role === "Admin" && selectedEmployee === "all"
                  ? "Select an employee to export"
                  : "Export Excel"
              }
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

        {/* Tabs for Recorded Logs vs Requests */}
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

        {/* Main Workspace Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Employee Selection Bar (For Admins) */}
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
                      const val = e.target.value;
                      setSelectedEmployee(val);
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
                  ) : paginatedRecords.length > 0 ? (
                    paginatedRecords.map((record) => (
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
                          <div className="mt-1">
                            {record.isRequested ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                                Filed Request / Correction
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                Direct Clock-In
                              </span>
                            )}
                          </div>
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
                    <th className="py-3.5 px-6">Target Date</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
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
                        <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                          {new Date(req.targetDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
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
                        <td className="py-4 px-6 text-right">
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
                <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 space-y-2">
                  <Loader2
                    size={22}
                    className="animate-spin text-amber-600 mx-auto"
                  />
                  <p className="text-xs font-semibold text-slate-500">
                    Loading time cards...
                  </p>
                </div>
              ) : paginatedRecords.length > 0 ? (
                paginatedRecords.map((record) => (
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
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <LocationCell
                        lat={record.latitude}
                        lon={record.longitude}
                      />
                    </div>
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
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        Time {record.type}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                  No attendance records found.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
              {loadingData ? (
                <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 space-y-2">
                  <Loader2
                    size={22}
                    className="animate-spin text-amber-600 mx-auto"
                  />
                  <p className="text-xs font-semibold text-slate-500">
                    Loading request cards...
                  </p>
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
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Target Date:{" "}
                          {new Date(req.targetDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {role === "Admin" && req.status === "Pending" && (
                          <>
                            <button
                              onClick={() => triggerApproveModal(req.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => triggerDeclineModal(req.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => triggerDeleteRequestModal(req.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : req.status === "Declined"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                  No attendance requests found.
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls Footer */}
          {activeTab === "records" && totalRecordsPages > 1 && (
            <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>
                Page {recordsPage} of {totalRecordsPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setRecordsPage((p) => Math.max(1, p - 1))}
                  disabled={recordsPage === 1}
                  className="p-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() =>
                    setRecordsPage((p) => Math.min(totalRecordsPages, p + 1))
                  }
                  disabled={recordsPage === totalRecordsPages}
                  className="p-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {activeTab === "requests" && totalRequestsPages > 1 && (
            <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>
                Page {requestsPage} of {totalRequestsPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setRequestsPage((p) => Math.max(1, p - 1))}
                  disabled={requestsPage === 1}
                  className="p-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() =>
                    setRequestsPage((p) => Math.min(totalRequestsPages, p + 1))
                  }
                  disabled={requestsPage === totalRequestsPages}
                  className="p-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Input / Request Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-700" />
                {role === "Admin"
                  ? "Direct Administrative Input"
                  : "File Attendance Correction"}
              </h2>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              {role === "Admin" && employees.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Select Employee
                  </label>
                  <select
                    value={
                      selectedEmployee === "all"
                        ? employees[0]?.id
                        : selectedEmployee
                    }
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold cursor-pointer"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.lastName}, {emp.firstName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Log Type
                </label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  <option value="IN">Time IN</option>
                  <option value="OUT">Time OUT</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Target Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
