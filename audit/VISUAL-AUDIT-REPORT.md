# SatvaStones visual and mobile audit

Verified on the live deployment, 1 October 2026, using the in-app browser at desktop 1280 px and mobile 390 × 844 px. Evidence: `screenshots/home-desktop-1280.jpg`, `screenshots/home-mobile-390.jpg`, `screenshots/product-mobile-390.jpg`.

Homepage H1 and collection CTA are visible above the mobile fold. Product image delivery is sharp and reserves layout space. No horizontal overflow was observed on the homepage or sampled product (`innerWidth=390`, document scroll width 375 with the browser scrollbar).

**Fail: mobile header touch height.** Menu/search/bag boxes are 44 × 24 px. The base-layer mobile link/button rule wins over component sizing. Correct the layer conflict and verify computed 44–48 px targets. Footer links are generally 36 px and several informational links 24 px; prioritize header and purchase interactions first.

**Warning: weak homepage identity.** H1 is the campaign title `Rings`. Use a stable, descriptive brand H1 and subordinate campaign heading.

**Opportunity: mobile product purchase visibility.** On `/products/mini-glass-jar-gift-hamper-red-ribbon`, H1 spans approximately y=694–761; price and add-to-cart appear below the 844 px fold after the gallery. Test a more compact summary/purchase interaction without compromising the jewellery imagery.

This is a sample-based visual inspection, not a claim that every route/breakpoint is accessible. Mobile viewport override was reset after inspection.
