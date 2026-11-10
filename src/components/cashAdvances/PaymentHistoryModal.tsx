import { X, Receipt, Calendar, Tag, Trash2, Loader2 } from "lucide-react";
import { FOCUS } from "../../utils/uiConstants";

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: {
    id: number;
    amount: number;
    paymentDate: string;
    remarks?: string;
  }[];
  advanceAmount: number;
  remainingBalance: number;
  employeeName: string;
  advanceType: string;
  isDeleting: boolean; // <-- New prop
  onDeletePayment: (id: number) => void; // <-- New prop
}

const formatCurrency = (val?: number) => {
  const amount = val ?? 0;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function PaymentHistoryModal({
  isOpen,
  onClose,
  payments,
  advanceAmount,
  remainingBalance,
  employeeName,
  advanceType,
  isDeleting,
  onDeletePayment,
}: PaymentHistoryModalProps) {
  if (!isOpen) return null;

  const totalPaid = advanceAmount - remainingBalance;
  const progress = advanceAmount > 0 ? (totalPaid / advanceAmount) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Receipt size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Payment History
              </h2>
              <p className="text-xs text-slate-500">
                {employeeName} • {advanceType} Advance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {/* ... (Keep the summary cards and progress bar exactly as they are) ... */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total
            </p>
            <p className="text-sm font-bold font-mono text-slate-900 mt-1">
              ₱{formatCurrency(advanceAmount)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Paid
            </p>
            <p className="text-sm font-bold font-mono text-emerald-700 mt-1">
              ₱{formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Balance
            </p>
            <p className="text-sm font-bold font-mono text-amber-700 mt-1">
              ₱{formatCurrency(remainingBalance)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* History List */}
        <div className="max-h-75 overflow-y-auto pr-1 space-y-2">
          {payments.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">
              No payments recorded yet.
            </div>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <Calendar size={12} />
                    {new Date(p.paymentDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(p.paymentDate).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {p.remarks && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Tag size={10} />
                      {p.remarks}
                    </div>
                  )}
                </div>

                {/* Amount & Delete Button */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-mono text-slate-900">
                    +₱{formatCurrency(p.amount)}
                  </span>
                  <button
                    onClick={() => onDeletePayment(p.id)}
                    disabled={isDeleting}
                    className="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete Payment"
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={`rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer disabled:opacity-50 ${FOCUS}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
