import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { sessionId } = await context.params;

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        case: {
          select: {
            caseNumber: true,
            year: true,
          },
        },
      },
    });

    if (!chatSession || chatSession.userId !== user.id) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(chatSession);
  } catch (error: any) {
    console.error('Get chat session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get chat session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Try to get email from query params first (for client-side calls)
    const { searchParams } = new URL(request.url);
    let userEmail = searchParams.get('email');

    // Fallback to NextAuth session if no email in params
    if (!userEmail) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized - no email provided' },
          { status: 401 }
        );
      }
      userEmail = session.user.email;
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { sessionId } = await context.params;

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession || chatSession.userId !== user.id) {
      return NextResponse.json(
        { error: 'Chat session not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete chat session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}
