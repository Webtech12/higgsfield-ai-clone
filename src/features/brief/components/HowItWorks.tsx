const STEPS = [
  {
    title: "Write a rough idea",
    body: "One sentence is enough. No prompt engineering, no model to pick.",
  },
  {
    title: "Compare three directions",
    body: "Each comes with its own look and three storyboarded shots, side by side.",
  },
  {
    title: "Produce the one you like",
    body: "Every approved frame becomes the first frame of its shot, so you get what you saw.",
  },
  {
    title: "Remix one shot",
    body: "Fix the shot that's off without touching the rest. Every version is kept.",
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
