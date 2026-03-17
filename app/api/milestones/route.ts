import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const milestones = await prisma.milestone.findMany({ orderBy: { achievedAt: 'desc' } });
  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, achievedAt: _aa, addiction: _a, ...data } = body;
  const milestone = await prisma.milestone.create({ data });
  return NextResponse.json(milestone, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  delete data.addiction;
  const milestone = await prisma.milestone.update({ where: { id }, data });
  return NextResponse.json(milestone);
}
