export type LineAmountInput = {
  quantity: string | number | { toString(): string };
  unitAmountInr: number;
};

export type DocumentTotals = {
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  remaining: number;
};

export function lineAmountInr(
  quantity: LineAmountInput["quantity"],
  unitAmountInr: number,
): number {
  const raw = typeof quantity === "object" ? quantity.toString() : quantity;
  const qty = Number(raw);
  if (!Number.isFinite(qty) || !Number.isFinite(unitAmountInr)) {
    return 0;
  }
  return Math.round(qty * unitAmountInr);
}

export function documentTotals(input: {
  lines: LineAmountInput[];
  taxRateBps: number;
  taxInclusive: boolean;
  payments?: { amountInr: number }[];
}): DocumentTotals {
  const subtotal = input.lines.reduce(
    (sum, line) => sum + lineAmountInr(line.quantity, line.unitAmountInr),
    0,
  );
  const rate = Math.max(0, input.taxRateBps);
  let tax = 0;
  let total = subtotal;

  if (rate > 0) {
    if (input.taxInclusive) {
      tax = Math.round((subtotal * rate) / (10_000 + rate));
      total = subtotal;
    } else {
      tax = Math.round((subtotal * rate) / 10_000);
      total = subtotal + tax;
    }
  }

  const paid = (input.payments ?? []).reduce((sum, payment) => sum + payment.amountInr, 0);

  return {
    subtotal,
    tax,
    total,
    paid,
    remaining: total - paid,
  };
}
