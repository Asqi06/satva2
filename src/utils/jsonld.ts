/** Escape HTML delimiters so catalogue copy cannot close a JSON-LD script. */
export const jsonLd = (value: unknown): string => JSON.stringify(value).replace(/</g, "\\u003c");
