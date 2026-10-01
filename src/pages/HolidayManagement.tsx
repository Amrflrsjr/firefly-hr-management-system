import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Calendar,
  Search,
  CalendarX2,
  RotateCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaginationBar from "../components/timesheet/PaginationBar";
import { FOCUS, ROW_BASE, statusLabel } from "../utils/uiConstants";
import {
  SkeletonRows,
  EmptyState,
  Chip,
  StatusBadge,
} from "../components/ListUI";

interface Holiday {
  id: number;
  description: string;
  holidayDate: string;
  holidayType: string;
}

type HolidayFilter = "All" | "Regular Holiday" | "Special Holiday";

const ITEMS_PER_PAGE = 10;
const HOLIDAY_FILTERS: HolidayFilter[] = [
  "All",
  "Regular Holiday",
  "Special Holiday",
];

const HOLIDAY_GRID = "md:grid-cols-[minmax(0,1.2fr)_180px_200px_96px]";

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<HolidayFilter>("All");
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
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await api.get("/Holidays");
      setHolidays(res.data);
    } catch {
      setHolidays([]);
      setLoadError(true);
      showToast("Failed to load holidays.", "error");
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
        const res = await api.get("/Holidays");
        if (isMounted) setHolidays(res.data);
      } catch {
        if (isMounted) {
          setHolidays([]);
          setLoadError(true);
          showToast("Failed to load holidays.", "error");
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

  const filterCounts: Record<HolidayFilter, number> = {
    All: holidays.filter((h) => {
      const query = searchQuery.toLowerCase();
      return (
        h.description.toLowerCase().includes(query) ||
        new Date(h.holidayDate).toLocaleDateString().includes(query)
      );
    }).length,
    "Regular Holiday": holidays.filter((h) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        h.description.toLowerCase().includes(query) ||
        new Date(h.holidayDate).toLocaleDateString().includes(query);
      return matchesSearch && h.holidayType === "Regular Holiday";
    }).length,
    "Special Holiday": holidays.filter((h) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        h.description.toLowerCase().includes(query) ||
        new Date(h.holidayDate).toLocaleDateString().includes(query);
      return matchesSearch && h.holidayType.includes("Special");
    }).length,
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        h.description.toLowerCase().includes(query) ||
        new Date(h.holidayDate).toLocaleDateString().includes(query);

      if (!matchesSearch) return false;
      if (activeFilter === "Regular Holiday") {
        return h.holidayType === "Regular Holiday";
      }
      if (activeFilter === "Special Holiday") {
        return h.holidayType.includes("Special");
      }
      return true;
    });
  }, [holidays, searchQuery, activeFilter]);

  const totalPages = Math.ceil(filteredHolidays.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHolidays = useMemo(() => {
    return filteredHolidays.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHolidays, startIndex]);

  const changePage = (p: number) => {
    setCurrentPage(p);
    document.getElementById("holiday-card")?.scrollIntoView({ block: "start" });
  };

  const fileButton = (
    <button
      onClick={() => setShowModal(true)}
      disabled={loading}
      className={`flex h-10 items-center justify-center gap-1.5 rounded-lg bg-(--primary) px-4 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-(--primary-hover) cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
    >
      <Plus size={16} />
      Add holiday
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
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700">
            <Calendar size={19} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Holiday management
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Configure official regular and special non-working holiday
              schedules.
            </p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
          {fileButton}
        </div>
      </div>

      {/* Card */}
      <section
        id="holiday-card"
        className="scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Filters & Search */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-slate-200 bg-slate-50/50 p-4 sm:px-5">
          <div className="w-full sm:w-72">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Search size={13} className="text-slate-400" />
              Search holiday
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search description..."
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
              Classification
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {HOLIDAY_FILTERS.map((filter) => (
                <Chip
                  key={filter}
                  active={activeFilter === filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setCurrentPage(1);
                  }}
                >
                  {statusLabel(filter)}
                  <span className="ml-1.5 font-normal text-slate-400">
                    {filterCounts[filter]}
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
            title="Couldn't load holidays"
            text="Check your connection and try again."
            action={
              <button
                onClick={loadHolidays}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${FOCUS}`}
              >
                <RotateCw size={13} />
                Try again
              </button>
            }
          />
        ) : paginatedHolidays.length === 0 ? (
          <EmptyState
            icon={<CalendarX2 size={20} />}
            title={
              searchQuery
                ? "No matching holidays found"
                : activeFilter === "All"
                  ? "No holidays configured yet"
                  : `No ${activeFilter.toLowerCase()}s found`
            }
            text={
              searchQuery
                ? "Try adjusting your search criteria."
                : "Holidays you configure will show up here."
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
              className={`hidden border-b border-slate-200 px-5 py-2.5 text-xs font-medium text-slate-500 md:grid md:gap-x-4 ${HOLIDAY_GRID}`}
            >
              <span>Description</span>
              <span>Holiday date</span>
              <span>Type classification</span>
              <span className="sr-only">Actions</span>
            </div>

            <ul className="divide-y divide-slate-100">
              {paginatedHolidays.map((h) => {
                const dateStr = new Date(h.holidayDate).toLocaleDateString(
                  undefined,
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  },
                );
                return (
                  <li
                    key={h.id}
                    className={`relative px-5 py-3 transition-colors hover:bg-slate-50/70 ${ROW_BASE} ${HOLIDAY_GRID}`}
                  >
                    <span className="text-xs font-bold text-slate-900 self-center">
                      {h.description}
                    </span>

                    <span className="text-xs font-medium text-slate-600 self-center">
                      {dateStr}
                    </span>

                    <div className="self-center">
                      <StatusBadge status={h.holidayType} />
                    </div>

                    <div className="flex w-full items-center justify-end gap-1.5 md:w-auto self-center">
                      <button
                        onClick={() => setDeleteId(h.id)}
                        aria-label="Delete holiday"
                        className={`rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer ${FOCUS}`}
                        title="Delete Holiday"
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
            totalPages={totalPages}
            onPageChange={changePage}
          />
        )}
      </section>

      {/* Add Holiday Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Add new holiday
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
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Holiday description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
                  placeholder="e.g. Independence Day"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Holiday date
                </label>
                <input
                  type="date"
                  value={formData.holidayDate}
                  onChange={(e) =>
                    setFormData({ ...formData, holidayDate: e.target.value })
                  }
                  disabled={isSubmitting}
                  className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Holiday type
                </label>
                <select
                  value={formData.holidayType}
                  onChange={(e) =>
                    setFormData({ ...formData, holidayType: e.target.value })
                  }
                  disabled={isSubmitting}
                  className={`w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
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

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className={`rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 ${FOCUS}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 rounded-xl bg-(--primary) px-4 py-2 font-semibold text-slate-950 shadow-sm hover:bg-(--primary-hover) cursor-pointer disabled:opacity-50 active:scale-[0.98] ${FOCUS}`}
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  Save holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete holiday"
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
