import { Building2, X } from "lucide-react";

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
}

export default function PaySlipModal({
  isOpen,
  paySlip,
  onClose,
}: PaySlipModalProps) {
  if (!isOpen || !paySlip) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden space-y-6 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" /> Firefly Crafts
              PH
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Pay Slip ({paySlip.payPeriod})
            </p>
          </div>
          <div className="flex items-start gap-4">
            <div className="text-right">
              {paySlip.employeeName && (
                <p className="font-semibold text-slate-900 text-sm">
                  {paySlip.employeeName}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-0.5">
                Daily Salary: PHP {(paySlip.dailySalary ?? 0).toFixed(2)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Detailed Earnings & Deductions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          {/* Earnings Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
              Earnings
            </h3>
            <div className="space-y-2 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span>Basic Pay:</span>
                <span className="font-medium text-slate-900">
                  PHP {(paySlip.basicPay ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Overtime Pay (+25%):</span>
                <span className="font-medium text-slate-900">
                  PHP {(paySlip.overtimePay ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Regular Holiday Pay (200%):</span>
                <span className="font-medium text-slate-900">
                  PHP {(paySlip.regularHolidayPay ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Special Holiday Pay (130%):</span>
                <span className="font-medium text-slate-900">
                  PHP {(paySlip.specialHolidayPay ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold border-t border-slate-200 pt-2 text-slate-900">
                <span>Gross Earnings:</span>
                <span className="text-blue-600">
                  PHP {(paySlip.grossEarnings ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Deductions Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
              Deductions
            </h3>
            <div className="space-y-2 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span>Late / Undertime:</span>
                <span className="font-medium text-slate-900">
                  PHP{" "}
                  {(
                    (paySlip.lateDeduction ?? 0) +
                    (paySlip.undertimeDeduction ?? 0)
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Absent Deduction:</span>
                <span className="font-medium text-slate-900">
                  PHP {(paySlip.absentDeduction ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cash Advance:</span>
                <span className="font-medium text-slate-900">
                  PHP {(paySlip.cashAdvanceDeduction ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Government Benefits:</span>
                <span className="font-medium text-slate-900">
                  PHP {(paySlip.governmentContributions ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold border-t border-slate-200 pt-2 text-slate-900">
                <span>Total Deductions:</span>
                <span className="text-rose-600">
                  PHP {(paySlip.totalDeductions ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Receivable Banner */}
        <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
          <span className="font-bold text-blue-900 text-sm">
            Net Receivable:
          </span>
          <span className="text-xl font-bold text-blue-600">
            PHP {(paySlip.netReceivable ?? 0).toFixed(2)}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-medium text-xs hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
}
