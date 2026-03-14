import { NextResponse } from 'next/server';

export async function GET() {
  // For now, just return ok to avoid DB connection during build
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'skipped',
  });
}
