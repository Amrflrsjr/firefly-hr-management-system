import { useRef, useState } from "react";
import { X, Coins, Receipt, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
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

const formatCurrency = (val?: number) => {
  const amount = val ?? 0;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

export default function PaySlipModal({
  isOpen,
  paySlip,
  onClose,
  onShowToast,
}: PaySlipModalProps) {
  const modalCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !paySlip) return null;

  const combinedDailyRate = paySlip.dailySalary + (paySlip.dailyAllowance ?? 0);
  const dateRange = getPayPeriodRange(paySlip.payPeriod, paySlip.payPeriodEnd);

  // Compute Running Totals for Earnings
  const basicRunning = paySlip.basicPay;
  const otRunning = basicRunning + paySlip.overtimePay;
  const regHolRunning = otRunning + paySlip.regularHolidayPay;
  const specHolRunning = regHolRunning + paySlip.specialHolidayPay;
  const grossTotal = specHolRunning + paySlip.leavePay;

  // Compute Running Totals for Deductions
  const lateUndertimeRunning =
    (paySlip.lateDeduction ?? 0) + (paySlip.undertimeDeduction ?? 0);
  const absentRunning = lateUndertimeRunning + paySlip.absentDeduction;
  const caRunning = absentRunning + paySlip.cashAdvanceDeduction;
  const totalDeduct = caRunning + paySlip.governmentContributions;

  const handleDownloadImage = async () => {
    if (!modalCardRef.current) return;
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(modalCardRef.current, { cacheBust: true });

      // 1. Sanitize Employee Name (e.g. "Flores, Amar" -> "Flores_Amar")
      const rawName = paySlip.employeeName || "Employee";
      const sanitizedName = rawName
        .replace(/,/g, "")
        .trim()
        .replace(/\s+/g, "_");

      // 2. Format Month/Day and Cutoff Tag
      const endDate = new Date(paySlip.payPeriodEnd);
      const mm = String(endDate.getMonth() + 1).padStart(2, "0");
      const dd = String(endDate.getDate()).padStart(2, "0");
      const periodTag = paySlip.payPeriod.includes("15th") ? "15th" : "30th";

      // 3. Construct Filename: e.g. "Flores_Amar_0915-15th.png"
      const filename = `${sanitizedName}_${mm}${dd}-${periodTag}.png`;

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();

      if (onShowToast) onShowToast("Payslip image downloaded successfully!");
    } catch {
      if (onShowToast)
        onShowToast("Failed to download payslip image.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden space-y-5 p-5 sm:p-7 max-h-[92vh] overflow-y-auto relative">
        {/* Exportable Payslip Container */}
        <div
          ref={modalCardRef}
          className="bg-white p-1 sm:p-2 space-y-5 rounded-xl"
        >
          {/* Header Section */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <img
                src={logoNoBg}
                alt="Firefly Crafts PH Logo"
                className="h-9 sm:h-11 w-auto object-contain shrink-0"
              />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Firefly Crafts PH
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                  Official Pay Slip ({paySlip.payPeriod}) &bull;{" "}
                  <span className="font-semibold text-slate-700">
                    {dateRange}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-right">
                {paySlip.employeeName && (
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    {paySlip.employeeName}
                  </p>
                )}
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                  Daily Rate:{" "}
                  <span className="font-mono font-semibold text-slate-700">
                    PHP {formatCurrency(combinedDailyRate)}
                  </span>
                </p>
              </div>

              {/* Close Button cleanly positioned in the top right */}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Close Preview"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* SIDE-BY-SIDE EARNINGS & DEDUCTIONS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* 1. EARNINGS SECTION */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Coins size={15} className="text-emerald-600" />
                <span>Earnings</span>
              </div>

              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl overflow-x-auto p-3 sm:p-4">
                <table className="w-full text-[11px] sm:text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-200/60 pb-2 text-left">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-right text-slate-500">
                        Running Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    <tr>
                      <td className="py-2">Basic Pay</td>
                      <td className="py-2 text-right font-mono font-semibold">
                        PHP {formatCurrency(paySlip.basicPay)}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500">
                        PHP {formatCurrency(basicRunning)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Overtime Pay (+25%)</td>
                      <td className="py-2 text-right font-mono font-semibold">
                        PHP {formatCurrency(paySlip.overtimePay)}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500">
                        PHP {formatCurrency(otRunning)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Regular Holiday Pay (200%)</td>
                      <td className="py-2 text-right font-mono font-semibold">
                        PHP {formatCurrency(paySlip.regularHolidayPay)}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500">
                        PHP {formatCurrency(regHolRunning)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Special Holiday Pay (130%)</td>
                      <td className="py-2 text-right font-mono font-semibold">
                        PHP {formatCurrency(paySlip.specialHolidayPay)}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500">
                        PHP {formatCurrency(specHolRunning)}
                      </td>
                    </tr>
                    {paySlip.leavePay > 0 && (
                      <tr>
                        <td className="py-2">Approved Leave Pay</td>
                        <td className="py-2 text-right font-mono font-semibold">
                          PHP {formatCurrency(paySlip.leavePay)}
                        </td>
                        <td className="py-2 text-right font-mono text-slate-500">
                          PHP {formatCurrency(grossTotal)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 text-slate-900 font-bold">
                      <td className="pt-2.5 text-xs sm:text-sm">
                        Gross Earnings
                      </td>
                      <td
                        colSpan={2}
                        className="pt-2.5 text-right font-mono text-amber-800 text-xs sm:text-sm"
                      >
                        PHP {formatCurrency(paySlip.grossEarnings)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 2. DEDUCTIONS SECTION */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Receipt size={15} className="text-rose-600" />
                <span>Deductions</span>
              </div>

              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl overflow-x-auto p-3 sm:p-4">
                <table className="w-full text-[11px] sm:text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-200/60 pb-2 text-left">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-right text-slate-500">
                        Running Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    <tr>
                      <td className="py-2">Late / Undertime</td>
                      <td className="py-2 text-right font-mono font-semibold">
                        PHP {formatCurrency(lateUndertimeRunning)}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500">
                        PHP {formatCurrency(lateUndertimeRunning)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Absent Deduction</td>
                      <td className="py-2 text-right font-mono font-semibold">
                        PHP {formatCurrency(paySlip.absentDeduction)}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500">
                        PHP {formatCurrency(absentRunning)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Cash Advance</td>
                      <td className="py-2 text-right font-mono font-semibold">
                        PHP {formatCurrency(paySlip.cashAdvanceDeduction)}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500">
                        PHP {formatCurrency(caRunning)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">
                        Government Benefits
                        <div className="pl-2 pt-0.5 space-y-0.5 text-[10px] sm:text-[11px] text-slate-500 font-normal">
                          <div>
                            &bull; SSS: PHP{" "}
                            {formatCurrency(paySlip.sssDeduction)}
                          </div>
                          <div>
                            &bull; PhilHealth: PHP{" "}
                            {formatCurrency(paySlip.philHealthDeduction)}
                          </div>
                          <div>
                            &bull; Pag-IBIG: PHP{" "}
                            {formatCurrency(paySlip.pagIbigDeduction)}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-right font-mono font-semibold align-top">
                        PHP {formatCurrency(paySlip.governmentContributions)}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500 align-top">
                        PHP {formatCurrency(totalDeduct)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 text-slate-900 font-bold">
                      <td className="pt-2.5 text-xs sm:text-sm">
                        Total Deductions
                      </td>
                      <td
                        colSpan={2}
                        className="pt-2.5 text-right font-mono text-rose-600 text-xs sm:text-sm"
                      >
                        PHP {formatCurrency(paySlip.totalDeductions)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* NET RECEIVABLE BANNER */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Net Receivable
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-900">
              PHP {formatCurrency(paySlip.netReceivable)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex-1 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 py-3 rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Exporting Payslip
                Image...
              </>
            ) : (
              <>
                <Download size={15} /> Download Payslip Image
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="sm:w-32 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
