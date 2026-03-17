import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const txs = await prisma.transaction.findMany({ orderBy: { date: 'desc' } });
  return NextResponse.json(txs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tx = await prisma.transaction.create({ data: body });
  return NextResponse.json(tx, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const tx = await prisma.transaction.update({ where: { id }, data });
  return NextResponse.json(tx);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
