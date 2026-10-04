const STEPS = [
  {
    title: "Brief it like a pro",
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
    title: "Finish and refine",
    body: "The chosen concept becomes a finished ad with music and an end card. Refine it, then download.",
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="mt-24">
      <h2
        id="how-it-works"
        className="text-sm font-medium tracking-widest text-muted-foreground uppercase"
      >
        How it works
      </h2>
      <ol className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="bg-background p-5">
            <span className="font-display text-3xl text-primary">{index + 1}</span>
            <h3 className="mt-3 font-medium">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
