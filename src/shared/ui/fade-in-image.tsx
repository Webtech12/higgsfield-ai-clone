"use client";

import { useState, type ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

type FadeInImageProps = Omit<ComponentProps<"img">, "src"> & {
  src: string;
  /**
   * How it arrives once loaded: a soft fade, or a wipe from the top, like a print coming out of the
   * developer (storyboard frames, ADR-028).
   */
  reveal?: "fade" | "wipe";
};

/**
 * An image that arrives once it has loaded, over a soft shimmer, instead of popping into an empty
 * box. Its parent must be positioned. It remembers which source loaded, so a new source (say, a
 * redrawn frame) shimmers again until it arrives.
 */
export function FadeInImage({
  src,
  alt,
  className,
  onLoad,
  reveal = "fade",
  ...props
}: FadeInImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const isLoaded = loadedSrc === src;

  return (
    <>
      {isLoaded ? null : (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-linear-to-br from-muted via-accent to-muted opacity-70"
        />
      )}
      {/* Plain <img>: media from our own origin or Blob storage. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        src={src}
        alt={alt}
        // An image that finished before hydration fires no load event, so check when it mounts.
        ref={(img) => {
          if (img?.complete && img.naturalWidth > 0) setLoadedSrc(src);
        }}
        onLoad={(event) => {
          setLoadedSrc(src);
          onLoad?.(event);
        }}
        className={cn(
          isLoaded ? "opacity-100" : "opacity-0",
          reveal === "fade" && "transition-opacity duration-700 ease-out-quart",
          reveal === "wipe" && isLoaded && "animate-wipe",
          className,
        )}
      />
    </>
  );
}
