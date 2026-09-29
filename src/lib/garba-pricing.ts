export interface GarbaPricedLine { productId: string; qty: number; unitPrice: number }

// Founder supplied costs: ₹70 including packaging per piece and ₹45 delivery.
// Conservative reserve: 6% of merchandise receipts for fees/tax, ₹25 contribution.
export function garbaMarginSafe(receipts: number, pieces: number): boolean {
  return receipts - pieces * 70 - 45 - Math.ceil(receipts * .06) >= 25;
}

export function garbaApprovedPrice(index: number): number {
  return index === 2 ? 299 : index === 0 || index === 3 ? 1 : 149;
}

/** One redemption, one bundle/gift. Non-eligible lines never subsidise a reward. */
export function garbaDiscount(index: number, eligible: GarbaPricedLine[], gifts: GarbaPricedLine[]): number | null {
  const count = eligible.reduce((n, line) => n + line.qty, 0);
  const subtotal = eligible.reduce((n, line) => n + line.qty * line.unitPrice, 0);
  const giftCount = gifts.reduce((n, line) => n + line.qty, 0);
  if (index === 0 || index === 3) {
    const quantity = index === 0 ? 4 : 2;
    const price = index === 0 ? 399 : 249;
    return count === quantity && subtotal > price ? subtotal - price : null;
  }
  if (index === 1) return count === 3 ? Math.min(...eligible.map(line => line.unitPrice)) : null;
  if (index === 2) return subtotal > 0 ? Math.floor(subtotal / 2) : null;
  if (index === 5) return subtotal >= 599 ? 150 : null;
  if (index === 4 || index === 6) {
    if (giftCount !== 1 || (index === 4 ? subtotal < 499 : count < 3)) return null;
    return gifts[0].unitPrice;
  }
  return null;
}
