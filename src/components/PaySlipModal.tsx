import { useEffect, useState, type ReactNode } from "react";
import { X, Download, Loader2, TriangleAlert } from "lucide-react";
import api from "../services/api";
import logoNoBg from "../assets/Firefly Logo - No BG.png";

export interface PaySlipData {
  id: number;
  payPeriod: string;
  payPeriodEnd: string;
  employeeName?: string;
  dailySalary: number;
  dailyAllowance?: number;
  basicPay: number;
  overtimePay: number;
  regularHolidayPay: number;
  specialHolidayPay: number;
  leavePay: number;
  grossEarnings: number;
  lateDeduction: number;
  undertimeDeduction: number;
  absentDeduction: number;
  cashAdvanceDeduction: number;
  governmentContributions: number;
  sssDeduction?: number;
  philHealthDeduction?: number;
  pagIbigDeduction?: number;
  totalDeductions: number;
  netReceivable: number;
}

interface PaySlipModalProps {
  isOpen: boolean;
  paySlip: PaySlipData | null;
  onClose: () => void;
  onShowToast?: (text: string, type?: "success" | "error") => void;
}

/** Formats as ₱1,234.56 — negatives render as -₱1,234.56 (not ₱-1,234.56). */
const peso = (val?: number) => {
  const amount = val ?? 0;
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}₱${formatted}`;
};

const getPayPeriodRange = (payPeriod: string, payPeriodEndStr: string) => {
  const endDate = new Date(payPeriodEndStr);
  const year = endDate.getFullYear();
  const month = endDate.getMonth();

  let startDate: Date;
  let finalEndDate: Date;

  if (payPeriod.includes("15th")) {
    const prevMonth = new Date(year, month - 1, 1);
    const lastDayPrevMonth = new Date(year, month, 0).getDate();
    startDate = new Date(
      prevMonth.getFullYear(),
      prevMonth.getMonth(),
      Math.min(30, lastDayPrevMonth),
    );
    finalEndDate = new Date(year, month, 13);
  } else {
    startDate = new Date(year, month, 14);
    finalEndDate = new Date(year, month, 28);
  }

  const format = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return `${format(startDate)} – ${format(finalEndDate)}`;
};

/* ─────────────────────────── Small building blocks ─────────────────────────── */

function LineItem({
  label,
  hint,
  amount,
  children,
}: {
  label: string;
  hint?: string;
  amount: number;
  children?: ReactNode;
}) {
  const isZero = !amount;
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
        </div>
        <p
          className={`shrink-0 text-sm font-semibold tabular-nums ${
            isZero ? "text-slate-400" : "text-slate-900"
          }`}
        >
          {peso(amount)}
        </p>
      </div>
      {children}
    </li>
  );
}

function BreakdownRow({ label, amount }: { label: string; amount?: number }) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span>{label}</span>
      <span className="tabular-nums">{peso(amount)}</span>
    </div>
  );
}

function SectionCard({
  title,
  accent,
  totalLabel,
  totalValue,
  totalClass,
  children,
}: {
  title: string;
  accent: string;
  totalLabel: string;
  totalValue: string;
  totalClass: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 sm:px-5">
        <span className={`h-4 w-1 rounded-full ${accent}`} aria-hidden />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </header>
      <ul className="flex-1 divide-y divide-slate-100 px-4 py-4 sm:px-5">
        {children}
      </ul>
      <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <span className="text-sm font-semibold text-slate-700">
          {totalLabel}
        </span>
        <span className={`text-base font-bold tabular-nums ${totalClass}`}>
          {totalValue}
        </span>
      </footer>
    </section>
  );
}

/* ─────────────────────────────── Main component ────────────────────────────── */

export default function PaySlipModal({
  isOpen,
  paySlip,
  onClose,
  onShowToast,
}: PaySlipModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Close on Escape + lock background scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !paySlip) return null;

  // Uses the historical salary snapshot saved in the PaySlip record
  const storedDailySalary = paySlip.dailySalary ?? 0;
  const storedDailyAllowance = paySlip.dailyAllowance ?? 0;
  const combinedDailyRate = storedDailySalary + storedDailyAllowance;

  const dateRange = getPayPeriodRange(paySlip.payPeriod, paySlip.payPeriodEnd);
  const lateUndertime =
    (paySlip.lateDeduction ?? 0) + (paySlip.undertimeDeduction ?? 0);
  const isNegativeNet = paySlip.netReceivable < 0;

  const handleDownloadPdf = async () => {
    if (!paySlip) return;
    setIsDownloading(true);

    try {
      // Determine if we have a valid database PaySlip ID vs a timestamp/placeholder
      const isRealDbId =
        paySlip.id && paySlip.id < 999000 && paySlip.id !== 999;

      let endpoint = "";
      if (isRealDbId) {
        endpoint = `/Payroll/download-payslip/${paySlip.id}`;
      } else {
        endpoint = `/Payroll/download-payslip/999?payPeriod=${encodeURIComponent(paySlip.payPeriod)}`;
      }

      const response = await api.get(endpoint, { responseType: "blob" });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const rawName = paySlip.employeeName || "Employee";
      const sanitizedName = rawName
        .replace(/,/g, "")
        .trim()
        .replace(/\s+/g, "_");

      const payslipType = paySlip.payPeriod?.includes("15th")
        ? "15th"
        : "14-28";

      const currentDate = new Date().toISOString().split("T")[0];

      link.href = url;
      link.download = `${sanitizedName}_${payslipType}_${currentDate}.pdf`;
      link.click();

      window.URL.revokeObjectURL(url);
      if (onShowToast) onShowToast("Payslip PDF downloaded successfully!");
    } catch {
      if (onShowToast) onShowToast("Failed to download payslip PDF.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payslip-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92dvh] sm:max-w-3xl sm:rounded-2xl"
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={logoNoBg}
              alt="Firefly Crafts PH logo"
              className="h-9 w-auto shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h2
                id="payslip-title"
                className="truncate text-base font-semibold text-slate-900"
              >
                Pay slip
              </h2>
              <p className="truncate text-xs text-slate-500">
                Firefly Crafts PH · {paySlip.payPeriod}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close pay slip"
            className="shrink-0 cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 sm:space-y-5 sm:p-6">
          {/* Employee details */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3 sm:p-5">
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-xs text-slate-500">Employee</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {paySlip.employeeName || "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Pay period</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {dateRange}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Daily rate</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                {peso(combinedDailyRate)}
              </dd>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {peso(storedDailySalary)} base + {peso(storedDailyAllowance)}{" "}
                allowance
              </p>
            </div>
          </dl>

          {/* Net pay — the one thing people look for first */}
          <div
            className={`rounded-xl p-5 sm:p-6 ${
              isNegativeNet
                ? "bg-rose-950 text-white"
                : "bg-slate-900 text-white"
            }`}
          >
            <p className="text-sm text-slate-300">Net pay</p>
            <p
              className={`mt-1 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl ${
                isNegativeNet ? "text-rose-300" : "text-amber-300"
              }`}
            >
              {peso(paySlip.netReceivable)}
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/10 pt-3 text-xs text-slate-300 tabular-nums">
              <span>Earnings {peso(paySlip.grossEarnings)}</span>
              <span aria-hidden>−</span>
              <span>Deductions {peso(paySlip.totalDeductions)}</span>
            </p>
            {isNegativeNet && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-white/10 p-3 text-xs leading-relaxed text-rose-100">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                Deductions are higher than earnings for this period. Check that
                attendance records have been logged.
              </p>
            )}
          </div>

          {/* Earnings & deductions */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
            <SectionCard
              title="Earnings"
              accent="bg-emerald-500"
              totalLabel="Total earnings"
              totalValue={peso(paySlip.grossEarnings)}
              totalClass="text-emerald-700"
            >
              <LineItem label="Basic pay" amount={paySlip.basicPay} />
              <LineItem
                label="Overtime pay"
                hint="Paid at 125%"
                amount={paySlip.overtimePay}
              />
              <LineItem
                label="Regular holiday pay"
                hint="Paid at 200%"
                amount={paySlip.regularHolidayPay}
              />
              <LineItem
                label="Special holiday pay"
                hint="Paid at 130%"
                amount={paySlip.specialHolidayPay}
              />
              {paySlip.leavePay > 0 && (
                <LineItem
                  label="Approved leave pay"
                  amount={paySlip.leavePay}
                />
              )}
            </SectionCard>

            <SectionCard
              title="Deductions"
              accent="bg-rose-500"
              totalLabel="Total deductions"
              totalValue={
                paySlip.totalDeductions > 0
                  ? `-${peso(paySlip.totalDeductions)}`
                  : peso(0)
              }
              totalClass="text-rose-600"
            >
              <LineItem label="Late / undertime" amount={lateUndertime} />
              <LineItem label="Absences" amount={paySlip.absentDeduction} />
              <LineItem
                label="Cash advance"
                amount={paySlip.cashAdvanceDeduction}
              />
              <LineItem
                label="Government contributions"
                amount={paySlip.governmentContributions}
              >
                <div className="mt-2 space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                  <BreakdownRow label="SSS" amount={paySlip.sssDeduction} />
                  <BreakdownRow
                    label="PhilHealth"
                    amount={paySlip.philHealthDeduction}
                  />
                  <BreakdownRow
                    label="Pag-IBIG"
                    amount={paySlip.pagIbigDeduction}
                  />
                </div>
              </LineItem>
            </SectionCard>
          </div>
        </div>

        {/* ── Action footer ── */}
        <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-slate-200 bg-white px-4 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:flex-row sm:px-6 sm:py-4">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-28"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-(--primary) py-3 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-(--primary-hover) active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Preparing PDF...
              </>
            ) : (
              <>
                <Download size={16} /> Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
