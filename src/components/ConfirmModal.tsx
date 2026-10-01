import type { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";
import { FOCUS } from "../utils/uiConstants";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {type === "danger" && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600">
                <AlertTriangle size={20} />
              </div>
            )}
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 cursor-pointer ${FOCUS}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-xs sm:text-sm leading-relaxed text-slate-600">
          {message}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer ${FOCUS}`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer active:scale-[0.98] ${
              type === "danger"
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-(--primary) text-slate-950 hover:bg-(--primary-hover)"
            } ${FOCUS}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
