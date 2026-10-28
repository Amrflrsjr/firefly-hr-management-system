import { useState, useEffect } from "react";
import api from "../services/api";
import {
  Gift,
  Calculator,
  Download,
  Receipt,
  Calendar as CalendarIcon,
} from "lucide-react";
import Toast from "../components/Toast";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
}

interface PaySlipRecord {
  id: number;
  payPeriod: string;
  payPeriodEnd: string;
  basicPay: number;
}

export default function ThirteenthMonth() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [result, setResult] = useState<{
    employeeName: string;
    totalBasicPayEarned: number;
    thirteenthMonthPay: number;
    payslipCount: number;
    payslips: PaySlipRecord[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    api
      .get("/Employees")
      .then((res) => {
        const nonAdmins = res.data.filter((e: Employee) => !e.isAdmin);
        setEmployees(nonAdmins);
        if (nonAdmins.length > 0) setSelectedEmployee(String(nonAdmins[0].id));
      })
      .catch(() => {
        setToast({ text: "Failed to load employees.", type: "error" });
      });
  }, []);

  const handleCalculate = async () => {
    if (!selectedEmployee) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await api.get(
        `/Payroll/thirteenth-month/${selectedEmployee}`,
        {
          params: { year },
        },
      );
      setResult(res.data);
    } catch {
      setToast({ text: "Failed to calculate 13th month pay.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPeso = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // --- NEW CSV EXPORT FUNCTION ---
  const handleExportCSV = () => {
    if (!result) return;

    // 1. Define the headers
    const headers = ["Pay Period", "Date Generated", "Basic Pay (PHP)"];

    // 2. Map the data rows
    const rows = result.payslips.map((slip) => [
      `"${slip.payPeriod}"`,
      `"${formatDate(slip.payPeriodEnd)}"`,
      slip.basicPay.toFixed(2),
    ]);

    // 3. Add a summary row at the bottom
    rows.push([
      `"TOTAL BASIC PAY"`,
      `""`,
      result.totalBasicPayEarned.toFixed(2),
    ]);
    rows.push([
      `"13TH MONTH PAY (Total / 12)"`,
      `""`,
      result.thirteenthMonthPay.toFixed(2),
    ]);

    // 4. Combine into CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // 5. Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    // Clean up filename: e.g., "Allera_Carmelyn_13thMonth_2026.csv"
    const safeName = result.employeeName.replace(/[\s,]+/g, "_");
    link.setAttribute("download", `${safeName}_13thMonth_${year}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up memory
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
          <Gift size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            13th Month Computer
          </h1>
          <p className="text-sm text-slate-500">
            Calculate the statutory 13th-month pay based on total earned basic
            salary.
          </p>
        </div>
      </div>

      {/* Input Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Employee
          </label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.lastName}, {emp.firstName}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-48">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Calendar Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors"
          >
            <option value={new Date().getFullYear()}>
              {new Date().getFullYear()}
            </option>
            <option value={new Date().getFullYear() - 1}>
              {new Date().getFullYear() - 1}
            </option>
          </select>
        </div>
        <button
          onClick={handleCalculate}
          disabled={isLoading || !selectedEmployee}
          className="h-11 w-full sm:w-auto px-6 flex justify-center items-center gap-2 rounded-xl bg-(--primary) text-sm font-bold text-slate-950 hover:bg-(--primary-hover) disabled:opacity-50 transition-colors shadow-sm"
        >
          {isLoading ? (
            "Calculating..."
          ) : (
            <>
              <Calculator size={18} /> Calculate
            </>
          )}
        </button>
      </div>

      {/* Results Dashboard */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Receipt size={80} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Total Basic Pay Earned
              </p>
              <p className="text-3xl font-black font-mono text-slate-800">
                {formatPeso(result.totalBasicPayEarned)}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Based on {result.payslipCount} payslips in {year}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600">
                <Gift size={80} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
                13th Month Pay Payout
              </p>
              <p className="text-3xl font-black font-mono text-amber-900">
                {formatPeso(result.thirteenthMonthPay)}
              </p>
              <p className="text-xs text-amber-700/70 mt-2 font-medium">
                Total Basic Pay ÷ 12 Months
              </p>
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon size={16} className="text-slate-400" />
                Included Payslips
              </h3>
              <button
                onClick={handleExportCSV}
                className="text-xs font-semibold text-slate-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Pay Period</th>
                    <th className="px-5 py-3 font-semibold">Date Generated</th>
                    <th className="px-5 py-3 font-semibold text-right">
                      Basic Pay
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(result.payslips || []).map((slip) => (
                    <tr
                      key={slip.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {slip.payPeriod}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {formatDate(slip.payPeriodEnd)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">
                        {formatPeso(slip.basicPay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-5 py-3 text-right text-slate-600"
                    >
                      Total Sum:
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-900">
                      {formatPeso(result.totalBasicPayEarned)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toast?.text || null}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
