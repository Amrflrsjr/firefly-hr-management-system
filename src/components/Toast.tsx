import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface ToastProps {
  message: string | null;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({
  message,
  type = "success",
  onClose,
}: ToastProps) {
  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm sm:max-w-md">
      <div
        className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-lg transition-all text-xs sm:text-sm font-medium ${
          isSuccess
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-rose-50 border-rose-200 text-rose-900"
        }`}
      >
        <div className="flex items-start gap-2.5">
          {isSuccess ? (
            <CheckCircle2
              size={18}
              className="text-emerald-600 shrink-0 mt-0.5"
            />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-tight">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md transition-colors shrink-0 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
