import { serve } from "inngest/next";
import type { NextRequest } from "next/server";

import { getModules } from "@/server/container";
import { inngest } from "@/server/platform/inngest";

export const runtime = "nodejs";

// Built on first request: registering functions needs the container, which needs configuration.
let handlers: ReturnType<typeof serve> | undefined;
const getHandlers = () =>
  (handlers ??= serve({ client: inngest, functions: getModules().workflows }));

type Context = Parameters<ReturnType<typeof serve>["GET"]>[1];

export const GET = (request: NextRequest, context: Context) => getHandlers().GET(request, context);
export const POST = (request: NextRequest, context: Context) =>
  getHandlers().POST(request, context);
export const PUT = (request: NextRequest, context: Context) => getHandlers().PUT(request, context);
