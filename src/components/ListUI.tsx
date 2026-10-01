import { CheckCircle2, XCircle, Ban, AlertCircle } from "lucide-react";
import { FOCUS, statusLabel } from "../utils/uiConstants";

/**
 * Shared building blocks for list-style pages (Timesheet, Leaves, ...).
 * Keeping them here is what keeps those pages looking and behaving the same.
 */

export function PersonCell({ name }: { name: string }) {
  const initials =
    name
      .split(/[\s,]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-amber-100 bg-amber-50 text-[11px] font-semibold text-amber-800"
      >
        {initials}
      </span>
      <span className="truncate text-sm font-medium text-slate-900">
        {name}
      </span>
    </div>
  );
}

export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div
      className="divide-y divide-slate-100"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 px-5 py-4 motion-reduce:animate-none"
        >
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="h-6 w-24 rounded-md bg-slate-100" />
          <div className="h-3 w-32 rounded bg-slate-100" />
          <div className="ml-auto h-3 w-28 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-slate-500">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 rounded-full border px-3 text-xs font-semibold transition-colors cursor-pointer ${FOCUS} ${
        active
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Approved"
      ? "border-emerald-200/70 bg-emerald-50 text-emerald-700"
      : status === "Declined"
        ? "border-rose-200/70 bg-rose-50 text-rose-700"
        : status === "Cancelled"
          ? "border-slate-200 bg-slate-100 text-slate-600"
          : "border-amber-200/70 bg-amber-50 text-amber-700";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {status === "Approved" ? (
        <CheckCircle2 size={13} />
      ) : status === "Declined" ? (
        <XCircle size={13} />
      ) : status === "Cancelled" ? (
        <Ban size={13} />
      ) : (
        <AlertCircle size={13} />
      )}
      {statusLabel(status)}
    </span>
  );
}
