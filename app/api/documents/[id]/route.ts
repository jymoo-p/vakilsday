import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromUserDrive } from '@/lib/services/google-drive'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Only ADMIN can delete documents
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admin can delete documents' },
        { status: 403 }
      )
    }

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id,
        case: {
          organizationId: user.organizationId,
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete from Google Drive (if driveFileId exists)
    if (document.driveFileId) {
      try {
        await deleteFromUserDrive(user.id, document.driveFileId)
      } catch (error) {
        console.error('Failed to delete from Drive:', error)
        // Continue with database deletion even if Drive delete fails
      }
    }

    // Delete from database
    await prisma.document.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Document delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    )
  }
}

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Get document metadata
    const document = await prisma.document.findFirst({
      where: {
        id,
        case: {
          organizationId: user.organizationId,
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error: any) {
    console.error('Document get error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get document' },
      { status: 500 }
    )
  }
}
