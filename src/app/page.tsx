import { BriefComposer, HowItWorks } from "@/features/brief";

export default function BriefPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-16 pb-24 sm:px-6 sm:pt-24">
      <section aria-labelledby="brief-heading" className="mx-auto max-w-3xl">
        <p className="text-sm font-medium tracking-widest text-primary uppercase">
          Your AI creative director
        </p>
        <h1
          id="brief-heading"
          className="mt-4 font-display text-5xl leading-[1.05] tracking-tight text-balance sm:text-7xl"
        >
          Describe the film. <em className="text-muted-foreground">Direct the shots.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
          Write a rough idea. Director proposes three creative directions, storyboards every shot,
          and turns the one you pick into video. Remix any single shot without touching the rest.
        </p>

        <div className="mt-10">
          <BriefComposer />
        </div>
      </section>

      <HowItWorks />
    </main>
  );
}
