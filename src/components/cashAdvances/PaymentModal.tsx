import { X, Loader2, Banknote } from "lucide-react";
import { FOCUS } from "../../utils/uiConstants";

interface PaymentModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  remainingBalance: number;
  amount: number;
  remarks: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string | number) => void;
}

export default function PaymentModal({
  isOpen,
  isSubmitting,
  remainingBalance,
  amount,
  remarks,
  onClose,
  onSubmit,
  onChange,
}: PaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Banknote size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Record Payment
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <p className="text-xs font-medium text-slate-500">
            Remaining Balance
          </p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            PHP{" "}
            {remainingBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Payment Amount (PHP)
            </label>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => onChange("amount", Number(e.target.value))}
              disabled={isSubmitting}
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono font-bold text-slate-900 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
              min={1}
              max={remainingBalance}
              step={1}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => onChange("remarks", e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., Cash payment, Bank transfer"
              className={`w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-800 focus:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)/20 disabled:opacity-60 ${FOCUS}`}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 ${FOCUS}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-emerald-700 cursor-pointer disabled:opacity-50 active:scale-[0.98] ${FOCUS}`}
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Submit Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
