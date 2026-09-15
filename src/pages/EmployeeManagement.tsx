import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  ShieldCheck,
  Search,
  Users,
  Loader2,
  UserCheck,
  User,
  Eye,
  IdCard,
  Building2,
  Briefcase,
  DollarSign,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

interface Employee {
  id: number;
  employeeIdNumber: string;
  username: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  employmentType: string;
  officeType: string;
  dailySalary: number;
  monthlyAllowance: number;
  isAdmin: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "staff">(
    "all",
  );
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [formData, setFormData] = useState({
    employeeIdNumber: "",
    username: "",
    firstName: "",
    lastName: "",
    middleName: "",
    jobTitle: "",
    employmentType: "Regular",
    officeType: "Admin",
    dailySalary: 600,
    monthlyAllowance: 1000,
    deductionType: "Per Pay Period",
    isAdmin: false,
  });
  const navigate = useNavigate();

  const showToast = useCallback(
    (text: string, type: "success" | "error" = "success") => {
      setToast({ text, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/Employees");
      setEmployees(res.data);
    } catch {
      showToast("Failed to load employees.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;

    api
      .get("/Employees")
      .then((res) => {
        if (isMounted) {
          setEmployees(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          showToast("Failed to load employees.", "error");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/Employees", {
        ...formData,
        dateOfBirth: new Date().toISOString(),
        dateHired: new Date().toISOString(),
        declaredDateHired: new Date().toISOString(),
        employmentStatus: "Active",
      });
      setShowAddModal(false);
      setFormData({
        employeeIdNumber: "",
        username: "",
        firstName: "",
        lastName: "",
        middleName: "",
        jobTitle: "",
        employmentType: "Regular",
        officeType: "Admin",
        dailySalary: 600,
        monthlyAllowance: 1000,
        deductionType: "Per Pay Period",
        isAdmin: false,
      });
      await loadEmployees();
      showToast("Successfully added new employee.");
    } catch {
      showToast("Failed to create employee.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    try {
      await api.delete(`/Employees/${deleteId}`);
      setEmployees(employees.filter((emp) => emp.id !== deleteId));
      showToast("Successfully deleted employee.");
    } catch {
      showToast("Failed to delete employee. Admin rights required.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        emp.firstName.toLowerCase().includes(query) ||
        emp.lastName.toLowerCase().includes(query) ||
        emp.username.toLowerCase().includes(query) ||
        emp.employeeIdNumber.toLowerCase().includes(query) ||
        emp.jobTitle.toLowerCase().includes(query);

      if (filterRole === "admin") return matchesSearch && emp.isAdmin;
      if (filterRole === "staff") return matchesSearch && !emp.isAdmin;
      return matchesSearch;
    });
  }, [employees, searchQuery, filterRole]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
                <Users size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Employee Directory
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Manage organization staff records, roles, and access credentials.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center active:scale-[0.98]"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search staff, ID, or title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary)"
          />
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <button
            onClick={() => {
              setFilterRole("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterRole === "all"
                ? "bg-(--primary) text-slate-950 shadow-xs font-bold"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            All ({employees.length})
          </button>
          <button
            onClick={() => {
              setFilterRole("admin");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterRole === "admin"
                ? "bg-(--primary) text-slate-950 shadow-xs font-bold"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Admins ({employees.filter((e) => e.isAdmin).length})
          </button>
          <button
            onClick={() => {
              setFilterRole("staff");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterRole === "staff"
                ? "bg-(--primary) text-slate-950 shadow-xs font-bold"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Staff ({employees.filter((e) => !e.isAdmin).length})
          </button>
        </div>
      </div>

      {/* Directory Table (Desktop & Tablet) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5">Employee ID / User</th>
                <th className="py-3.5 px-5">Full Name</th>
                <th className="py-3.5 px-5">Job Title</th>
                <th className="py-3.5 px-5">Employment</th>
                <th className="py-3.5 px-5">Access Role</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2
                        size={24}
                        className="animate-spin text-amber-600"
                      />
                      <p className="text-xs font-semibold text-slate-500">
                        Loading directory...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => setViewEmployee(emp)}
                  >
                    <td className="py-4 px-5">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {emp.employeeIdNumber}
                      </span>
                      <p className="text-[11px] font-semibold mt-1">
                        @{emp.username || "N/A"}
                      </p>
                    </td>

                    <td className="py-4 px-5 font-bold text-slate-900">
                      {emp.lastName}, {emp.firstName}
                    </td>

                    <td className="py-4 px-5 text-slate-600 font-medium text-xs">
                      {emp.jobTitle}
                    </td>

                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                        {emp.employmentType}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      {emp.isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200/60">
                          <ShieldCheck size={13} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200/60">
                          <User size={13} className="text-slate-400" /> Employee
                        </span>
                      )}
                    </td>

                    <td
                      className="py-4 px-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewEmployee(emp)}
                          className="text-slate-400 p-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                          title="View Profile Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(emp.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users size={32} strokeWidth={1.5} />
                      <p className="text-sm font-semibold text-slate-600">
                        No employees found
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Directory Card Grid */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
            <Loader2
              size={24}
              className="animate-spin text-amber-600 mx-auto"
            />
            <p className="text-xs font-semibold text-slate-500">
              Loading staff cards...
            </p>
          </div>
        ) : paginatedEmployees.length > 0 ? (
          paginatedEmployees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setViewEmployee(emp)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 cursor-pointer"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-(--primary) font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {emp.firstName[0]}
                    {emp.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {emp.lastName}, {emp.firstName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {emp.jobTitle}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setViewEmployee(emp)}
                    className="text-slate-400 p-1.5 rounded-lg hover:bg-amber-50"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(emp.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 block w-fit">
                    {emp.employeeIdNumber}
                  </span>
                  <span className="text-[11px] font-semibold block">
                    @{emp.username}
                  </span>
                </div>

                <div>
                  {emp.isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200/60">
                      <ShieldCheck size={12} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                      Employee
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
            <Users size={32} strokeWidth={1.5} className="mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              No matching staff records
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* VIEW EMPLOYEE DETAILS MODAL */}
      {viewEmployee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-6 border border-slate-200 shadow-xl">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-(--primary) font-bold text-lg flex items-center justify-center shadow-md shrink-0">
                  {viewEmployee.firstName[0]}
                  {viewEmployee.lastName[0]}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {viewEmployee.firstName} {viewEmployee.lastName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {viewEmployee.jobTitle}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Employee Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <IdCard size={12} /> Employee ID
                </span>
                <p className="font-mono font-bold text-slate-900">
                  {viewEmployee.employeeIdNumber}
                </p>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <User size={12} /> Username
                </span>
                <p className="font-semibold">
                  @{viewEmployee.username || "N/A"}
                </p>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Briefcase size={12} /> Employment
                </span>
                <p className="font-semibold text-slate-800">
                  {viewEmployee.employmentType}
                </p>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Building2 size={12} /> Office Type
                </span>
                <p className="font-semibold text-slate-800">
                  {viewEmployee.officeType}
                </p>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <DollarSign size={12} /> Daily Salary
                </span>
                <p className="font-mono font-bold text-slate-900">
                  PHP {viewEmployee.dailySalary?.toFixed(2) || "600.00"}
                </p>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Wallet size={12} /> Monthly Allowance
                </span>
                <p className="font-mono font-bold text-slate-900">
                  PHP {viewEmployee.monthlyAllowance?.toFixed(2) || "1,000.00"}
                </p>
              </div>
            </div>

            {/* Access Role Status */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                System Access Level
              </span>
              {viewEmployee.isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200/60">
                  <ShieldCheck size={13} /> Administrator
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200/60 text-slate-700">
                  Standard Employee
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewEmployee(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-lg w-full space-y-5 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
                  <UserCheck size={18} />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Register New Employee
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Employee ID Number
                  </label>
                  <input
                    type="text"
                    value={formData.employeeIdNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeIdNumber: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-50"
                    placeholder="e.g. EMP-2026-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Login Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-50"
                    placeholder="e.g. jdoe"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Office Type
                  </label>
                  <select
                    value={formData.officeType}
                    onChange={(e) =>
                      setFormData({ ...formData, officeType: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 bg-white p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-50"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Production">Production</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Daily Salary (PHP)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={formData.dailySalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailySalary: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 p-2.5 rounded-xl font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Monthly Allowance (PHP)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formData.monthlyAllowance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyAllowance: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 p-2.5 rounded-xl font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:bg-slate-50"
                    required
                  />
                </div>
              </div>

              {/* Admin Access Toggle Checkbox */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
                <input
                  type="checkbox"
                  id="isAdminToggle"
                  checked={formData.isAdmin}
                  onChange={(e) =>
                    setFormData({ ...formData, isAdmin: e.target.checked })
                  }
                  disabled={isSubmitting}
                  className="w-4 h-4 border-slate-300 rounded focus:ring-(--primary) cursor-pointer mt-0.5"
                />
                <label
                  htmlFor="isAdminToggle"
                  className="text-xs font-medium text-slate-700 cursor-pointer select-none leading-relaxed"
                >
                  <span className="font-bold text-slate-900 block">
                    Grant Administrator Privileges
                  </span>
                  Allows staff member to manage payroll, approve leave/OT
                  requests, and modify directory records.
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving
                      Record...
                    </>
                  ) : (
                    "Save Employee Record"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Employee"
        message="Are you sure you want to delete this employee record? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        type="danger"
        onConfirm={executeDelete}
        onClose={() => setDeleteId(null)}
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
