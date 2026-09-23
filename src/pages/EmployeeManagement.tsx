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
  Loader2,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import EmployeeFormFields from "../components/employee/EmployeeFormFields";
import ViewEmployeeModal from "../components/employee/ViewEmployeeModal";

interface Employee {
  id: number;
  employeeIdNumber: string;
  username: string;
  firstName: string;
  lastName: string;
  password?: string;
  mustChangePassword: boolean;
  isAdmin: boolean;
  middleName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  civilStatus: string;
  currentAddress: string;
  permanentAddress: string;
  contactNumber: string;
  personalEmailAddress: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  relationToEmployee: string;
  emergencyContactAddress: string;
  jobTitle: string;
  employmentType: string;
  dateHired: string;
  declaredDateHired: string;
  officeType: string;
  dailySalary: number;
  dailyAllowance: number;
  bloodType: string;
  hasGovernmentDeductions: boolean;
  sssNumber: string;
  philHealthNumber: string;
  pagIbigNumber: string;
  deductionType: string;
  photo?: string;
  employmentStatus: string;
  maxLeaveHours: number;
  usedLeaveHours: number;
  remainingLeaveHours: number;
}

const ITEMS_PER_PAGE = 10;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab] = useState<"all" | "admin" | "staff">("all");
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
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.get("/Employees");
      setEmployees(res.data);
    } catch {
      showToast("Failed to load employees.", "error");
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const res = await api.get("/Employees");
        if (isMounted) setEmployees(res.data);
      } catch {
        if (isMounted) showToast("Failed to load employees.", "error");
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

        if (activeTab === "admin") return matchesSearch && emp.isAdmin;
        if (activeTab === "staff") return matchesSearch && !emp.isAdmin;
        return matchesSearch;
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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
              <Users size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Employee Directory
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage organization staff records, roles, and leave balances.
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

        {/* Main Workspace Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
            <div className="max-w-md w-full relative">
              <input
                type="text"
                placeholder="Search staff by name, ID, or title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-11 pl-9 pr-4 border border-slate-300 bg-white rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-(--primary)"
              />
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <th className="py-3.5 px-6">Employee ID / User</th>
                  <th className="py-3.5 px-6">Full Name</th>
                  <th className="py-3.5 px-6">Job Title</th>
                  <th className="py-3.5 px-6">Leave Balance</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-400"
                    >
                      <Loader2
                        size={22}
                        className="animate-spin text-amber-600 mx-auto mb-2"
                      />
                      Loading employees...
                    </td>
                  </tr>
                ) : paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => setViewEmployee(emp)}
                    >
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {emp.employeeIdNumber}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 text-xs">
                        {emp.lastName}, {emp.firstName}
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs">
                        {emp.jobTitle || "N/A"}
                      </td>
                      <td className="py-4 px-6 text-xs">
                        <span className="font-bold text-slate-900">
                          {emp.remainingLeaveHours} hrs
                        </span>{" "}
                        / {emp.maxLeaveHours} hrs
                      </td>
                      <td
                        className="py-4 px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          <button
                            onClick={() => setResetLeaveId(emp.id)}
                            className="text-slate-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Reset Leave Balance"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={() => setViewEmployee(emp)}
                            className="text-slate-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                            title="View Profile"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setEditEmployeeData(emp)}
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit3 size={16} />
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
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-400 text-xs"
                    >
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
            {loading ? (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 space-y-2">
                <Loader2
                  size={22}
                  className="animate-spin text-amber-600 mx-auto"
                />
                <p className="text-xs font-semibold text-slate-500">
                  Loading employees...
                </p>
              </div>
            ) : paginatedEmployees.length > 0 ? (
              paginatedEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setViewEmployee(emp)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 cursor-pointer"
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">
                        {emp.lastName}, {emp.firstName}
                      </h3>
                      <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                        ID: {emp.employeeIdNumber} • @{emp.username}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {emp.remainingLeaveHours} / {emp.maxLeaveHours} hrs
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="font-medium text-slate-600">
                      {emp.jobTitle || "N/A"}
                    </span>
                    <div
                      className="flex items-center gap-1.5 flex-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setResetLeaveId(emp.id)}
                        className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                        title="Reset Leave Balance"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => setViewEmployee(emp)}
                        className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                        title="View Profile"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setEditEmployeeData(emp)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(emp.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                No employees found.
              </div>
            )}
          </div>

          {calculatedTotalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>
                Page {currentPage} of {calculatedTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border bg-white rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(calculatedTotalPages, p + 1))
                  }
                  disabled={currentPage === calculatedTotalPages}
                  className="p-2 border bg-white rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden border border-slate-200">
            <div className="p-4 sm:p-5 flex justify-between items-center border-b border-slate-100 bg-white shrink-0">
              <h2 className="text-base font-bold text-slate-900">
                Register New Employee
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
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
            >
              <EmployeeFormFields
                formData={formData}
                setFormData={setFormData}
                isSubmitting={isSubmitting}
              />
            </form>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="px-4 py-2 bg-(--primary) rounded-xl text-xs font-bold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editEmployeeData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden border border-slate-200">
            <div className="p-4 sm:p-5 flex justify-between items-center border-b border-slate-100 bg-white shrink-0">
              <h2 className="text-base font-bold text-slate-900">
                Edit Employee Record
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
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
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
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditEmployeeData(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleUpdate}
                disabled={isSubmitting}
                className="px-4 py-2 bg-(--primary) rounded-xl text-xs font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Employee"
        message="Are you sure you want to delete this employee record?"
        confirmText="Delete"
        type="danger"
        onConfirm={executeDelete}
        onClose={() => setDeleteId(null)}
      />

      <ConfirmModal
        isOpen={resetLeaveId !== null}
        title="Reset Leave Balance"
        message="Are you sure you want to reset this employee's leave balance back to the maximum limit? All past leave records will be preserved for history."
        confirmText="Reset Balance"
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
