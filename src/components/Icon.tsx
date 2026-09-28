import type { SVGProps } from "react";

const paths = {
  search: "M21 21l-5-5M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  bag: "M5 7h14l1 14H4L5 7ZM9 7V5a3 3 0 0 1 6 0v2",
  user: "M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  check: "m5 12 4 4L19 6",
  shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6",
  truck: "M3 5h12v12H3V5Zm12 5h3l3 4v3h-6M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm11 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  zoom: "M21 21l-5-5M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0M7 11h8M11 7v8",
  filter: "M4 7h16M4 17h16M8 4v6M16 14v6",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  dashboard: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  box: "m12 3 9 5v8l-9 5-9-5V8l9-5Zm-9 5 9 5 9-5M12 13v8M7.5 5.5l9 5V15",
  tag: "M3 3h8l10 10-8 8L3 11V3Zm4 4h.01",
  ticket: "M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V7Zm11 0v2m0 3v2m0 3v2",
  image: "M3 3h18v18H3V3Zm0 14 5-5 4 4 3-3 6 6M16 7h.01",
  settings: "M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6",
  external: "M14 3h7v7M21 3l-9 9M10 3H3v18h18v-7",
} as const;

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
