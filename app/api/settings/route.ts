import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_SETTINGS = {
  id: 'default',
  name: '',
  wakeTime: '07:00',
  sleepTime: '23:00',
  slotDuration: 30,
  weekStartDay: 1,
  currency: 'PKR',
  monthlyIncomeTarget: 0,
  savingsGoal: 0,
  theme: 'dark',
  avgMealCost: 500,
  monthlySubscriptionCost: 1200,
  dailyFuelCost: 800,
  weeklyReportDay: 0,
  lastExportDate: null,
  firstUseDate: null,
};

export async function GET() {
  let settings = await prisma.settings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    const today = new Date().toISOString().split('T')[0];
    settings = await prisma.settings.create({
      data: { ...DEFAULT_SETTINGS, firstUseDate: today },
    });
  }
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  delete body.id; // don't allow changing the ID
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    update: body,
    create: { id: 'default', ...body },
  });
  return NextResponse.json(settings);
}
