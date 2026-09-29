/** Shared display terms; the server alone chooses and issues rewards. */
export const GARBA_PRICE = 29;
export const GARBA_CAMPAIGN = "navratri-2026";
export const GARBA_OFFERS = [
  { name: "4 Jewellery @ ₹399", headline: "4 for ₹399", wheel: ["4 PIECES", "₹399"], description: "Unlock 4 selected pieces for just ₹399.", tag: "garba-4-for-399", chance: 18, color: "#93283c" },
  { name: "Buy 2, Get 1 FREE", headline: "2 + 1 free", wheel: ["BUY 2", "GET 1"], description: "Pick 3 eligible pieces. The lowest-priced piece is free.", tag: "garba-buy-2-get-1", chance: 18, color: "#e9a13b" },
  { name: "Flat 50% OFF", headline: "50% off", wheel: ["FLAT", "50% OFF"], description: "Half price on selected clearance jewellery.", tag: "garba-half-price", chance: 10, color: "#28675b" },
  { name: "2 Jewellery @ ₹249", headline: "2 for ₹249", wheel: ["2 PIECES", "₹249"], description: "Choose 2 pieces from the unlocked collection.", tag: "garba-2-for-249", chance: 22, color: "#b94536" },
  { name: "Free Jewellery on ₹499+", headline: "A free piece", wheel: ["₹499+", "FREE PIECE"], description: "Spend ₹499+ on eligible jewellery and add 1 selected gift free.", tag: "garba-free-on-499", chance: 14, color: "#693958" },
  { name: "₹150 OFF on ₹599+", headline: "₹150 off", wheel: ["SAVE", "₹150"], description: "An instant ₹150 saving on your eligible ₹599+ clearance cart.", tag: "garba-150-off", chance: 6, color: "#c57824" },
  { name: "Mystery Bonus Piece FREE", headline: "Mystery gift", wheel: ["BUY 3", "MYSTERY"], description: "Buy any 3 eligible pieces and get 1 surprise jewellery piece free.", tag: "garba-mystery", chance: 12, color: "#354f76" },
] as const;

export function garbaOfferIndex(ticket: number): number {
  if (!Number.isInteger(ticket) || ticket < 0 || ticket >= 100) throw new RangeError("Invalid reward ticket");
  let boundary = 0;
  return GARBA_OFFERS.findIndex(offer => ticket < (boundary += offer.chance));
}

export interface GarbaReward {
  offerIndex: number;
  code: string;
  expiresAt: string;
  gift?: { name: string; slug: string };
}
