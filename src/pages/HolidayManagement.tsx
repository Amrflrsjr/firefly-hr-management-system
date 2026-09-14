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
  Search,
  CalendarDays,
  Tag,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

interface Holiday {
  id: number;
  description: string;
  holidayDate: string;
  holidayType: string;
}

const ITEMS_PER_PAGE = 5;

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
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
      setShowAddModal(false);
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

      if (typeFilter === "all") return matchesSearch;
      return matchesSearch && h.holidayType === typeFilter;
    });
  }, [holidays, searchQuery, typeFilter]);

  const totalPages = Math.ceil(filteredHolidays.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHolidays = useMemo(() => {
    return filteredHolidays.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHolidays, startIndex]);

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "Regular Holiday":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "Special Non-Working Holiday":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200/80";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Calendar size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Holiday Management
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Configure official regular and special non-working holiday
              schedules.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center active:scale-[0.98]"
        >
          <Plus size={16} /> Add Holiday
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search holiday description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 overflow-x-auto">
          <button
            onClick={() => {
              setTypeFilter("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            All Types ({holidays.length})
          </button>
          <button
            onClick={() => {
              setTypeFilter("Regular Holiday");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === "Regular Holiday"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Regular
          </button>
          <button
            onClick={() => {
              setTypeFilter("Special Non-Working Holiday");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === "Special Non-Working Holiday"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Special
          </button>
        </div>
      </div>

      {/* Desktop Holiday Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">Description</th>
              <th className="py-3.5 px-5">Holiday Date</th>
              <th className="py-3.5 px-5">Type Classification</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  <Loader2
                    size={24}
                    className="animate-spin text-blue-600 mx-auto mb-2"
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
                  <td className="py-4 px-5 font-bold text-slate-900">
                    {h.description}
                  </td>
                  <td className="py-4 px-5 text-slate-600 text-xs font-semibold">
                    {new Date(h.holidayDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTypeBadgeStyle(
                        h.holidayType,
                      )}`}
                    >
                      {h.holidayType}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
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

      {/* Mobile Card Grid View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
            <Loader2 size={24} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              Loading holiday cards...
            </p>
          </div>
        ) : paginatedHolidays.length > 0 ? (
          paginatedHolidays.map((h) => (
            <div
              key={h.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {h.description}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
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
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Tag size={12} /> Classification
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${getTypeBadgeStyle(
                    h.holidayType,
                  )}`}
                >
                  {h.holidayType}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No holidays found.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>
            Showing {startIndex + 1} -{" "}
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredHolidays.length)} of{" "}
            {filteredHolidays.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
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

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Calendar size={18} />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Add New Holiday
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
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
                  className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
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
                  className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
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
                  className="w-full border border-slate-300 bg-white p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
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
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Holiday"
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
