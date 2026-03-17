import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const addictions = await prisma.addiction.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(addictions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const addiction = await prisma.addiction.create({ data: body });
  return NextResponse.json(addiction, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  // Remove relation fields that Prisma won't accept on update
  delete data.logs;
  delete data.milestones;
  const addiction = await prisma.addiction.update({ where: { id }, data });
  return NextResponse.json(addiction);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.addiction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
