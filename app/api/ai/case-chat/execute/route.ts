import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, userEmail, functionCalls } = body;

    if (!userEmail || !caseId || !functionCalls) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Verify case access
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
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

    if (user.role !== 'ADMIN' && caseData.assignments.length === 0) {
      return NextResponse.json(
        { error: 'Access denied to this case' },
        { status: 403 }
      );
    }

    const results = [];

    // Execute each function call
    for (const call of functionCalls) {
      const { name, args } = call;

      try {
        switch (name) {
          case 'addHearing': {
            const hearing = await prisma.hearing.create({
              data: {
                caseId: caseId,
                hearingDate: new Date(args.hearingDate),
                outcome: args.outcome || null,
              },
            });

            // Add notes if provided
            if (args.notes) {
              await prisma.hearingNote.create({
                data: {
                  hearingId: hearing.id,
                  userId: user.id,
                  content: args.notes,
                  isPrivate: false,
                },
              });
            }

            // Update case next hearing date if provided
            if (args.nextDate) {
              await prisma.case.update({
                where: { id: caseId },
                data: { nextHearingDate: new Date(args.nextDate) },
              });
            }

            results.push({
              function: name,
              success: true,
              message: `Added hearing for ${args.hearingDate}`,
            });
            break;
          }

          case 'updateNextHearingDate': {
            await prisma.case.update({
              where: { id: caseId },
              data: { nextHearingDate: new Date(args.date) },
            });

            results.push({
              function: name,
              success: true,
              message: `Updated next hearing date to ${args.date}`,
            });
            break;
          }

          case 'updateCaseStatus': {
            await prisma.case.update({
              where: { id: caseId },
              data: { status: args.status },
            });

            results.push({
              function: name,
              success: true,
              message: `Updated case status to ${args.status}`,
            });
            break;
          }

          case 'addHearingNote': {
            // Get most recent hearing
            const latestHearing = await prisma.hearing.findFirst({
              where: { caseId: caseId },
              orderBy: { hearingDate: 'desc' },
            });

            if (!latestHearing) {
              results.push({
                function: name,
                success: false,
                message: 'No hearings found to add note to',
              });
              break;
            }

            await prisma.hearingNote.create({
              data: {
                hearingId: latestHearing.id,
                userId: user.id,
                content: args.note,
                isPrivate: args.isPrivate || false,
              },
            });

            results.push({
              function: name,
              success: true,
              message: `Added note to hearing on ${latestHearing.hearingDate.toISOString().split('T')[0]}`,
            });
            break;
          }

          case 'updateCaseSynopsis': {
            await prisma.case.update({
              where: { id: caseId },
              data: { synopsis: args.synopsis },
            });

            results.push({
              function: name,
              success: true,
              message: 'Updated case synopsis',
            });
            break;
          }

          default:
            results.push({
              function: name,
              success: false,
              message: `Unknown function: ${name}`,
            });
        }
      } catch (error: any) {
        console.error(`Error executing ${name}:`, error);
        results.push({
          function: name,
          success: false,
          message: error.message || 'Execution failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Execute error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute actions' },
      { status: 500 }
    );
  }
}
