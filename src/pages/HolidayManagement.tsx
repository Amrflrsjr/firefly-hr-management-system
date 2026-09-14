import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";

interface Holiday {
  id: number;
  description: string;
  holidayDate: string;
  holidayType: string;
}

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadHolidays = useCallback(async () => {
    try {
      const res = await api.get("/Holidays");
      setHolidays(res.data);
    } catch {
      showToast("Failed to load holidays.", "error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHolidays();
  }, [loadHolidays]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
      loadHolidays();
      showToast("Successfully added new holiday.");
    } catch {
      showToast("Failed to create holiday.", "error");
    }
  };

  const executeDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/Holidays/${deleteId}`);
      setHolidays(holidays.filter((h) => h.id !== deleteId));
      showToast("Successfully deleted holiday.");
    } catch {
      showToast("Failed to delete holiday. Admin rights required.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(holidays.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHolidays = holidays.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar size={22} className="text-blue-600" /> Holiday
              Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage company holidays, non-working days, and team events.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xs hover:bg-blue-700 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus size={16} /> Add Holiday
        </button>
      </div>

      {/* Holiday Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-125">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedHolidays.length > 0 ? (
                paginatedHolidays.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900">
                      {h.description}
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(h.holidayDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {h.holidayType}
                      </span>
                    </td>
                    <td className="p-4 text-right">
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
                    className="p-8 text-center text-slate-500 text-sm"
                  >
                    No holidays configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {holidays.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-600">
            <span>
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, holidays.length)} of{" "}
              {holidays.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">
                Add New Holiday
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Independence Day"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.holidayDate}
                  onChange={(e) =>
                    setFormData({ ...formData, holidayDate: e.target.value })
                  }
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Holiday Type
                </label>
                <select
                  value={formData.holidayType}
                  onChange={(e) =>
                    setFormData({ ...formData, holidayType: e.target.value })
                  }
                  className="w-full border border-slate-300 bg-white p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday record?"
        confirmText="Delete"
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
