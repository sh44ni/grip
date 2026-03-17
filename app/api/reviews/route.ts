import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const reviews = await prisma.dailyReview.findMany({ orderBy: { date: 'desc' } });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, createdAt: _ca, ...data } = body;
  // Upsert: one review per day
  const review = await prisma.dailyReview.upsert({
    where: { date: data.date },
    update: data,
    create: data,
  });
  return NextResponse.json(review, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.dailyReview.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
