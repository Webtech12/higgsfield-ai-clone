import { AspectRatio } from "@/contracts/brief";
import { renderFrameSvg } from "@/server/integrations/fake";

export const runtime = "nodejs";

/** Placeholder storyboard frames for PROVIDERS=fake. Deterministic, so they cache forever. */
export function GET(request: Request): Response {
  const params = new URL(request.url).searchParams;
  const ratio = AspectRatio.catch("16:9").parse(params.get("ratio"));
  const svg = renderFrameSvg({
    seed: params.get("seed") ?? "seed",
    ratio,
    title: (params.get("title") ?? "Untitled shot").slice(0, 60),
    subtitle: (params.get("subtitle") ?? "").slice(0, 40),
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
