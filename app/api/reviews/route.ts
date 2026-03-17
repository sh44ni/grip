import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const reviews = await prisma.dailyReview.findMany({ orderBy: { date: 'desc' } });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Upsert: one review per day
  const review = await prisma.dailyReview.upsert({
    where: { date: body.date },
    update: body,
    create: body,
  });
  return NextResponse.json(review, { status: 201 });
}
