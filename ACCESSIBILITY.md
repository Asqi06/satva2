# Accessibility (WCAG-minded)

- Semantic HTML (`header/main/nav/footer`, headings in order, lists for listings).
- Keyboard: all actions reachable/operable, visible focus states, no keyboard traps, skip-to-content link.
- Forms: `<label>` for every input, described errors (`aria-describedby`), error summary on checkout, input `autocomplete` attributes.
- Buttons vs links: real `<button>` for actions (add to cart), real `<a>` for navigation.
- Media: `alt` text on all product images; decorative images `alt=""`.
- Contrast: text ≥ 4.5:1 (3:1 for large text); don't convey state by color alone (stock, errors).
- Motion: `prefers-reduced-motion` respected for carousels/animations.
- Live regions for cart toast / order status updates (`aria-live="polite"`).
