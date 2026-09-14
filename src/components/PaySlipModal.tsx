import { useRef, useState } from "react";
import { Building2, X, Coins, Receipt, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

export interface PaySlipData {
  id: number;
  payPeriod: string;
  payPeriodEnd: string;
  employeeName?: string;
  dailySalary: number;
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

export default function PaySlipModal({
  isOpen,
  paySlip,
  onClose,
  onShowToast,
}: PaySlipModalProps) {
  const modalCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !paySlip) return null;

  const handleDownloadImage = async () => {
    if (!modalCardRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(modalCardRef.current, { cacheBust: true });

      // 1. Format Employee Name (e.g. "Flores, Amar" -> "Flores_Amar")
      const rawName = paySlip.employeeName || "Employee";
      const sanitizedName = rawName
        .replace(/,/g, "")
        .trim()
        .replace(/\s+/g, "_");

      // 2. Format Date (YYYY-MM-DD)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      // 3. Construct filename: e.g. "Payslip_Flores_Amar_2026-09-15.png"
      const filename = `Payslip_${sanitizedName}_${formattedDate}.png`;

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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden space-y-6 p-5 sm:p-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Exportable Payslip Container */}
        <div ref={modalCardRef} className="bg-white p-2 rounded-xl space-y-5">
          {/* Header Section */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={20} className="text-blue-600 shrink-0" />{" "}
                Firefly Crafts PH
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Official Pay Slip ({paySlip.payPeriod})
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-right hidden sm:block">
                {paySlip.employeeName && (
                  <p className="font-bold text-slate-900 text-sm">
                    {paySlip.employeeName}
                  </p>
                )}
                <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">
                  Daily Rate: PHP {formatCurrency(paySlip.dailySalary)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Preview"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Mobile Employee Banner */}
          {paySlip.employeeName && (
            <div className="sm:hidden bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900">
                {paySlip.employeeName}
              </span>
              <span className="font-mono text-slate-500">
                Daily: PHP {formatCurrency(paySlip.dailySalary)}
              </span>
            </div>
          )}

          {/* Detailed Earnings & Deductions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Earnings Section */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Coins size={14} className="text-emerald-600" /> Earnings
              </h3>
              <div className="space-y-2 text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 font-medium">
                <div className="flex justify-between">
                  <span>Basic Pay:</span>
                  <span className="font-mono font-bold text-slate-900">
                    PHP {formatCurrency(paySlip.basicPay)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime Pay (+25%):</span>
                  <span className="font-mono font-bold text-slate-900">
                    PHP {formatCurrency(paySlip.overtimePay)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Regular Holiday Pay (200%):</span>
                  <span className="font-mono font-bold text-slate-900">
                    PHP {formatCurrency(paySlip.regularHolidayPay)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Special Holiday Pay (130%):</span>
                  <span className="font-mono font-bold text-slate-900">
                    PHP {formatCurrency(paySlip.specialHolidayPay)}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-slate-900">
                  <span>Gross Earnings:</span>
                  <span className="font-mono text-blue-600">
                    PHP {formatCurrency(paySlip.grossEarnings)}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions Section */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Receipt size={14} className="text-rose-600" /> Deductions
              </h3>
              <div className="space-y-2 text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 font-medium">
                <div className="flex justify-between">
                  <span>Late / Undertime:</span>
                  <span className="font-mono font-bold text-slate-900">
                    PHP{" "}
                    {formatCurrency(
                      (paySlip.lateDeduction ?? 0) +
                        (paySlip.undertimeDeduction ?? 0),
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Absent Deduction:</span>
                  <span className="font-mono font-bold text-slate-900">
                    PHP {formatCurrency(paySlip.absentDeduction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Advance:</span>
                  <span className="font-mono font-bold text-slate-900">
                    PHP {formatCurrency(paySlip.cashAdvanceDeduction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Government Benefits:</span>
                  <span className="font-mono font-bold text-slate-900">
                    PHP {formatCurrency(paySlip.governmentContributions)}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-slate-900">
                  <span>Total Deductions:</span>
                  <span className="font-mono text-rose-600">
                    PHP {formatCurrency(paySlip.totalDeductions)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Receivable Banner */}
          <div className="bg-blue-50/80 p-4 rounded-2xl flex justify-between items-center border border-blue-200/60">
            <span className="font-bold text-blue-900 text-xs uppercase tracking-wider">
              Net Receivable:
            </span>
            <span className="text-xl font-bold font-mono text-blue-600">
              PHP {formatCurrency(paySlip.netReceivable)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Exporting
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
