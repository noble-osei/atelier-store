"use client";

import type { ImageLoaderProps } from "next/image";

// next/image loader (wired up in next.config.ts). Unsplash resizes on its own
// CDN, so each <img> asks it for exactly the width it needs instead of making
// the Next server download multi-megabyte originals to resize them.
// Other sources are served as-is: extend this when real product images move
// to their own storage.
export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src.startsWith("https://images.unsplash.com/")) return src;

  const url = new URL(src);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  return url.toString();
}
