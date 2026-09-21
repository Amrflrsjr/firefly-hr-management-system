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
  Edit3,
  ChevronLeft,
  ChevronRight,
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
  sssNumber: "", // Added missing tracking key
  philHealthNumber: "", // Added missing tracking key
  pagIbigNumber: "", // Added missing tracking key
  deductionType: "Per Pay Period", // Added missing tracking key
  photo: "", // Added missing tracking key
  employmentStatus: "Active", // Added missing tracking key
};

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
  const [editEmployeeData, setEditEmployeeData] = useState<Employee | null>(
    null,
  );
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [formData, setFormData] = useState(initialFormState);
  const navigate = useNavigate();

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
          {(["all", "admin", "staff"] as const).map((role) => (
            <button
              key={role}
              onClick={() => {
                setFilterRole(role);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                filterRole === role
                  ? "bg-(--primary) text-slate-950 shadow-xs font-bold"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {role} (
              {role === "all"
                ? employees.length
                : employees.filter((e) =>
                    role === "admin" ? e.isAdmin : !e.isAdmin,
                  ).length}
              )
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
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
                  <Loader2
                    size={24}
                    className="animate-spin text-amber-600 mx-auto"
                  />
                </td>
              </tr>
            ) : paginatedEmployees.length > 0 ? (
              paginatedEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/65 transition-colors group cursor-pointer"
                  onClick={() => setViewEmployee(emp)}
                >
                  <td className="py-4 px-5">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {emp.employeeIdNumber}
                    </span>
                    <p className="text-[11px] font-semibold mt-1">
                      @{emp.username}
                    </p>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-900">
                    {emp.lastName}, {emp.firstName}
                  </td>
                  <td className="py-4 px-5 text-slate-600 font-medium text-xs">
                    {emp.jobTitle}
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
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
                        className="text-slate-400 p-1.5 rounded-lg hover:bg-amber-50"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setEditEmployeeData(emp)}
                        className="text-slate-400 p-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(emp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
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
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-none sm:rounded-3xl max-w-2xl w-full h-full sm:h-auto max-h-none sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 flex justify-between items-center border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                  <UserCheck size={20} />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Register New Employee
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form
              onSubmit={handleCreate}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4"
            >
              <EmployeeFormFields
                formData={formData}
                setFormData={setFormData}
                isSubmitting={isSubmitting}
              />
            </form>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-white transition-colors cursor-pointer text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Employee Record"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editEmployeeData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-2xl w-full space-y-5 border shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 size={18} /> Edit Employee Record
              </h2>
              <button
                onClick={() => setEditEmployeeData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <EmployeeFormFields
                formData={editEmployeeData}
                setFormData={
                  setEditEmployeeData as React.Dispatch<
                    React.SetStateAction<Employee>
                  >
                }
                isSubmitting={isSubmitting}
              />
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditEmployeeData(null)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-(--primary) text-slate-950 rounded-xl font-semibold"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Employee"
        message="Are you sure you want to delete this employee record? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        type="danger"
        onConfirm={executeDelete}
        onClose={() => setDeleteId(null)}
      />

      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
