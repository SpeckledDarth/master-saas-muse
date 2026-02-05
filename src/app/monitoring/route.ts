import { NextRequest, NextResponse } from "next/server";

const SENTRY_HOST = "o4510772866187264.ingest.us.sentry.io";
const SENTRY_PROJECT_ID = "4510772883161089";

export async function POST(request: NextRequest) {
  try {
    const body = await request.arrayBuffer();
    const textDecoder = new TextDecoder();
    const text = textDecoder.decode(body);
    const firstLine = text.split("\n")[0];

    try {
      const header = JSON.parse(firstLine);
      if (header.dsn) {
        const dsn = new URL(header.dsn);
        const projectId = dsn.pathname.replace("/", "");
        if (projectId !== SENTRY_PROJECT_ID) {
          return new NextResponse("Forbidden", { status: 403 });
        }
      }
    } catch {
      // Could not parse header - still forward to Sentry
      // Sentry will reject invalid envelopes on its own
    }

    const upstreamUrl = `https://${SENTRY_HOST}/api/${SENTRY_PROJECT_ID}/envelope/`;

    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      body: body,
      headers: {
        "Content-Type": request.headers.get("content-type") || "application/x-sentry-envelope",
      },
    });

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
    });
  } catch {
    return new NextResponse("Tunnel error", { status: 500 });
  }
}
