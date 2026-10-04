import type { AdHeader } from "@/entities/project";
import { FadeInImage } from "@/shared/ui";

/** The brief behind an ad, at a glance: its format, the product and its photos, and who's cast. */
export function AdHeaderStrip({ header }: { header: AdHeader }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
      <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
        {header.format}
      </span>
      {header.productPhotos.length > 0 ? (
        <ul className="flex -space-x-2" aria-label={`Photos of ${header.productName}`}>
          {header.productPhotos.map((url, index) => (
            <li
              key={url}
              className="relative size-9 overflow-hidden rounded-md border-2 border-background bg-muted"
            >
              <FadeInImage
                src={url}
                alt={`${header.productName}, photo ${String(index + 1)}`}
                className="absolute inset-0 size-full object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}
      {header.cast ? (
        <span className="flex items-center gap-2">
          <span className="relative size-9 overflow-hidden rounded-full border border-border bg-muted">
            <FadeInImage
              src={header.cast.photoUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </span>
          <span>
            <span className="text-muted-foreground">Starring </span>
            {header.cast.name}
          </span>
        </span>
      ) : null}
    </div>
  );
}
