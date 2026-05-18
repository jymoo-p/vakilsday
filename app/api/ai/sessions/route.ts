import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const caseId = searchParams.get('caseId');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: decodeURIComponent(userEmail) },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const where = caseId
      ? { userId: user.id, caseId }
      : { userId: user.id, caseId: null };

    const sessions = await prisma.chatSession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        case: {
          select: {
            caseNumber: true,
            year: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error('Get chat sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get chat sessions' },
      { status: 500 }
    );
  }
}
