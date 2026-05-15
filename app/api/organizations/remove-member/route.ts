import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/organizations/remove-member - Admin removes a member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, adminEmail } = body

    if (!adminEmail || !userId) {
      return NextResponse.json({ error: 'Admin email and user ID are required' }, { status: 400 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        organizationId: true,
        role: true,
      },
    })

    if (!adminUser || !adminUser.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 })
    }


    // Verify the target user belongs to the same organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        organizationId: true,
        role: true,
      },
    })

    if (!targetUser || targetUser.organizationId !== adminUser.organizationId) {
      return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 })
    }

    // Prevent removing yourself
    if (userId === adminUser.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself. Use "Exit Organization" instead.' },
        { status: 400 }
      )
    }

    // Check if removing the last admin
    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: adminUser.organizationId,
          role: 'ADMIN',
        },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the only admin. Assign another admin first.' },
          { status: 400 }
        )
      }
    }

    // Get case assignments count
    const caseAssignments = await prisma.caseAssignment.findMany({
      where: { userId },
      select: { id: true },
    })

    // Remove user from all case assignments
    await prisma.caseAssignment.deleteMany({
      where: { userId },
    })

    // Remove user from organization
    await prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: null,
        customRoleId: null,
      },
    })

    return NextResponse.json({
      success: true,
      caseCount: caseAssignments.length,
    })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
