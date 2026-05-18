import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GeminiService, CaseContext } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, draftType, additionalInstructions, userEmail, apiKey } = body;

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

    if (!caseId || !draftType) {
      return NextResponse.json(
        { error: 'caseId and draftType are required' },
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

    // Check access
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

    // Generate draft
    const gemini = new GeminiService(geminiApiKey);
    const draft = await gemini.generateDraft(
      draftType,
      caseContext,
      additionalInstructions
    );

    return NextResponse.json({
      draft,
      caseNumber: caseData.caseNumber,
      draftType,
    });
  } catch (error: any) {
    console.error('Generate draft error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate draft' },
      { status: 500 }
    );
  }
}
