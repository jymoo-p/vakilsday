import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const caseId = searchParams.get('caseId');

    console.log('=== GET SESSIONS API ===')
    console.log('Email:', userEmail)
    console.log('Case ID:', caseId)

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

    console.log('User found:', !!user)

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
        _count: {
          select: { messages: true },
        },
      },
    });

    // Filter out sessions with no messages
    const sessionsWithMessages = sessions.filter(s => s._count.messages > 0);

    return NextResponse.json(sessionsWithMessages);
  } catch (error: any) {
    console.error('Get chat sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get chat sessions' },
      { status: 500 }
    );
  }
}
