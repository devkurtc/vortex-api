import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';
import { desc, eq, and, gte, lte, like } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Truncate large response bodies to prevent bloating the DB
    const maxBodySize = 10_000;
    const responseBody = body.responseBody?.length > maxBodySize
      ? body.responseBody.slice(0, maxBodySize) + '...[truncated]'
      : body.responseBody;

    await db.insert(auditLog).values({
      timestamp: body.timestamp || new Date().toISOString(),
      user: body.user || 'anonymous',
      method: body.method,
      url: body.url,
      status: body.status,
      request_body: body.requestBody || null,
      response_body: responseBody || null,
      request_headers: body.requestHeaders || null,
      response_headers: body.responseHeaders || null,
      mode: body.mode || 'developer',
      duration: body.duration || 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Audit log error:', error);
    return NextResponse.json(
      { error: 'Failed to log audit entry' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user');
    const method = searchParams.get('method');
    const url = searchParams.get('url');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const mode = searchParams.get('mode');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const conditions: SQL[] = [];
    if (user) conditions.push(eq(auditLog.user, user));
    if (method) conditions.push(eq(auditLog.method, method));
    if (url) conditions.push(like(auditLog.url, `%${url}%`));
    if (dateFrom) conditions.push(gte(auditLog.timestamp, dateFrom));
    if (dateTo) conditions.push(lte(auditLog.timestamp, dateTo));
    if (mode) conditions.push(eq(auditLog.mode, mode));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const entries = await db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.id))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Audit query error:', error);
    return NextResponse.json(
      { error: 'Failed to query audit log' },
      { status: 500 }
    );
  }
}
