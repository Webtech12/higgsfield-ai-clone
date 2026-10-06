const STEPS = [
  {
    title: "Brief it",
    body: "Pick a proven format, add your product photos, and let Polish with AI sharpen the copy.",
  },
  {
    title: "Cast real talent",
    body: "Choose a creator from the roster. Everyone on it signed a release to appear in AI-made ads.",
  },
  {
    title: "Compare three concepts",
    body: "Each has its own hook, look and storyboard, with your talent and your product in every frame.",
  },
  {
    title: "Finish the ad",
    body: "The concept you choose becomes lifelike video, shot by shot, ready to download and post.",
  },
] as const;

/**
 * How it works, as a white band like the ones on Citrus Talent's site: a change of light that marks
 * a new chapter of the page (ADR-028).
 */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="surface-light">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-xs font-semibold tracking-[0.22em] text-primary-ink uppercase">
          How it works
        </p>
        <h2
          id="how-it-works"
          className="mt-4 max-w-3xl font-display text-4xl leading-[0.95] font-semibold tracking-[-0.035em] sm:text-6xl"
        >
          From brief to finished ad in four moves.
        </h2>
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-border pt-6">
              <span className="font-display text-5xl font-semibold tracking-[-0.04em] text-primary-ink tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
