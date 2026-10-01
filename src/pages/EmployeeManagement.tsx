import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Search,
  Users,
  Eye,
  Edit3,
  RotateCcw,
  CalendarX2,
  RotateCw,
  AlertCircle,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import EmployeeFormFields from "../components/employee/EmployeeFormFields";
import ViewEmployeeModal from "../components/employee/ViewEmployeeModal";
import PaginationBar from "../components/timesheet/PaginationBar";
import { FOCUS, ROW_BASE } from "../utils/uiConstants";
import {
  PersonCell,
  SkeletonRows,
  EmptyState,
  Chip,
  StatusBadge,
} from "../components/ListUI";
import type { Employee } from "../types/employee";

type TabFilter = "All" | "Admin" | "Staff";

const ITEMS_PER_PAGE = 10;
const TABS: TabFilter[] = ["All", "Admin", "Staff"];

const EMPLOYEE_GRID = "md:grid-cols-[minmax(0,1.2fr)_150px_130px_140px_216px]";

const initialFormState = {
  employeeIdNumber: "",
  username: "",
  password: "firefly123",
  mustChangePassword: true,
  isAdmin: false,
  firstName: "",
  lastName: "",
  middleName: "",
  dateOfBirth: "1995-01-01",
  age: 28,
  gender: "Male",
  civilStatus: "Single",
  currentAddress: "",
  permanentAddress: "",
  contactNumber: "",
  personalEmailAddress: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  relationToEmployee: "",
  emergencyContactAddress: "",
  jobTitle: "",
  employmentType: "Regular",
  officeType: "Admin",
  dateHired: new Date().toISOString(),
  declaredDateHired: new Date().toISOString(),
  dailySalary: 600,
  dailyAllowance: 100,
  bloodType: "O+",
  hasGovernmentDeductions: true,
  sssNumber: "",
  philHealthNumber: "",
  pagIbigNumber: "",
  deductionType: "Per Pay Period",
  photo: "",
  employmentStatus: "Active",
  maxLeaveHours: 40,
};

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmployeeData, setEditEmployeeData] = useState<Employee | null>(
    null,
  );
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [resetLeaveId, setResetLeaveId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [formData, setFormData] = useState(initialFormState);
  const navigate = useNavigate();

  const loggedInEmployeeId = localStorage.getItem("employeeId") || "";

  const showToast = useCallback(
    (text: string, type: "success" | "error" = "success") => {
      setToast({ text, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await api.get("/Employees");
      setEmployees(res.data);
    } catch {
      setEmployees([]);
      setLoadError(true);
      showToast("Failed to load employees.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await api.get("/Employees");
        if (isMounted) setEmployees(res.data);
      } catch {
        if (isMounted) {
          setEmployees([]);
          setLoadError(true);
          showToast("Failed to load employees.", "error");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/Employees", formData);
      setShowAddModal(false);
      setFormData(initialFormState);
      await loadEmployees();
      showToast("Successfully added new employee.");
    } catch {
      showToast("Failed to create employee.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployeeData) return;
    setIsSubmitting(true);
    try {
      await api.put(`/Employees/${editEmployeeData.id}`, editEmployeeData);
      setEditEmployeeData(null);
      await loadEmployees();
      showToast("Successfully updated employee record.");
    } catch {
      showToast("Failed to update employee record.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/Employees/${deleteId}`);
      setEmployees(employees.filter((emp) => emp.id !== deleteId));
      showToast("Successfully deleted employee.");
    } catch {
      showToast("Failed to delete employee.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const executeResetLeave = async () => {
    if (resetLeaveId === null) return;
    try {
      await api.post(`/Employees/${resetLeaveId}/reset-leave-balance`);
      showToast("Leave balance successfully reset.");
      await loadEmployees();
    } catch {
      showToast("Failed to reset leave balance.", "error");
    } finally {
      setResetLeaveId(null);
    }
  };

  const tabCounts: Record<TabFilter, number> = {
    All: employees.filter((emp) => emp.id.toString() !== loggedInEmployeeId)
      .length,
    Admin: employees.filter(
      (emp) => emp.id.toString() !== loggedInEmployeeId && emp.isAdmin,
    ).length,
    Staff: employees.filter(
      (emp) => emp.id.toString() !== loggedInEmployeeId && !emp.isAdmin,
    ).length,
  };

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        if (emp.id.toString() === loggedInEmployeeId) return false;

        const query = searchQuery.toLowerCase();
        const matchesSearch =
          emp.firstName.toLowerCase().includes(query) ||
          emp.lastName.toLowerCase().includes(query) ||
          emp.username.toLowerCase().includes(query) ||
          emp.employeeIdNumber.toLowerCase().includes(query) ||
          emp.jobTitle.toLowerCase().includes(query);

        if (!matchesSearch) return false;
        if (activeTab === "Admin") return emp.isAdmin;
        if (activeTab === "Staff") return !emp.isAdmin;
        return true;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [employees, searchQuery, activeTab, loggedInEmployeeId]);

  const calculatedTotalPages = Math.ceil(
    filteredEmployees.length / ITEMS_PER_PAGE,
  );
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const changePage = (p: number) => {
    setCurrentPage(p);
    document
      .getElementById("employee-directory-card")
      ?.scrollIntoView({ block: "start" });
  };

  const fileButton = (
    <button
      onClick={() => setShowAddModal(true)}
      disabled={loading}
      className={`flex h-10 items-center justify-center gap-1.5 rounded-lg bg-(--primary) px-4 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-(--primary-hover) cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <Plus size={16} />
      Add employee
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className={`p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer shrink-0`}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
            <Users size={19} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Employee directory
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage organization staff records, roles, and leave balances.
            </p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
          {fileButton}
        </div>
      </div>

      {/* Card */}
      <section
        id="employee-directory-card"
        className="scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Filters & Search */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-slate-200 bg-slate-50/50 p-4 sm:px-5">
          <div className="w-full sm:w-72">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Search size={13} className="text-slate-400" />
              Search staff
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, ID, or title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={`h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 ${FOCUS}`}
              />
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">
              Role view
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((tab) => (
                <Chip
                  key={tab}
                  active={activeTab === tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                >
                  {tab}
                  <span className="ml-1.5 font-normal text-slate-400">
                    {tabCounts[tab]}
                  </span>
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <SkeletonRows />
        ) : loadError ? (
          <EmptyState
            icon={<AlertCircle size={20} />}
            title="Couldn't load employees"
            text="Check your connection and try again."
            action={
              <button
                onClick={loadEmployees}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${FOCUS}`}
              >
                <RotateCw size={13} />
                Try again
              </button>
            }
          />
        ) : paginatedEmployees.length === 0 ? (
          <EmptyState
            icon={<CalendarX2 size={20} />}
            title={
              searchQuery
                ? "No matching staff found"
                : activeTab === "All"
                  ? "No employees registered yet"
                  : `No ${activeTab.toLowerCase()} accounts found`
            }
            text={
              searchQuery
                ? "Try adjusting your search criteria."
                : "Staff members you add will show up here."
            }
            action={
              searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${FOCUS}`}
                >
                  Clear search
                </button>
              ) : (
                fileButton
              )
            }
          />
        ) : (
          <>
            <div
              className={`hidden border-b border-slate-200 px-5 py-2.5 text-xs font-medium text-slate-500 md:grid md:gap-x-4 ${EMPLOYEE_GRID}`}
            >
              <span>Employee / ID</span>
              <span>Job title</span>
              <span>Leave balance</span>
              <span>Status</span>
              <span className="sr-only">Actions</span>
            </div>

            <ul className="divide-y divide-slate-100">
              {paginatedEmployees.map((emp) => {
                const fullName = `${emp.lastName}, ${emp.firstName}`;
                return (
                  <li
                    key={emp.id}
                    onClick={() => setViewEmployee(emp)}
                    className={`relative px-5 py-3 transition-colors hover:bg-slate-50/70 cursor-pointer ${ROW_BASE} ${EMPLOYEE_GRID}`}
                  >
                    <div className="w-full min-w-0 md:w-auto flex items-center gap-3">
                      <div>
                        <PersonCell name={fullName} />
                        <span className="font-mono text-[11px] text-slate-400 block">
                          ID: {emp.employeeIdNumber} • @{emp.username}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-medium text-slate-700 self-center">
                      {emp.jobTitle || "N/A"}
                    </span>

                    <span className="text-xs font-semibold tabular-nums text-slate-900 self-center">
                      <span className="font-bold">
                        {emp.remainingLeaveHours}
                      </span>{" "}
                      / {emp.maxLeaveHours} hrs
                    </span>

                    <div className="self-center">
                      <StatusBadge status={emp.isAdmin ? "Admin" : "Staff"} />
                    </div>

                    <div
                      className="flex w-full items-center justify-end gap-1.5 md:w-auto self-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setResetLeaveId(emp.id)}
                        aria-label="Reset leave balance"
                        className={`rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700 cursor-pointer ${FOCUS}`}
                        title="Reset Leave Balance"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => setViewEmployee(emp)}
                        aria-label="View profile"
                        className={`rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700 cursor-pointer ${FOCUS}`}
                        title="View Profile"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setEditEmployeeData(emp)}
                        aria-label="Edit record"
                        className={`rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 cursor-pointer ${FOCUS}`}
                        title="Edit Record"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(emp.id)}
                        aria-label="Delete record"
                        className={`rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer ${FOCUS}`}
                        title="Delete Record"
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

        {!loading && (
          <PaginationBar
            page={currentPage}
            totalPages={calculatedTotalPages}
            onPageChange={changePage}
          />
        )}
      </section>

      {/* View Modal */}
      <ViewEmployeeModal
        employee={viewEmployee}
        onClose={() => setViewEmployee(null)}
        onEdit={(emp) => {
          setViewEmployee(null);
          setEditEmployeeData(emp);
        }}
      />

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white p-4 sm:p-5">
              <h2 className="text-base font-bold text-slate-900">
                Register new employee
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleCreate}
              className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
            >
              <EmployeeFormFields
                formData={formData}
                setFormData={setFormData}
                isSubmitting={isSubmitting}
              />
            </form>
            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className={`rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 ${FOCUS}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreate}
                disabled={isSubmitting}
                className={`flex items-center gap-2 rounded-xl bg-(--primary) px-4 py-2 font-semibold text-slate-950 shadow-sm hover:bg-(--primary-hover) cursor-pointer disabled:opacity-50 active:scale-[0.98] ${FOCUS}`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editEmployeeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white p-4 sm:p-5">
              <h2 className="text-base font-bold text-slate-900">
                Edit employee record
              </h2>
              <button
                onClick={() => setEditEmployeeData(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleUpdate}
              className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
            >
              <EmployeeFormFields
                formData={editEmployeeData}
                setFormData={(
                  value: Employee | ((prev: Employee) => Employee),
                ) =>
                  setEditEmployeeData((prev) =>
                    prev
                      ? typeof value === "function"
                        ? value(prev)
                        : value
                      : null,
                  )
                }
                isSubmitting={isSubmitting}
              />
            </form>
            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setEditEmployeeData(null)}
                disabled={isSubmitting}
                className={`rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 ${FOCUS}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleUpdate}
                disabled={isSubmitting}
                className={`flex items-center gap-2 rounded-xl bg-(--primary) px-4 py-2 font-semibold text-slate-950 shadow-sm hover:bg-(--primary-hover) cursor-pointer disabled:opacity-50 active:scale-[0.98] ${FOCUS}`}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Toast */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete employee"
        message="Are you sure you want to delete this employee record?"
        confirmText="Delete"
        type="danger"
        onConfirm={executeDelete}
        onClose={() => setDeleteId(null)}
      />

      <ConfirmModal
        isOpen={resetLeaveId !== null}
        title="Reset leave balance"
        message="Are you sure you want to reset this employee's leave balance back to the maximum limit? All past leave records will be preserved for history."
        confirmText="Reset balance"
        type="primary"
        onConfirm={executeResetLeave}
        onClose={() => setResetLeaveId(null)}
      />

      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
