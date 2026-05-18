import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { functionName, parameters, userEmail } = body;

    console.log('=== AI UPDATE ENDPOINT HIT ===')
    console.log('Case ID:', id)
    console.log('Function name:', functionName)
    console.log('Parameters:', parameters)
    console.log('User email:', userEmail)

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

    // Get case and check access
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { userId: user.id },
        },
        hearings: {
          orderBy: { hearingDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Check permissions (only ADMIN and ASSOCIATE can update)
    if (user.role === 'CLERK') {
      return NextResponse.json(
        { error: 'You do not have permission to update this case' },
        { status: 403 }
      );
    }

    if (user.role !== 'ADMIN' && caseData.assignments.length === 0) {
      return NextResponse.json(
        { error: 'Access denied to this case' },
        { status: 403 }
      );
    }

    // Execute the requested function
    let result;
    let changeDescription;

    console.log('Executing function:', functionName)

    switch (functionName) {
      case 'updateNextHearingDate':
        console.log('Updating next hearing date...')
        const newDate = new Date(parameters.date);
        console.log('New date object:', newDate)

        // Use raw SQL to bypass pooler cache (same issue as geminiApiKey)
        await prisma.$executeRaw`
          UPDATE "cases"
          SET "nextHearingDate" = ${newDate}
          WHERE id = ${id}
        `;
        console.log('Raw SQL executed for next hearing date update')

        changeDescription = `Updated next hearing date to ${newDate.toLocaleDateString()}`;
        result = { success: true, newDate: parameters.date };
        break;

      case 'updateCaseStatus':
        // Use raw SQL to bypass pooler cache
        await prisma.$executeRaw`
          UPDATE "cases"
          SET status = ${parameters.status}
          WHERE id = ${id}
        `;
        console.log('Raw SQL executed for status update')

        changeDescription = `Changed case status to ${parameters.status}`;
        result = { success: true, newStatus: parameters.status };
        break;

      case 'addHearingNote':
        if (!caseData.hearings || caseData.hearings.length === 0) {
          return NextResponse.json(
            { error: 'No hearings found for this case' },
            { status: 400 }
          );
        }

        await prisma.hearingNote.create({
          data: {
            hearingId: caseData.hearings[0].id,
            userId: user.id,
            content: parameters.note,
            isPrivate: parameters.isPrivate || false,
          },
        });
        changeDescription = `Added note to latest hearing`;
        result = { success: true, note: parameters.note };
        break;

      case 'updateCaseSynopsis':
        // Use raw SQL to bypass pooler cache
        await prisma.$executeRaw`
          UPDATE "cases"
          SET synopsis = ${parameters.synopsis}
          WHERE id = ${id}
        `;
        console.log('Raw SQL executed for synopsis update')

        changeDescription = `Updated case synopsis`;
        result = { success: true, synopsis: parameters.synopsis };
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown function' },
          { status: 400 }
        );
    }

    // Log the AI action (optional - you could create an audit log table)
    console.log(`AI Update: ${changeDescription} by user ${user.id} on case ${id}`);

    const responseData = {
      success: true,
      result,
      changeDescription,
    };
    console.log('Returning success response:', responseData)
    console.log('=== AI UPDATE ENDPOINT COMPLETE ===')

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('=== AI UPDATE ENDPOINT ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to update case' },
      { status: 500 }
    );
  }
}
