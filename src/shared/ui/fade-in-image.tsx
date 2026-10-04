"use client";

import { useState, type ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

type FadeInImageProps = Omit<ComponentProps<"img">, "src"> & { src: string };

/**
 * An image that fades in once it has loaded, over a soft shimmer, instead of popping into an empty
 * box. Its parent must be positioned. It remembers which source loaded, so a new source (say, a
 * redrawn frame) shimmers again until it arrives.
 */
export function FadeInImage({ src, alt, className, onLoad, ...props }: FadeInImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const isLoaded = loadedSrc === src;

  return (
    <>
      {isLoaded ? null : (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-linear-to-br from-muted via-accent to-muted opacity-60"
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
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </>
  );
}
