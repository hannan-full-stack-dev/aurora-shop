// Tiny localStorage "order database" so the account page has real history to show.
const KEY = 'aurora-orders-v1';

export function getOrders() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writeOrders(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* storage unavailable */
  }
}

export function saveOrder(order) {
  writeOrders([order, ...getOrders()]);
}

// What the customer has actually paid so far (older orders without payment info count as fully paid).
export const paidAmount = (o) => o.totals?.payNow ?? o.totals?.total ?? 0;

// Cancel policy: card orders are refunded in full. For cash-on-delivery orders the advance delivery
// fee is kept (non-refundable), so a cancelled COD order never costs the company money.
export function cancelOrder(id) {
  let result = null;
  const next = getOrders().map((o) => {
    if (o.id !== id || o.status === 'cancelled') return o;
    const paid = paidAmount(o);
    const refund = o.payment === 'cod' ? 0 : paid;
    result = { ...o, status: 'cancelled', cancelledAt: new Date().toISOString(), refund, feeKept: +(paid - refund).toFixed(2) };
    return result;
  });
  writeOrders(next);
  return result;
}
