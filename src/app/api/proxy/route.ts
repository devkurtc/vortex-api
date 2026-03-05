import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS proxy fallback — forwards requests server-side to avoid browser CORS issues.
 * Usage: POST /api/proxy with { url, method, headers, body }
 */
export async function POST(request: NextRequest) {
  try {
    const { url, method, headers, body } = await request.json();

    if (!url || !method) {
      return NextResponse.json({ error: 'url and method are required' }, { status: 400 });
    }

    const fetchHeaders: Record<string, string> = {};
    if (headers && typeof headers === 'object') {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === 'string') fetchHeaders[k] = v;
      }
    }

    const response = await fetch(url, {
      method,
      headers: fetchHeaders,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });

    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { responseHeaders[k] = v; });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy request failed' },
      { status: 502 }
    );
  }
}
