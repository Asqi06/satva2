# Garba Ghumar — Navratri 2026

Page: `/garba-ghumar`. Payment: ₹29, one spin per signed-in account per campaign.
Every captured payment earns a unique, account-bound reward coupon, valid 30 days,
and a shared `Nav29` entitlement: ₹29 off ₹599+, one use per account, no expiry.
Coupons cannot stack. No cash prizes. Preview spins issue nothing.

## Anonymous demo

Open `/garba-ghumar/demo`. No sign-in, database or payment is required.
Use “Test a reward” to choose any of the seven offers, then “Spin demo wheel”.
Results are explicitly labelled previews and cannot be redeemed. The proxy derives
the demo marker from that exact URL; incoming demo headers are stripped elsewhere.
Real account, checkout and payment APIs keep their existing authentication checks.

For a local Atlas `querySrv ETIMEOUT`, `.env.local` now uses the verified standard
`mongodb://` seed list, with TLS and the original database/authentication options.
This bypasses SRV/TXT lookups rather than changing Windows DNS or credentials.
If Atlas migrates the cluster hosts, obtain a fresh standard URI from Atlas.
Remote deployments keep their own environment configuration.

## Founder-approved collections

In Admin → Products → Edit (or New product), use the **Garba Ghumar offers**
checkboxes below Price & inventory to select approved clearance offers, then save.
Existing offer tags appear checked automatically. Multiple paid offers may be
selected; **Use as a free reward gift** is a separate, mutually exclusive choice.
The checkboxes maintain the campaign tags automatically and preserve other tags.
Price requirements appear next to each offer; a selected underpriced product is
flagged and still excluded by the server until its price meets the requirement.
The first version supports products without variants; each gift is a physical
cart item, reserved and fulfilled through the normal order/inventory flow.
Customers add the selected gift through their reward guide; checkout then applies
the qualifying reward automatically. The mystery gift is chosen server-side and
revealed with the reward, with a button in the guide to add that item.

## Guided redemption

The winner’s “Use my reward” button opens their selected collection. Quick-add
buttons build the bag, and an account-based guide in the collection, cart and
checkout reports missing quantities/spend and offers approved gift add buttons.
`GET /api/garba-ghumar/benefit` derives this from the paid spin, issued coupon,
server cart and current product eligibility. It never trusts a browser-supplied code.
Checkout applies the verified reward automatically and recalculates when the cart
changes. Payment waits for the reward check and a qualifying selection; customers
can explicitly choose a different coupon instead. Only one coupon is sent to the
order service, which revalidates eligibility and prices as before.
Demo spins never create redeemable benefits or call the benefit API.

| Reward | Product tag | Conditions | Odds |
| --- | --- | --- | --- |
| 4 Jewellery @ ₹399 | `garba-4-for-399` | Exactly 4 eligible pieces; selected subtotal above ₹399 | 18% |
| Buy 2, Get 1 FREE | `garba-buy-2-get-1` | Exactly 3 eligible pieces; cheapest free; each priced ₹149+ | 18% |
| Flat 50% OFF | `garba-half-price` | Selected pieces priced ₹299+; integer rupee rounding | 10% |
| 2 Jewellery @ ₹249 | `garba-2-for-249` | Exactly 2 eligible pieces; selected subtotal above ₹249 | 22% |
| Free Jewellery on ₹499+ | `garba-free-on-499` | ₹499+ eligible paid subtotal; paid pieces ₹149+; one selected gift | 14% |
| ₹150 OFF on ₹599+ | `garba-150-off` | ₹599+ eligible clearance subtotal; pieces ₹149+ | 6% |
| Mystery Bonus Piece FREE | `garba-mystery` | Buy 3+ eligible pieces priced ₹149+; one server-selected gift | 12% |

Tag low-cost, non-variant gifts `garba-gift`. Keep at least one gift in stock.
Do not tag gifts into paid-piece collections. At issuance, the allowed product IDs
are saved into each coupon. New stock IDs added later do not expand an existing
coupon; keep issued selections redeemable or arrange a replacement/refund.
Do not remove tags, unpublish products or raise prices after issuance without
considering customers with earned rewards. A bought spin with temporary issuance
failure stays pending and can recover via the page or webhook retries.

## Margin assumptions

Founder supplied: ₹70 cost per physical piece including packaging, ₹45 delivery.
The server requires ₹25 contribution after subtracting those costs and a 6%
reserve for payment fees/tax from discounted eligible merchandise receipts.
Regular cart items cannot subsidise an unsafe promotion. Delivery receipts and
the spin fee are excluded from margin calculations. This also checks Nav29.
The ₹29 fee is not treated as profit because it creates a ₹29 future liability.
This is an assumption-based margin check, not an accounting guarantee: returns,
changed costs, tax rates, marketing expenses or remote-area surcharges may differ.
Update `src/lib/garba-pricing.ts` if costs change before accepting new spins.

₹399 bundle contribution: ₹399 − ₹280 − ₹45 − ₹24 reserve = ₹50.
₹249 bundle: ₹249 − ₹140 − ₹45 − ₹15 reserve = ₹49.
Buy 2 Get 1 at ₹149 each: ₹298 − ₹210 − ₹45 − ₹18 reserve = ₹25.
50% off a ₹299 piece: ₹150 receipt − ₹70 − ₹45 − ₹9 reserve = ₹26.

## Launch

`GARBA_PAID_SPINS_ENABLED=false` by default. Keep it disabled until the promotion
has payment-provider clearance and applicable legal review. Razorpay's published
terms prohibit games of chance: https://razorpay.com/terms/ . A guaranteed coupon
does not establish that paid chance-based rewards are approved.

Configure all seven tagged collections and gift stock; verify costs, taxes,
payment keys, MongoDB replica set (transactions) and existing Razorpay webhook.
Only then set `GARBA_PAID_SPINS_ENABLED=true` in the server environment and rebuild.
The creation endpoint also enforces the flag and stock readiness. Verify/recovery
remain available when new purchases are disabled.

Amount, ownership, signature, currency and captured payment status are checked
on the server. Random rewards use Node crypto, not browser randomness. Coupon
issuance is transactional and payment retries cannot reroll a paid reward.
Verified `payment.captured` webhooks recover interrupted checkout. A processed
refund revokes reward and Nav29 eligibility; already consumed benefits are not
automatically clawed back. Any spin refund prevents a new spin for that campaign.
Disable individual issued coupons through the existing admin coupon manager;
campaign financial terms cannot be edited there.
