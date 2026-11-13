import { NextRequest, NextResponse } from "next/server";

const API_TARGET = process.env.API_URL || "http://api:8080";

async function proxy(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments ? pathSegments.join("/") : "";
  const search = request.nextUrl.search || "";
  const targetUrl = `${API_TARGET}/api/${path}${search}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("host");

  try {
    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body,
    });

    const responseHeaders = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) responseHeaders.set("retry-after", retryAfter);

    if (response.status === 204 || response.status === 205 || response.status === 304) {
      return new NextResponse(null, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    const responseData = await response.text();
    return new NextResponse(responseData, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("Proxy error to api:", err.message);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 502,
        error: "Bad Gateway",
        message: "Não foi possível conectar ao servidor de API backend.",
        details: err.message,
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

