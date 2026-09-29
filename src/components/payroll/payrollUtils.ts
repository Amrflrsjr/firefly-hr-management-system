export type PayPeriodType = "15th" | "30th";

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  dailySalary: number;
  dailyAllowance: number;
  hasGovernmentDeductions?: boolean;
  deductionType?: string;
  isAdmin?: boolean;
}

export interface PayrollParams {
  daysWorked: number;
  approvedLeaveHours: number;
  overtimeHours: number;
  regularHolidayHours: number;
  specialNonWorkingHours: number;
  lateHours: number;
  undertimeHours: number;
  absentDays: number;
  cashAdvanceDeduction: number;
}
export type PayrollParamKey = keyof PayrollParams;

export const EMPTY_PARAMS: PayrollParams = {
  daysWorked: 0,
  approvedLeaveHours: 0,
  overtimeHours: 0,
  regularHolidayHours: 0,
  specialNonWorkingHours: 0,
  lateHours: 0,
  undertimeHours: 0,
  absentDays: 0,
  cashAdvanceDeduction: 0,
};

/** Coerces an API response into a fully-numeric params object (no nulls/undefined). */
export function normalizeParams(data: unknown): PayrollParams {
  const src = (data ?? {}) as Record<string, unknown>;
  const out = { ...EMPTY_PARAMS };
  (Object.keys(out) as PayrollParamKey[]).forEach((k) => {
    out[k] = Number(src[k]) || 0;
  });
  return out;
}

export const AMOUNT_KEYS = [
  "dailySalary",
  "basicPay",
  "overtimePay",
  "regularHolidayPay",
  "specialHolidayPay",
  "leavePay",
  "grossEarnings",
  "lateDeduction",
  "undertimeDeduction",
  "absentDeduction",
  "cashAdvanceDeduction",
  "sssDeduction",
  "philHealthDeduction",
  "pagIbigDeduction",
  "governmentContributions",
  "totalDeductions",
  "netReceivable",
] as const;

export type PayrollAmounts = Record<(typeof AMOUNT_KEYS)[number], number>;

export interface PaySlipHistoryItem extends PayrollAmounts {
  id: number;
  payPeriod: string;
  payPeriodEnd: string;
}

export function pickAmounts(src: Partial<PayrollAmounts>): PayrollAmounts {
  const out = {} as PayrollAmounts;
  AMOUNT_KEYS.forEach((k) => {
    out[k] = src[k] ?? 0;
  });
  return out;
}

export const PERIOD_LABEL: Record<PayPeriodType, string> = {
  "15th": "15th Pay Period",
  "30th": "End of Month",
};

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

/** Actual calendar range of a cutoff for the month containing `ref`. */
export function getPeriodRange(type: PayPeriodType, ref = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  if (type === "15th") {
    const prev = new Date(y, m - 1, 1);
    const startDay = Math.min(
      29,
      daysInMonth(prev.getFullYear(), prev.getMonth()),
    );
    return {
      start: new Date(prev.getFullYear(), prev.getMonth(), startDay),
      end: new Date(y, m, 13),
    };
  }
  return { start: new Date(y, m, 14), end: new Date(y, m, 28) };
}

export function formatPeriodRange(type: PayPeriodType, ref = new Date()) {
  const { start, end } = getPeriodRange(type, ref);
  const f = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  });
  return `${f.format(start)} – ${f.format(end)}, ${end.getFullYear()}`;
}

export function findCurrentRecord<
  T extends { payPeriod: string; payPeriodEnd: string },
>(items: T[], type: PayPeriodType): T | undefined {
  const month = new Date().getMonth();
  return items.find((p) => {
    const label = p.payPeriod?.toLowerCase() ?? "";
    const matches =
      label.includes(type) ||
      (type === "30th" && label.includes("end of month"));
    return matches && new Date(p.payPeriodEnd).getMonth() === month;
  });
}

export const peso = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function estimatePayroll(
  emp: Employee,
  p: PayrollParams,
  payPeriodType: PayPeriodType = "15th",
) {
  const dailyAllowance = emp.dailyAllowance || 0;
  const actualDailyRate = (emp.dailySalary || 0) + dailyAllowance; // D5 equivalent

  const basicPay = actualDailyRate * p.daysWorked;
  const overtimePay = (p.overtimeHours / 8.0) * actualDailyRate * 1.25; // 125% multiplier
  const regularHolidayPay =
    (p.regularHolidayHours / 8.0) * actualDailyRate * 2.0;
  const specialHolidayPay =
    (p.specialNonWorkingHours / 8.0) * actualDailyRate * 1.3;
  const leavePay = (p.approvedLeaveHours / 8.0) * actualDailyRate;

  const gross =
    basicPay + overtimePay + regularHolidayPay + specialHolidayPay + leavePay;

  const lateDeduction = (p.lateHours / 8.0) * actualDailyRate;
  const undertimeDeduction = (p.undertimeHours / 8.0) * actualDailyRate;
  const absentDeduction = p.absentDays * actualDailyRate;

  let sss = 0;
  let philHealth = 0;
  let pagIbig = 0;

  if (emp.hasGovernmentDeductions) {
    const monthlySss = 720.0;
    const monthlyPhilHealth = 360.0;
    const monthlyPagIbig = 100.0;

    if (emp.deductionType === "Per Pay Period") {
      sss = monthlySss / 2.0;
      philHealth = monthlyPhilHealth / 2.0;
      pagIbig = monthlyPagIbig / 2.0;
    } else if (emp.deductionType === "Every 15th Pay Period") {
      if (payPeriodType === "15th") {
        sss = monthlySss;
        philHealth = monthlyPhilHealth;
        pagIbig = monthlyPagIbig;
      } else {
        sss = 0;
        philHealth = 0;
        pagIbig = 0;
      }
    } else {
      // Monthly / End of Month
      if (payPeriodType !== "15th") {
        sss = monthlySss;
        philHealth = monthlyPhilHealth;
        pagIbig = monthlyPagIbig;
      } else {
        sss = 0;
        philHealth = 0;
        pagIbig = 0;
      }
    }
  }

  const govt = sss + philHealth + pagIbig;

  const deductions =
    lateDeduction +
    undertimeDeduction +
    absentDeduction +
    p.cashAdvanceDeduction +
    govt;
  const rawNet = gross - deductions;

  return {
    basicPay: round2(basicPay),
    overtimePay: round2(overtimePay),
    regularHolidayPay: round2(regularHolidayPay),
    specialHolidayPay: round2(specialHolidayPay),
    leavePay: round2(leavePay),
    lateDeduction: round2(lateDeduction),
    undertimeDeduction: round2(undertimeDeduction),
    absentDeduction: round2(absentDeduction),
    cashAdvance: round2(p.cashAdvanceDeduction),
    govt: round2(govt),
    sss: round2(sss),
    philHealth: round2(philHealth),
    pagIbig: round2(pagIbig),
    gross: round2(gross),
    deductions: round2(deductions),
    net: Math.max(0, round2(rawNet)),
    isNegative: rawNet < 0,
  };
}

export const HIGH_OVERTIME_HOURS = 30;
