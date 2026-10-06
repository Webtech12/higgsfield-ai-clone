import type { AdHeader } from "@/entities/project";
import { FadeInImage } from "@/shared/ui";

const CREDIT_CLASS =
  "flex items-center gap-3.5 rounded-2xl border border-border bg-card/60 p-2.5 pr-5";
const LABEL_CLASS = "text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase";
const NAME_CLASS = "mt-0.5 font-display text-lg leading-tight font-semibold";

/** The brief behind an ad at a glance, like a film's credits: who's starring, and the product. */
export function AdHeaderStrip({ header }: { header: AdHeader }) {
  return (
    <dl className="flex flex-wrap gap-3 lg:justify-end">
      {header.cast ? (
        <div className={CREDIT_CLASS}>
          <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
            <FadeInImage
              src={header.cast.photoUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </span>
          <div>
            <dt className={LABEL_CLASS}>Starring</dt>{" "}
            <dd className={NAME_CLASS}>{header.cast.name}</dd>
          </div>
        </div>
      ) : null}
      <div className={CREDIT_CLASS}>
        {header.productPhotos.length > 0 ? (
          <ul className="flex -space-x-5" aria-label={`Photos of ${header.productName}`}>
            {header.productPhotos.map((url, index) => (
              <li
                key={url}
                className="relative size-14 overflow-hidden rounded-xl border-2 border-card bg-muted"
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
        <div>
          <dt className={LABEL_CLASS}>Product</dt>{" "}
          <dd className={NAME_CLASS}>{header.productName}</dd>
        </div>
      </div>
    </dl>
  );
}
