import { NextRequest, NextResponse } from "next/server";

const SENTRY_HOST = "o4510772866187264.ingest.us.sentry.io";
const SENTRY_PROJECT_ID = "4510772883161089";
const SENTRY_PUBLIC_KEY = "8659f2525306a796d7b7206f15ec8308";

export async function POST(request: NextRequest) {
  try {
    const envelope = await request.text();
    const firstLine = envelope.split("\n")[0];

    let header: { dsn?: string };
    try {
      header = JSON.parse(firstLine);
    } catch {
      return new NextResponse("Invalid envelope", { status: 400 });
    }

    if (!header.dsn) {
      return new NextResponse("Missing DSN", { status: 400 });
    }

    let dsn: URL;
    try {
      dsn = new URL(header.dsn);
    } catch {
      return new NextResponse("Invalid DSN", { status: 400 });
    }

    const projectId = dsn.pathname.replace("/", "");
    const publicKey = dsn.username;
    const host = dsn.hostname;

    if (projectId !== SENTRY_PROJECT_ID || publicKey !== SENTRY_PUBLIC_KEY || host !== SENTRY_HOST) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const upstreamUrl = `https://${SENTRY_HOST}/api/${SENTRY_PROJECT_ID}/envelope/`;

    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      body: envelope,
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
    });

    const responseHeaders = new Headers();
    const contentType = upstreamResponse.headers.get("content-type");
    if (contentType) {
      responseHeaders.set("Content-Type", contentType);
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return new NextResponse("Tunnel error", { status: 500 });
  }
}
