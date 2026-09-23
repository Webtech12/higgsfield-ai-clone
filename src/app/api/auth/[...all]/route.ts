import { handleAuthRequest } from "@/server/modules/identity";

export const runtime = "nodejs";

export const GET = (request: Request) => handleAuthRequest(request);
export const POST = (request: Request) => handleAuthRequest(request);
