import { useEffect, useState, useCallback } from "react";
import { FileText, Trash2, Eye } from "lucide-react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import PaySlipModal, { type PaySlipData } from "../components/PaySlipModal";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

export default function History() {
  const [history, setHistory] = useState<PaySlipData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const role = localStorage.getItem("role") || "Employee";
  const loggedInEmployeeId = localStorage.getItem("employeeId") || "1";
  const [selectedEmployee, setSelectedEmployee] =
    useState<string>(loggedInEmployeeId);

  const [viewingPaySlip, setViewingPaySlip] = useState<PaySlipData | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (role === "Admin") {
      api
        .get("/Employees")
        .then((res) => {
          setEmployees(res.data);
          if (res.data.length > 0 && selectedEmployee === "1") {
            setSelectedEmployee(String(res.data[0].id));
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const loadHistory = useCallback(async () => {
    const targetId = role === "Admin" ? selectedEmployee : loggedInEmployeeId;
    if (!targetId) return;
    try {
      const res = await api.get(`/Payroll/history/${targetId}`);
      setHistory(res.data);
    } catch {
      setHistory([]);
    }
  }, [selectedEmployee, loggedInEmployeeId, role]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadHistory]);

  const executeDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/Payroll/${deleteId}`);
      showToast("Pay slip deleted successfully.");
      loadHistory();
    } catch {
      showToast("Failed to delete pay slip.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={22} className="text-blue-600" /> Pay Slip History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View past computed pay slips and earnings records.
          </p>
        </div>

        {role === "Admin" && employees.length > 0 && (
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Select Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="border border-slate-300 bg-white p-2 rounded-lg text-sm w-full sm:w-64 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={String(emp.id)}>
                  {emp.lastName}, {emp.firstName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-125">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Pay Period</th>
                <th className="p-4 font-semibold">Period End</th>
                <th className="p-4 font-semibold text-right">Net Receivable</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {history.length > 0 ? (
                history.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900">
                      {item.payPeriod}
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(item.payPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right font-semibold text-blue-600">
                      PHP {item.netReceivable.toFixed(2)}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setViewingPaySlip(item)}
                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>

                      {role === "Admin" && (
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Pay Slip"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-slate-500 text-sm"
                  >
                    No pay slip history available for this employee.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Pay Slip Modal */}
      <PaySlipModal
        isOpen={viewingPaySlip !== null}
        paySlip={viewingPaySlip}
        onClose={() => setViewingPaySlip(null)}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Pay Slip Record"
        message="Are you sure you want to delete this historical pay slip record?"
        confirmText="Delete"
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
