import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { downloadFromUserDrive } from '@/lib/services/google-drive'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id,
        case: {
          organizationId: user.organizationId,
        },
      },
      include: {
        case: {
          select: {
            organization: {
              select: {
                users: {
                  where: { role: 'ADMIN' },
                  select: { id: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })

    if (!document || !document.driveFileId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get admin user ID (files are stored in admin's Drive)
    const adminId = document.case.organization.users[0]?.id

    if (!adminId) {
      return NextResponse.json({ error: 'Organization admin not found' }, { status: 500 })
    }

    // Download from admin's Google Drive
    const fileStream = await downloadFromUserDrive(adminId, document.driveFileId)

    // Return file as stream
    return new NextResponse(fileStream as any, {
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.title)}"`,
      },
    })
  } catch (error: any) {
    console.error('Document download error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to download document' },
      { status: 500 }
    )
  }
}
