import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const logs = await prisma.addictionLog.findMany({ orderBy: { timestamp: 'desc' } });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const log = await prisma.addictionLog.create({ data: body });
  return NextResponse.json(log, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id === 'by-addiction') {
    const addictionId = req.nextUrl.searchParams.get('addictionId');
    if (!addictionId) return NextResponse.json({ error: 'addictionId required' }, { status: 400 });
    await prisma.addictionLog.deleteMany({ where: { addictionId } });
    return NextResponse.json({ ok: true });
  }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.addictionLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
