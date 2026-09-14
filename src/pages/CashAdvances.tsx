import { useEffect, useState } from "react";
import api from "../services/api";
import { Plus, Trash2, DollarSign, X } from "lucide-react";

interface CashAdvance {
  id: number;
  employeeName: string;
  amount: number;
  balance: number;
  requestDate: string;
  status: string;
}

export default function CashAdvances() {
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: Number(localStorage.getItem("employeeId")) || 1,
    amount: 1000,
  });

  useEffect(() => {
    const loadAdvances = async () => {
      try {
        const res = await api.get("/CashAdvances");
        setAdvances(res.data);
      } catch {
        console.error("Failed to load cash advances");
      }
    };
    loadAdvances();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/CashAdvances", {
        ...formData,
        requestDate: new Date().toISOString(),
        status: "Pending",
      });
      setShowModal(false);
      const res = await api.get("/CashAdvances");
      setAdvances(res.data);
    } catch {
      alert("Failed to request cash advance.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this cash advance request?"))
      return;
    try {
      await api.delete(`/CashAdvances/${id}`);
      setAdvances(advances.filter((a) => a.id !== id));
    } catch {
      alert("Failed to delete cash advance.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign size={22} className="text-blue-600" /> Cash Advances
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee cash advance requests and repayment balances.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xs hover:bg-blue-700 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus size={16} /> Request Advance
        </button>
      </div>

      {/* Responsive Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-150">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Amount Requested</th>
                <th className="p-4 font-semibold">Remaining Balance</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {advances.length > 0 ? (
                advances.map((adv) => (
                  <tr
                    key={adv.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900">
                      {adv.employeeName || "Employee #1"}
                    </td>
                    <td className="p-4 text-slate-600">
                      PHP {adv.amount.toFixed(2)}
                    </td>
                    <td className="p-4 font-semibold text-blue-600">
                      PHP {adv.balance.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          adv.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {adv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(adv.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Request"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500 text-sm"
                  >
                    No cash advance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Cash Advance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">
                Request Cash Advance
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Amount (PHP)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  min={500}
                  step={100}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
