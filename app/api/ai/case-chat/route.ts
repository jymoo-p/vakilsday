import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeminiService, CaseContext } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, caseId, sessionId, userEmail, apiKey } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get API key from request body (passed from localStorage)
    const geminiApiKey = apiKey;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add your API key in Settings.' },
        { status: 400 }
      );
    }

    if (!message || !caseId) {
      return NextResponse.json(
        { error: 'Message and caseId are required' },
        { status: 400 }
      );
    }

    // Fetch case with full context
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        client: true,
        court: true,
        caseType: true,
        hearings: {
          orderBy: { hearingDate: 'desc' },
          include: {
            notes: {
              where: {
                OR: [
                  { isPrivate: false },
                  { userId: user.id },
                ],
              },
            },
          },
        },
        documents: true,
        assignments: {
          where: { userId: user.id },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Check access (user must be assigned to case or be ADMIN)
    if (user.role !== 'ADMIN' && caseData.assignments.length === 0) {
      return NextResponse.json(
        { error: 'Access denied to this case' },
        { status: 403 }
      );
    }

    // Get research bookmarks
    const research = await prisma.researchBookmark.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Build case context
    const caseContext: CaseContext = {
      caseNumber: caseData.caseNumber,
      year: caseData.year || undefined,
      appearingFor: caseData.appearingFor,
      clientName: caseData.client ? `${caseData.client.firstName} ${caseData.client.lastName || ''}`.trim() : undefined,
      otherParties: caseData.otherParties,
      opponentParty: caseData.opponentMainParty,
      court: caseData.court?.name,
      caseType: caseData.caseType?.name,
      judgeName: caseData.judgeName || undefined,
      status: caseData.status,
      filingDate: caseData.filingDate.toISOString().split('T')[0],
      nextHearingDate: caseData.nextHearingDate?.toISOString().split('T')[0],
      synopsis: caseData.synopsis || undefined,
      hearings: caseData.hearings.map(h => ({
        date: h.hearingDate.toISOString().split('T')[0],
        outcome: h.outcome || undefined,
        notes: h.notes.map(n => n.content),
      })),
      documents: caseData.documents.map(d => ({
        title: d.title,
        type: d.documentType,
      })),
      research: research.map(r => ({
        title: r.title,
        type: r.sourceType,
      })),
    };

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

      if (!chatSession || chatSession.userId !== user.id || chatSession.caseId !== caseId) {
        return NextResponse.json(
          { error: 'Chat session not found' },
          { status: 404 }
        );
      }
    } else {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: user.id,
          caseId: caseId,
          title: `${caseData.caseNumber} - ${message.substring(0, 30)}...`,
        },
        include: {
          messages: true,
        },
      });
    }

    // Build history (map 'assistant' to 'model')
    const history = chatSession.messages.map((msg) => ({
      role: (msg.role === 'assistant' ? 'model' : msg.role) as 'user' | 'model',
      parts: msg.content,
    }));

    // Call Gemini with case context
    const gemini = new GeminiService(geminiApiKey);
    const response = await gemini.chatWithCaseContext(message, caseContext, history);

    console.log('Gemini response:', {
      hasText: !!response.text,
      hasFunctionCalls: !!response.functionCalls,
      functionCallsCount: response.functionCalls?.length
    });

    // Check if AI wants to perform actions
    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log('Function calls detected:', JSON.stringify(response.functionCalls, null, 2));

      // Return function call request to frontend for confirmation
      return NextResponse.json({
        sessionId: chatSession.id,
        message: response.text || 'I can help you update this case. Please confirm the changes.',
        functionCalls: response.functionCalls,
        requiresConfirmation: true,
      });
    }

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
          content: response.text,
        },
      ],
    });

    return NextResponse.json({
      sessionId: chatSession.id,
      message: response.text,
    });
  } catch (error: any) {
    console.error('Case chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process case chat' },
      { status: 500 }
    );
  }
}
