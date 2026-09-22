import { useState } from "react";
import { X, Download, Loader2, Coins, Receipt } from "lucide-react";
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
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !paySlip) return null;

  // Uses the historical salary snapshot saved in the PaySlip record
  const storedDailySalary = paySlip.dailySalary ?? 0;
  const storedDailyAllowance = paySlip.dailyAllowance ?? 0;
  const combinedDailyRate = storedDailySalary + storedDailyAllowance;

  const dateRange = getPayPeriodRange(paySlip.payPeriod, paySlip.payPeriodEnd);

  // Running Totals for Earnings
  const basicRunning = paySlip.basicPay;
  const otRunning = basicRunning + paySlip.overtimePay;
  const regHolRunning = otRunning + paySlip.regularHolidayPay;
  const specHolRunning = regHolRunning + paySlip.specialHolidayPay;
  const grossTotal = specHolRunning + paySlip.leavePay;

  // Running Totals for Deductions
  const lateUndertimeRunning =
    (paySlip.lateDeduction ?? 0) + (paySlip.undertimeDeduction ?? 0);
  const absentRunning = lateUndertimeRunning + paySlip.absentDeduction;
  const caRunning = absentRunning + paySlip.cashAdvanceDeduction;
  const totalDeduct = caRunning + paySlip.governmentContributions;

  const handleDownloadPdf = async () => {
    if (!paySlip?.id) return;
    setIsDownloading(true);

    try {
      const response = await api.get(
        `/Payroll/download-payslip/${paySlip.id}`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const rawName = paySlip.employeeName || "Employee";
      const sanitizedName = rawName
        .replace(/,/g, "")
        .trim()
        .replace(/\s+/g, "_");

      link.href = url;
      link.download = `Payslip_${sanitizedName}.pdf`;
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={logoNoBg}
              alt="Firefly Crafts PH Logo"
              className="h-8 w-auto object-contain"
            />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Official Pay Slip Preview
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {paySlip.payPeriod} &bull; {dateRange}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
            title="Close Preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
            {/* Company Branding & Employee Details Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoNoBg}
                  alt="Logo"
                  className="h-9 w-auto object-contain"
                />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Firefly Crafts PH
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {paySlip.payPeriod} ({dateRange})
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Employee Name
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {paySlip.employeeName || "N/A"}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-1">
                  Daily Rate:{" "}
                  <strong className="font-mono text-slate-700">
                    ₱{formatCurrency(combinedDailyRate)}{" "}
                    {/* <-- Ensure this uses combinedDailyRate */}
                  </strong>
                </span>
              </div>
            </div>

            {/* SIDE-BY-SIDE EARNINGS & DEDUCTIONS TABLES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Earnings Section */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <Coins size={14} className="text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Earnings
                  </h4>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-200 pb-2 text-left text-[10px] uppercase tracking-wider">
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Amount</th>
                        <th className="pb-2 text-right text-slate-400">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="py-2.5">Basic Pay</td>
                        <td className="py-2.5 text-right font-mono font-semibold">
                          ₱{formatCurrency(paySlip.basicPay)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-400">
                          ₱{formatCurrency(basicRunning)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5">Overtime Pay (+25%)</td>
                        <td className="py-2.5 text-right font-mono font-semibold">
                          ₱{formatCurrency(paySlip.overtimePay)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-400">
                          ₱{formatCurrency(otRunning)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5">Regular Holiday (200%)</td>
                        <td className="py-2.5 text-right font-mono font-semibold">
                          ₱{formatCurrency(paySlip.regularHolidayPay)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-400">
                          ₱{formatCurrency(regHolRunning)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5">Special Holiday (130%)</td>
                        <td className="py-2.5 text-right font-mono font-semibold">
                          ₱{formatCurrency(paySlip.specialHolidayPay)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-400">
                          ₱{formatCurrency(specHolRunning)}
                        </td>
                      </tr>
                      {paySlip.leavePay > 0 && (
                        <tr>
                          <td className="py-2.5">Approved Leave Pay</td>
                          <td className="py-2.5 text-right font-mono font-semibold">
                            ₱{formatCurrency(paySlip.leavePay)}
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-400">
                            ₱{formatCurrency(grossTotal)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 text-slate-900 font-bold bg-slate-50/50">
                        <td className="py-3 px-3 text-xs uppercase tracking-wider">
                          Gross Earnings
                        </td>
                        <td
                          colSpan={2}
                          className="py-3 px-3 text-right font-mono text-amber-800 text-sm font-black"
                        >
                          ₱{formatCurrency(paySlip.grossEarnings)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <Receipt size={14} className="text-rose-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Deductions
                  </h4>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-200 pb-2 text-left text-[10px] uppercase tracking-wider">
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Amount</th>
                        <th className="pb-2 text-right text-slate-400">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="py-2.5">Late / Undertime</td>
                        <td className="py-2.5 text-right font-mono font-semibold">
                          ₱{formatCurrency(lateUndertimeRunning)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-400">
                          ₱{formatCurrency(lateUndertimeRunning)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5">Absent Deduction</td>
                        <td className="py-2.5 text-right font-mono font-semibold">
                          ₱{formatCurrency(paySlip.absentDeduction)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-400">
                          ₱{formatCurrency(absentRunning)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5">Cash Advance</td>
                        <td className="py-2.5 text-right font-mono font-semibold">
                          ₱{formatCurrency(paySlip.cashAdvanceDeduction)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-400">
                          ₱{formatCurrency(caRunning)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 align-top">
                          Government Benefits
                          <div className="pl-2 pt-1.5 space-y-1 text-[11px] text-slate-500 font-normal">
                            <div>
                              &bull; SSS: ₱
                              {formatCurrency(paySlip.sssDeduction)}
                            </div>
                            <div>
                              &bull; PhilHealth: ₱
                              {formatCurrency(paySlip.philHealthDeduction)}
                            </div>
                            <div>
                              &bull; Pag-IBIG: ₱
                              {formatCurrency(paySlip.pagIbigDeduction)}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold align-top">
                          ₱{formatCurrency(paySlip.governmentContributions)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-400 align-top">
                          ₱{formatCurrency(totalDeduct)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 text-slate-900 font-bold bg-slate-50/50">
                        <td className="py-3 px-3 text-xs uppercase tracking-wider">
                          Total Deductions
                        </td>
                        <td
                          colSpan={2}
                          className="py-3 px-3 text-right font-mono text-rose-600 text-sm font-black"
                        >
                          -₱{formatCurrency(paySlip.totalDeductions)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* NET RECEIVABLE BANNER */}
            <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/60 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-900/70 block">
                  Final Net Receivable
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Gross earnings less all deductions.
                </span>
              </div>
              <span className="font-mono text-xl sm:text-2xl font-black text-slate-950">
                ₱{formatCurrency(paySlip.netReceivable)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex-1 bg-(--primary) hover:bg-(--primary-hover) text-slate-950 py-3 rounded-lg font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Downloading
                PDF...
              </>
            ) : (
              <>
                <Download size={15} /> Download Payslip PDF
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="sm:w-28 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-lg font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
