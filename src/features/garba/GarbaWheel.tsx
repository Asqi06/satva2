"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { GARBA_OFFERS, GARBA_PRICE, type GarbaReward } from "@/lib/garba-offers";
import { loadRazorpay } from "@/features/checkout/razorpay-checkout";
import styles from "./garba.module.css";

const STEP = 360 / GARBA_OFFERS.length;

async function request<T>(url: string, body?: object): Promise<T> {
  const res = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Something went wrong. Please try again.");
  return json.data as T;
}

function Rangoli({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    {Array.from({ length: 12 }, (_, i) => <g key={i} transform={`rotate(${i * 30} 100 100)`}>
      <path d="M100 25 Q127 57 100 80 Q73 57 100 25Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M100 5 Q114 20 100 33 Q86 20 100 5Z" fill="currentColor" opacity=".5" />
      <circle cx="100" cy="17" r="2" fill="currentColor" />
    </g>)}
    <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" />
    <circle cx="100" cy="100" r="19" fill="none" stroke="currentColor" />
    <path d="M100 85 L104 96 L115 100 L104 104 L100 115 L96 104 L85 100 L96 96Z" fill="currentColor" />
  </svg>;
}

function Wheel({ rotation, spinning }: { rotation: number; spinning: boolean }) {
  return <div className={styles.wheelStage}>
    <Rangoli className={styles.wheelHalo} />
    <div className={styles.pointer} aria-hidden="true">◆</div>
    <div className={`${styles.wheel} ${spinning ? styles.spinning : ""}`} style={{ transform: `rotate(${rotation}deg)` }}>
      <svg viewBox="0 0 500 500" role="img" aria-label="Seven festive jewellery offers, including bundles, discounts and free pieces. Full terms and odds are listed below.">
        {GARBA_OFFERS.map((offer, i) => {
          const a = (i * STEP - 90) * Math.PI / 180;
          const b = ((i + 1) * STEP - 90) * Math.PI / 180;
          return <g key={offer.name}>
            <path d={`M250 250 L${250 + 242 * Math.cos(a)} ${250 + 242 * Math.sin(a)} A242 242 0 0 1 ${250 + 242 * Math.cos(b)} ${250 + 242 * Math.sin(b)} Z`} fill={offer.color} stroke="#f1cc86" strokeWidth="2" />
            <g transform={`rotate(${i * STEP + STEP / 2} 250 250)`} fill="#fff6df" textAnchor="middle">
              <text x="250" y="62" fontSize="19">✦</text>
              <text x="250" y="104" fontSize="18" letterSpacing="1">{offer.wheel[0]}</text>
              <text x="250" y="139" fontSize={offer.wheel[1].length > 8 ? 18 : offer.wheel[1].length > 6 ? 21 : 25} fontWeight="700">{offer.wheel[1]}</text>
            </g>
          </g>;
        })}
        <circle cx="250" cy="250" r="238" fill="none" stroke="#f1cc86" strokeWidth="3" strokeDasharray="2 12" />
      </svg>
    </div>
    <div className={styles.wheelHub} aria-hidden="true"><span>शुभ</span><small>SATVASTONES</small></div>
    <div className={styles.wheelBase} aria-hidden="true" />
  </div>;
}

export function GarbaWheel({ paymentsEnabled, demoMode = false }: { paymentsEnabled: boolean; demoMode?: boolean }) {
  const { data: session, status } = useSession();
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<"idle" | "paying" | "spinning">("idle");
  const [reward, setReward] = useState<GarbaReward | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [refunded, setRefunded] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [demoOffer, setDemoOffer] = useState("random");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const busy = phase !== "idle";

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (phase === "idle" && (reward || previewIndex !== null)) resultRef.current?.focus({ preventScroll: true });
  }, [phase, reward, previewIndex]);
  useEffect(() => {
    if (demoMode || status !== "authenticated") return;
    let cancelled = false;
    async function restore() {
      setChecking(true);
      try {
        const data = await request<{ reward: GarbaReward | null; refunded: boolean }>("/api/garba-ghumar");
        if (!cancelled) { setReward(data.reward); setRefunded(data.refunded); }
      } catch (error) { if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not load your saved reward."); }
      finally { if (!cancelled) setChecking(false); }
    }
    void restore();
    return () => { cancelled = true; };
  }, [status, demoMode]);

  function animate(index: number, earned?: GarbaReward) {
    setPhase("spinning");
    setMessage("");
    setPreviewIndex(null);
    const target = 360 - (index + .5) * STEP;
    setRotation(previous => previous + 360 * 6 + (target - previous % 360 + 360) % 360);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => {
      if (earned) setReward(earned); else setPreviewIndex(index);
      setPhase("idle");
    }, reduced ? 50 : 5300);
  }

  async function refreshReward() {
    setChecking(true);
    setMessage("");
    try {
      const data = await request<{ reward: GarbaReward | null; refunded: boolean }>("/api/garba-ghumar");
      setReward(data.reward); setRefunded(data.refunded);
      if (!data.reward) setMessage(data.refunded ? "This spin was refunded; its coupons are no longer available." : "No captured payment found yet. Please check again shortly.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not check payment."); }
    finally { setChecking(false); }
  }

  async function pay() {
    if (demoMode || busy || checking || reward || !accepted || !paymentsEnabled) return;
    setPhase("paying"); setMessage("");
    try {
      await loadRazorpay();
      const order = await request<{ keyId: string; orderId: string; amount: number; currency: string }>("/api/garba-ghumar", {});
      if (!window.Razorpay) throw new Error("Payment window could not load. Please try again.");
      const checkout = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
        name: "SatvaStones", description: "Garba Ghumar • One festive spin",
        prefill: { name: session?.user?.name ?? undefined, email: session?.user?.email ?? undefined },
        theme: { color: "#93283c" },
        modal: { ondismiss: () => { setPhase("idle"); setMessage("Checkout closed. If you paid, check your payment below before trying again."); } },
        handler: response => {
          void request<{ reward: GarbaReward }>("/api/garba-ghumar/verify", {
            razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature,
          }).then(data => animate(data.reward.offerIndex, data.reward)).catch(error => {
            setPhase("idle"); setMessage(`${error instanceof Error ? error.message : "Verification is pending."} Use Check my payment to recover your reward.`);
          });
        },
      });
      checkout.open();
    } catch (error) { setPhase("idle"); setMessage(error instanceof Error ? error.message : "Payment could not start."); }
  }

  async function copy(code: string) {
    try { await navigator.clipboard.writeText(code); setMessage(`${code} copied. Apply it at checkout on an eligible order.`); }
    catch { setMessage(`Your code is ${code}. You can select and copy it below.`); }
  }

  const shownIndex = reward?.offerIndex ?? previewIndex;
  const shownOffer = shownIndex === null ? null : GARBA_OFFERS[shownIndex];
  return <div className={styles.page}>
    <div className={styles.toran} aria-hidden="true">{Array.from({ length: 19 }, (_, i) => <span key={i}><i /><b /></span>)}</div>
    <div className={styles.topline}><span>नवरात्रि उत्सव</span><span>NINE NIGHTS. A LITTLE EXTRA SPARKLE.</span><span>शुभ लाभ</span></div>
    <section className={styles.hero} aria-labelledby="garba-title">
      <div className={styles.intro}>
        <p className={styles.eyebrow}><span /> THE SATVASTONES NAVRATRI EDIT</p>
        <h1 id="garba-title">Garba<br /><em>Ghumar</em><span className={styles.titleEnd}>wheel</span></h1>
        <p className={styles.subtitle}>A little twirl.<br />A little shagun. A lot of festive joy.</p>
        <p className={styles.description}>Dress up for dandiya nights with a little extra saving. One ₹{GARBA_PRICE} spin, one festive offer — and your ₹29 <strong>Nav29</strong> coupon, always yours to use later.</p>
        <div className={styles.heroPills}><span>✦ 7 festive offers</span><span>✦ A reward every spin</span><span>✦ No-expiry Nav29</span></div>
        <div className={styles.shagunTicket}><span>₹29<small>ONE FESTIVE SPIN</small></span><p>Plus ₹29 back as a coupon.<br /><strong>A little gift for your next favourite.</strong></p></div>
        <div className={styles.heroJourney} aria-label="Your reward journey"><span><b>01</b> Give it a twirl</span><i>✦</i><span><b>02</b> Pick your pieces</span><i>✦</i><span><b>03</b> Save automatically</span></div>
        <a href="#festive-offers" className={styles.textLink}>Explore the offers <span>↗</span></a>
        <Rangoli className={styles.introArt} />
      </div>
      <div className={styles.playArea}>
        <div className={styles.wheelCaption}>✦ &nbsp; LET THE FESTIVITIES GO ROUND &nbsp; ✦</div>
        <Wheel rotation={rotation} spinning={phase === "spinning"} />
        <div className={styles.controls}>
          {!paymentsEnabled && <p className={styles.previewNotice}>{demoMode ? "Demo mode · no account, payment or real coupons." : "The celebration is coming soon. Try a free preview!"}</p>}
          {demoMode && <label className={styles.demoSelect}>Test a reward<select value={demoOffer} onChange={e => setDemoOffer(e.target.value)} disabled={busy}><option value="random">Surprise me</option>{GARBA_OFFERS.map((offer, i) => <option value={i} key={offer.name}>{offer.name}</option>)}</select></label>}
          {paymentsEnabled && !reward && !refunded && <label className={styles.consent}><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} disabled={busy} />I agree to the <a href="#wheel-terms">offer terms</a> and ₹29 spin fee.</label>}
          {paymentsEnabled && status === "unauthenticated" ? <Link className={styles.mainButton} href="/login?callbackUrl=%2Fgarba-ghumar">Sign in to spin · ₹29 <span>↗</span></Link>
            : paymentsEnabled ? <button className={styles.mainButton} onClick={pay} disabled={busy || checking || status === "loading" || !!reward || refunded || !accepted}>{checking ? "Checking your payment…" : phase === "paying" ? "Completing payment…" : phase === "spinning" ? "Your shagun is on its way…" : reward ? "Your festive reward is saved ✦" : refunded ? "Spin refunded" : "Pay ₹29 & spin the wheel"}<span>↗</span></button> : null}
          <button className={paymentsEnabled ? styles.previewButton : styles.mainButton} onClick={() => animate(demoMode && demoOffer !== "random" ? Number(demoOffer) : Math.floor(Math.random() * GARBA_OFFERS.length))} disabled={busy || checking || !!reward}>{phase === "spinning" ? "Round and round…" : demoMode ? "Spin demo wheel" : "Try a free preview"}{!paymentsEnabled && <span>↗</span>}</button>
          <p className={styles.controlNote}>One paid spin per account. Preview spins don’t issue coupons.</p>
          {!demoMode && status === "authenticated" && <button className={styles.previewButton} disabled={busy || checking} onClick={refreshReward}>Check my payment & saved reward</button>}
          <p className={styles.status} role="status">{message}</p>
        </div>
      </div>
    </section>

    <div ref={resultRef} tabIndex={-1} className={shownOffer ? styles.result : styles.hiddenResult} aria-live="polite">
      {shownOffer && <><div className={styles.rewardSeal} aria-hidden="true">✦</div><p className={styles.eyebrow}>{reward ? "IT’S YOUR MOMENT TO SHINE" : "PREVIEW ONLY · NO COUPON ISSUED"}</p>
        <h2>{shownOffer.name} ✦</h2><p>{shownOffer.description}</p>
        <div className={styles.revealSteps}><span><b>1</b> Open your selected collection</span><span><b>2</b> Follow your bag’s reward guide</span><span><b>3</b> Your saving applies at checkout</span></div>
        {reward ? <><p className={styles.autoAppliedNote}>✓ Saved to your account. No coupon code to remember.</p>
          <Link href={`/garba-ghumar/collection?offer=${reward.offerIndex}`} className={styles.claimButton}>Use my reward <span>↗</span></Link>
          <p>Use once by {new Date(reward.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}. We’ll show exactly what to add.</p>
          {reward.gift && <p>Your mystery piece is <strong>{reward.gift.name}</strong>. Your reward guide will help you add it.</p>}
          <details className={styles.codeDetails}><summary>View my reward code</summary><div className={styles.rewardCode}><code>{reward.code}</code><button onClick={() => copy(reward.code)}>Copy code</button></div></details>
        </> : <p>This is a sample result. A paid winner gets a guided collection and automatic savings at checkout.</p>}
      </>}
    </div>

    <section className={styles.guarantee} aria-labelledby="nav29-title">
      <div className={styles.guaranteeSymbol} aria-hidden="true">✦</div>
      <div><p className={styles.eyebrow}>A LITTLE SOMETHING, ALWAYS</p><h2 id="nav29-title">Your ₹29 comes back as <em>shagun.</em></h2><p>Every paid spin includes ₹29 off a future ₹599+ jewellery order. No expiry. Use it whenever your next favourite finds you.</p><small>One use per account after a verified paid spin. Use on a separate order from your wheel reward.</small></div>
      <div className={styles.coupon}><span>YOUR GUARANTEED COUPON</span><strong>Nav29</strong><button onClick={() => copy("Nav29")}>{reward ? "Copy my coupon ↗" : "Copy code ↗"}</button><small>{reward ? "Unlocked · no expiry" : "Unlocks after a paid spin"}</small></div>
    </section>

    <div className={styles.festivalRibbon} aria-hidden="true">TWIRL INTO SOMETHING LOVELY <span>✦</span> LITTLE PIECES, BIG FESTIVE ENERGY <span>✦</span> YOUR SHAGUN AWAITS</div>
    <section id="festive-offers" className={styles.offers} aria-labelledby="offers-title">
      <p className={styles.eyebrow}>SEVEN REASONS TO TWIRL</p><h2 id="offers-title">A wheel full of <em>little joys.</em></h2><p>Every spin lands on an offer. Pick your jewellery, meet the minimum spend, and let your shagun do the rest.</p>
      <div className={styles.offerGrid}>{GARBA_OFFERS.map((offer, i) => <article className={styles.offerCard} style={{ borderTopColor: offer.color }} key={offer.name}>
        <div className={styles.offerTop}><span style={{ color: offer.color }}>✦</span><small>FESTIVE SHAGUN / 0{i + 1}</small></div>
        <h3>{offer.headline}</h3><p>{offer.description}</p><footer>{offer.chance}% chance <span>Single use</span></footer>
      </article>)}</div>
      <p className={styles.oddsNote}>Each section is shown equally for the design; reward probabilities differ and are listed above. Your reward is chosen securely after payment.</p>
    </section>

    <section className={styles.steps} aria-label="How it works">{[["01", "Make a little shagun", "Sign in and pay ₹29 once when paid spins open."], ["02", "Find your festive favourites", "Win an offer, then follow your personal guide to pick eligible pieces."], ["03", "Let us do the saving", "Your wheel reward applies automatically when your cart qualifies. Keep Nav29 for later."]].map(([n, title, body]) => <div key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></div>)}</section>

    <section id="wheel-terms" className={styles.terms}><h2>The little details</h2><ul>
      <li>₹29 buys one spin per signed-in account for the 2026 Navratri campaign. Every captured payment earns one wheel coupon and one Nav29 entitlement.</li>
      <li>Wheel rewards expire 30 days after issuance. Nav29 has no expiry and gives ₹29 off a ₹599+ order, once per eligible account.</li>
      <li>Minimum spend applies to the jewellery subtotal before this coupon; shipping is excluded. Delivery charges and free-delivery thresholds follow the usual store policy.</li>
      <li>One coupon per order. Wheel rewards and Nav29 cannot be combined with another coupon or each other. Coupons are account-bound, have no cash value and cannot be transferred.</li>
      <li>Wheel rewards apply only to the unlocked, selected clearance collection. Bundles require exactly 4 or 2 eligible pieces. Buy 2 Get 1 requires exactly 3, with the cheapest free. Each free-piece reward covers one approved gift added to your cart.</li>
      <li>For the ₹499 and ₹599 offers, the minimum is the eligible merchandise subtotal, excluding the free gift, delivery and other products. Mystery gifts are selected and revealed with your reward.</li>
      <li>Closing the page doesn’t lose a verified reward. Sign back in here to retrieve it. Refunded spins revoke unused coupon eligibility.</li>
      <li>Free previews are for the experience only. They require no payment and create no redeemable reward.</li>
    </ul><Link href="/contact">Need a hand? Contact SatvaStones ↗</Link></section>
    <div className={styles.signoff}>Made for nights that sparkle. <span>शुभ नवरात्रि ✦</span></div>
  </div>;
}
