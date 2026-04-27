/**
 * Recurring → Payables generator
 * ─────────────────────────────────
 * Pure functions that compute payable instances from recurringCosts rules.
 *
 * Key concept: each (rule, period) pair must be idempotent.
 * The generated payable carries `recurringCostId` + `recurringPeriod` so
 * a second run for the same period skips already-created instances.
 */

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Format a (year, month) pair as "YYYY-MM" — used as `recurringPeriod` field.
 */
export const periodKey = (year, month) =>
  `${year}-${String(month).padStart(2, '0')}`;

/**
 * Friendly label: "Mayo 2026"
 */
export const periodLabel = (year, month) =>
  `${MONTH_NAMES[month - 1]} ${year}`;

/**
 * Compute the due date for a rule in a given period.
 * Snaps dayOfMonth to the last day of the month if the month has fewer days.
 */
export const dueDateForPeriod = (rule, year, month) => {
  const dayPref = Math.max(1, Math.min(31, Number(rule.dayOfMonth) || 1));
  // Last day of the target month
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(dayPref, lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * Determine if a rule applies to a given (year, month) based on its
 * frequency, startDate and endDate.
 */
export const ruleAppliesToPeriod = (rule, year, month) => {
  if (!rule.active) return false;

  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0); // last day of period

  // startDate gating
  if (rule.startDate) {
    const start = new Date(rule.startDate);
    if (start > periodEnd) return false;
  }
  // endDate gating
  if (rule.endDate) {
    const end = new Date(rule.endDate);
    if (end < periodStart) return false;
  }

  switch (rule.frequency) {
    case 'monthly':
      return true;
    case 'biweekly':
    case 'weekly':
      // For now, biweekly/weekly are treated as monthly for instance generation
      // (one instance per month with the agg amount). This matches the
      // monthlyEquivalent semantics used in the dashboard.
      return true;
    case 'quarterly': {
      // Apply on months where the rule's startDate month + 3k falls
      if (!rule.startDate) {
        // No start date → apply on Jan/Apr/Jul/Oct by default
        return month % 3 === 1;
      }
      const startMonth = new Date(rule.startDate).getMonth() + 1; // 1..12
      return ((month - startMonth) % 3 + 3) % 3 === 0 && month >= startMonth;
    }
    case 'yearly': {
      const startMonth = rule.startDate
        ? new Date(rule.startDate).getMonth() + 1
        : 1; // default January
      return month === startMonth;
    }
    default:
      return false;
  }
};

/**
 * Compute the amount per instance for a rule in this period.
 * For weekly/biweekly we still produce ONE monthly instance with the
 * monthly-equivalent amount, to match the projection semantics.
 */
export const amountForPeriod = (rule) => {
  const a = Number(rule.amount) || 0;
  switch (rule.frequency) {
    case 'biweekly':
      return a * 2.1666; // 26 / 12
    case 'weekly':
      return a * 4.3333; // 52 / 12
    default:
      return a;
  }
};

/**
 * Build a "preview" of payable instances for a given period.
 * No side effects; returns objects ready to be persisted.
 *
 * existingPayables is the current `payables` collection state (from
 * usePayables). Used to mark each candidate as `existing` (already created)
 * or `new` (will be created).
 */
export const computeInstancesForPeriod = ({
  rules,
  existingPayables,
  year,
  month,
}) => {
  const period = periodKey(year, month);
  const instances = [];

  for (const rule of rules || []) {
    if (!ruleAppliesToPeriod(rule, year, month)) continue;

    const dueDate = dueDateForPeriod(rule, year, month);
    const amount = amountForPeriod(rule);
    const exists = (existingPayables || []).some(
      (p) =>
        p.recurringCostId === rule.id &&
        p.recurringPeriod === period &&
        p.status !== 'cancelled' &&
        p.status !== 'void',
    );

    instances.push({
      recurringCostId: rule.id,
      recurringPeriod: period,
      ownerType: rule.ownerType,
      ownerId: rule.ownerId,
      ownerName: rule.ownerName,
      concept: rule.concept,
      counterpartyName: rule.counterpartyName,
      amount,
      dueDate,
      issueDate: dueDate,
      costCenterId: rule.costCenterId || '',
      projectId: rule.projectId || '',
      description: `${rule.concept} — ${rule.ownerName} — ${periodLabel(year, month)}`,
      notes: rule.notes || '',
      existing: exists,
    });
  }

  return instances;
};

/**
 * Convert a preview instance to the payable payload shape expected by
 * Firestore (subset of what createPayable accepts, plus the recurring meta).
 */
export const instanceToPayablePayload = (instance) => ({
  vendor: instance.counterpartyName || instance.ownerName || instance.concept,
  description: instance.description,
  amount: instance.amount,
  issueDate: instance.issueDate,
  dueDate: instance.dueDate,
  costCenterId: instance.costCenterId,
  projectId: instance.projectId,
  notes: instance.notes,
  // Extra fields written directly to Firestore for traceability:
  recurringCostId: instance.recurringCostId,
  recurringPeriod: instance.recurringPeriod,
  source: 'recurring',
});

/**
 * Stats helper for the preview panel.
 */
export const summarizeInstances = (instances) => {
  const newOnes = instances.filter((i) => !i.existing);
  const existing = instances.filter((i) => i.existing);
  const totalNew = newOnes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalExisting = existing.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  return {
    newCount: newOnes.length,
    existingCount: existing.length,
    totalNew,
    totalExisting,
    grandTotal: totalNew + totalExisting,
  };
};
