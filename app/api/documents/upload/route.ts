import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToUserDrive, shareWithTeam } from '@/lib/services/google-drive'

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const caseId = formData.get('caseId') as string
    const documentType = formData.get('documentType') as string
    const title = formData.get('title') as string
    const userEmail = formData.get('userEmail') as string

    if (!file || !caseId || !documentType || !title || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: file, caseId, documentType, title, userEmail' },
        { status: 400 }
      )
    }

    // Get user with organization
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            users: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'No organization found. Please complete onboarding.' },
        { status: 400 }
      )
    }

    // Verify case belongs to organization
    const caseData = await prisma.case.findFirst({
      where: {
        id: caseId,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        caseNumber: true,
      },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to admin's Google Drive
    const { driveFileId, driveUrl, fileSize } = await uploadToUserDrive(
      user.id,
      buffer,
      {
        caseId: caseData.id,
        caseNumber: caseData.caseNumber,
        title: file.name,
        mimeType: file.type,
      }
    )

    // Share with all team members
    const teamEmails = user.organization?.users
      .map((u) => u.email)
      .filter((email) => email !== userEmail) || []

    if (teamEmails.length > 0) {
      await shareWithTeam(user.id, driveFileId, teamEmails)
    }

    // Save metadata in database
    const document = await prisma.document.create({
      data: {
        caseId,
        title: file.name,
        documentType: documentType as any,
        driveFileId,
        driveUrl,
        fileSize,
        mimeType: file.type,
        uploadedBy: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      document,
    })
  } catch (error: any) {
    console.error('Document upload error:', error)

    if (error.message?.includes('No Google Drive access')) {
      return NextResponse.json(
        { error: 'Please sign in with Google to enable file uploads' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    )
  }
}
