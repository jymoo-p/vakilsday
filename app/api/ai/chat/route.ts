import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeminiService } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, userEmail, apiKey } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get API key from request body (passed from localStorage due to local pooler cache issue)
    // In production, this could be fetched from DB, but localStorage works everywhere
    const geminiApiKey = apiKey;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add your API key in Settings.' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create chat session
    let chatSession;
    if (sessionId) {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20,
          },
        },
      });

      if (!chatSession || chatSession.userId !== user.id) {
        return NextResponse.json(
          { error: 'Chat session not found' },
          { status: 404 }
        );
      }
    } else {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        },
        include: {
          messages: true,
        },
      });
    }

    // Build history for Gemini
    const history = chatSession.messages.map((msg) => ({
      role: msg.role as 'user' | 'model',
      parts: msg.content,
    }));

    // Call Gemini
    const gemini = new GeminiService(geminiApiKey);
    const response = await gemini.chat(message, history);

    // Save messages
    await prisma.chatMessage.createMany({
      data: [
        {
          sessionId: chatSession.id,
          role: 'user',
          content: message,
        },
        {
          sessionId: chatSession.id,
          role: 'assistant',
          content: response,
        },
      ],
    });

    return NextResponse.json({
      sessionId: chatSession.id,
      message: response,
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat' },
      { status: 500 }
    );
  }
}
