import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarDays,
  Tag,
  Search,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

interface Holiday {
  id: number;
  description: string;
  holidayDate: string;
  holidayType: string;
}

const ITEMS_PER_PAGE = 10;

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "regular" | "special">(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);

  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    holidayDate: new Date().toISOString().split("T")[0],
    holidayType: "Regular Holiday",
  });

  const navigate = useNavigate();

  const showToast = useCallback(
    (text: string, type: "success" | "error" = "success") => {
      setToast({ text, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/Holidays");
      setHolidays(res.data);
    } catch {
      showToast("Failed to load holidays.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;

    api
      .get("/Holidays")
      .then((res) => {
        if (isMounted) {
          setHolidays(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          showToast("Failed to load holidays.", "error");
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
      await api.post("/Holidays", {
        ...formData,
        holidayDate: new Date(formData.holidayDate).toISOString(),
      });
      setShowModal(false);
      setFormData({
        description: "",
        holidayDate: new Date().toISOString().split("T")[0],
        holidayType: "Regular Holiday",
      });
      await loadHolidays();
      showToast("Successfully added new holiday.");
    } catch {
      showToast("Failed to create holiday.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    try {
      await api.delete(`/Holidays/${deleteId}`);
      setHolidays((prev) => prev.filter((h) => h.id !== deleteId));
      showToast("Successfully deleted holiday.");
    } catch {
      showToast("Failed to delete holiday. Admin rights required.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        h.description.toLowerCase().includes(query) ||
        new Date(h.holidayDate).toLocaleDateString().includes(query);

      if (activeTab === "regular") {
        return matchesSearch && h.holidayType === "Regular Holiday";
      }
      if (activeTab === "special") {
        return matchesSearch && h.holidayType.includes("Special");
      }
      return matchesSearch;
    });
  }, [holidays, searchQuery, activeTab]);

  const regularCount = useMemo(
    () => holidays.filter((h) => h.holidayType === "Regular Holiday").length,
    [holidays],
  );

  const specialCount = useMemo(
    () => holidays.filter((h) => h.holidayType.includes("Special")).length,
    [holidays],
  );

  const totalPages = Math.ceil(filteredHolidays.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHolidays = useMemo(() => {
    return filteredHolidays.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHolidays, startIndex]);

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "Regular Holiday":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/60";
      case "Special Non-Working Holiday":
      case "Special Working Holiday":
        return "bg-amber-50 text-amber-700 border border-amber-200/60";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200/80";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <Calendar size={18} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Holiday Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure official regular and special non-working holiday
                schedules.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center disabled:opacity-50 active:scale-[0.98]"
          >
            <Plus size={16} /> Add Holiday
          </button>
        </div>

        {/* Tabs for All, Regular, and Special Holidays */}
        <div className="flex border-b border-slate-200 gap-8 px-2">
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "all"
                ? "border-(--primary) text-amber-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            All Holidays
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {holidays.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("regular");
              setCurrentPage(1);
            }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "regular"
                ? "border-(--primary) text-amber-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Regular Holidays
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {regularCount}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("special");
              setCurrentPage(1);
            }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "special"
                ? "border-(--primary) text-amber-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Special Holidays
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {specialCount}
            </span>
          </button>
        </div>

        {/* Main Workspace Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Search Bar Bar */}
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50">
            <div className="max-w-md">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2 flex items-center gap-1.5">
                <Search size={13} className="text-slate-400" />
                Search Holiday
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search holiday description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-11 pl-9 pr-4 border border-slate-300 bg-white rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15"
                />
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Holiday Date</th>
                  <th className="py-3.5 px-6">Type Classification</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-slate-400"
                    >
                      <Loader2
                        size={22}
                        className="animate-spin text-amber-600 mx-auto mb-2"
                      />
                      <p className="text-xs font-semibold text-slate-500">
                        Loading holiday schedule...
                      </p>
                    </td>
                  </tr>
                ) : paginatedHolidays.length > 0 ? (
                  paginatedHolidays.map((h) => (
                    <tr
                      key={h.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-slate-900 text-xs">
                        {h.description}
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                        {new Date(h.holidayDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${getTypeBadgeStyle(
                            h.holidayType,
                          )}`}
                        >
                          <Tag size={12} />
                          {h.holidayType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setDeleteId(h.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Holiday"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-slate-400 text-xs"
                    >
                      No holidays configured yet.
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
                  Loading holiday cards...
                </p>
              </div>
            ) : paginatedHolidays.length > 0 ? (
              paginatedHolidays.map((h) => (
                <div
                  key={h.id}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">
                        {h.description}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <CalendarDays size={13} className="text-slate-400" />
                        {new Date(h.holidayDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteId(h.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Classification
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${getTypeBadgeStyle(
                        h.holidayType,
                      )}`}
                    >
                      {h.holidayType}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                No holidays found.
              </div>
            )}
          </div>

          {/* Pagination Controls Footer */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">
                Add New Holiday
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Holiday Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  placeholder="e.g. Independence Day"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Holiday Date
                </label>
                <input
                  type="date"
                  value={formData.holidayDate}
                  onChange={(e) =>
                    setFormData({ ...formData, holidayDate: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full border border-slate-300 p-2.5 rounded-xl font-semibold cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Holiday Type
                </label>
                <select
                  value={formData.holidayType}
                  onChange={(e) =>
                    setFormData({ ...formData, holidayType: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full border border-slate-300 bg-white p-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  <option value="Regular Holiday">Regular Holiday</option>
                  <option value="Special Non-Working Holiday">
                    Special Non-Working Holiday
                  </option>
                  <option value="Special Working Holiday">
                    Special Working Holiday
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday record?"
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
