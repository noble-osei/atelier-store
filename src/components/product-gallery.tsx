"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Image as ImageData } from "@/lib/images";

// Phones: full-width swipe carousel with position dots.
// Tablet and up: images stacked in one column beside the sticky info panel.
export function ProductGallery({
  images,
  name,
}: {
  images: ImageData[];
  name: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goTo(index: number) {
    const track = trackRef.current;
    track?.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <section aria-label={`${name} images`}>
      <ul
        ref={trackRef}
        onScroll={handleScroll}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain md:flex-col md:gap-grid md:overflow-visible"
      >
        {images.map((image, i) => (
          <li
            key={image.src}
            className="w-full shrink-0 snap-start"
            aria-label={`Image ${i + 1} of ${images.length}`}
          >
            <div className="media-product">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={i === 0}
                sizes="(min-width: 48rem) 58vw, 100vw"
              />
            </div>
          </li>
        ))}
      </ul>

      {images.length > 1 ? (
        <div className="mt-2 flex justify-center gap-1 md:hidden">
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className="grid size-6 place-items-center"
            >
              <span
                className={`h-px w-4 transition-colors duration-300 ${i === active ? "bg-ink" : "bg-ink/30"}`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
