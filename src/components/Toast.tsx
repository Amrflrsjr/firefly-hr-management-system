import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { FOCUS } from "../utils/uiConstants";

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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-50 w-11/12 max-w-sm sm:max-w-md transition-all duration-300 ease-out translate-y-0 opacity-100">
      <div
        className={`flex items-start justify-between gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-xs transition-all text-xs sm:text-sm font-semibold ${
          isSuccess
            ? "bg-emerald-50/95 border-emerald-200 text-emerald-950"
            : "bg-rose-50/95 border-rose-200 text-rose-950"
        }`}
      >
        <div className="flex items-start gap-3">
          {isSuccess ? (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={14} />
            </div>
          ) : (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <AlertCircle size={14} />
            </div>
          )}
          <span className="leading-tight pt-0.5">{message}</span>
        </div>
        <button
          onClick={onClose}
          className={`rounded-lg p-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer ${FOCUS}`}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
