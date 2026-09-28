"use client";
import { useRef, useState } from "react";
import { CloudinaryImage as Image } from "@/components/CloudinaryImage";
import { Icon } from "@/components/Icon";

export function ProductGallery({ images, productName }: { images: { secureUrl: string; alt: string }[]; productName: string }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const zoom = useRef<HTMLDialogElement>(null);
  const current = images[active];
  const select = (index: number) => { setActive(index); track.current?.scrollTo({ left: index * track.current.clientWidth, behavior: "auto" }); };
  const close = () => { zoom.current?.close(); document.body.style.overflow = ""; };
  if (!current) return <div className="flex aspect-[4/5] items-center justify-center bg-cream text-sm text-muted">Photo unavailable</div>;
  return <div className="min-w-0">
    <div className="relative">
      <div ref={track} role="region" aria-label="Product image gallery" tabIndex={0} onKeyDown={e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); select((active + (e.key === "ArrowRight" ? 1 : -1) + images.length) % images.length); } }} onScroll={e => { if (window.innerWidth < 1024) setActive(Math.max(0, Math.min(images.length - 1, Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth)))); }} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[3px] lg:block">
        {images.map((image, index) => <div key={image.secureUrl} className={`relative aspect-[4/5] w-full shrink-0 snap-start bg-cream ${index === active ? "lg:block" : "lg:hidden"}`}><Image src={image.secureUrl} alt={image.alt || `${productName}, view ${index + 1}`} fill priority={index === 0} sizes="(min-width: 1280px) 576px, (min-width: 1024px) calc((100vw - 128px) / 2), calc(100vw - 32px)" className="object-cover" /></div>)}
      </div>
      <button type="button" onClick={() => { zoom.current?.showModal(); document.body.style.overflow = "hidden"; }} aria-label="View larger product photo" className="icon-button absolute bottom-3 right-3 bg-white"><Icon name="zoom" /></button>
    </div>
    {images.length > 1 && <div className="mt-3 flex items-center gap-2"><div role="group" aria-label="Product images" className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">{images.map((image, index) => <button type="button" key={image.secureUrl} onClick={() => select(index)} aria-pressed={index === active} aria-label={`View image ${index + 1}`} className={`relative h-16 w-14 shrink-0 border bg-cream ${index === active ? "border-ink" : "border-transparent opacity-70"}`}><Image src={image.secureUrl} alt="" fill sizes="56px" className="object-cover" /></button>)}</div><p className="shrink-0 text-xs text-muted">{active + 1} / {images.length}</p></div>}
    <dialog ref={zoom} aria-label="Larger product photo" onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }} className="m-auto h-[90dvh] w-[95vw] max-w-5xl bg-white">
      <div className="relative h-full"><Image src={current.secureUrl} alt={current.alt || productName} fill sizes="(min-width: 1024px) 1024px, 95vw" className="object-contain" /><button type="button" className="icon-button absolute right-3 top-3 bg-white" onClick={close} aria-label="Close larger photo"><Icon name="close" /></button></div>
    </dialog>
  </div>;
}
