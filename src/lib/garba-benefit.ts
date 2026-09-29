export interface GarbaGift {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image?: { secureUrl: string; alt: string };
}

export interface GarbaBenefit {
  offerIndex: number;
  code: string;
  valid: boolean;
  discount: number;
  message: string;
  progress: number;
  eligibleProductIds: string[];
  giftCount: number;
  gifts: GarbaGift[];
}

export function garbaProgress(index: number, count: number, subtotal: number, gifts: number): { message: string; progress: number } {
  const target = index === 0 ? 4 : index === 3 ? 2 : index === 1 || index === 6 ? 3 : 1;
  if (index === 4 || index === 5) {
    const minimum = index === 4 ? 499 : 599;
    if (subtotal < minimum) return { message: `Add ₹${minimum - subtotal} more from your unlocked collection${index === 4 ? ", then choose your free piece" : ""}.`, progress: Math.min(90, subtotal / minimum * 90) };
  } else {
    if (count < target) return { message: `Add ${target - count} more eligible ${target - count === 1 ? "piece" : "pieces"}${index === 6 ? ", then add your mystery gift" : " to unlock your reward"}.`, progress: count / target * 90 };
    if ([0, 1, 3].includes(index) && count > target) return { message: `Keep exactly ${target} eligible pieces in your bag for this offer. Remove ${count - target} eligible ${count - target === 1 ? "piece" : "pieces"}.`, progress: 90 };
  }
  if (index === 4 || index === 6) {
    if (gifts === 0) return { message: index === 6 ? "Your three pieces are ready. Add your mystery gift below." : "Your spend qualifies. Choose one free piece below.", progress: 90 };
    if (gifts > 1) return { message: "Keep just one reward gift in your bag. Remove the extra gift pieces to qualify.", progress: 90 };
  }
  return { message: "Your selection is ready. We’ll check your reward at checkout.", progress: 95 };
}
