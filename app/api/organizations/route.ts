import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { firmName, userName } = body

    if (!firmName || firmName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Firm name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Check if user already has an organization
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true },
    })

    if (existingUser?.organizationId) {
      return NextResponse.json(
        { error: 'You already belong to an organization' },
        { status: 400 }
      )
    }

    // Generate unique slug
    let slug = slugify(firmName)
    let slugExists = await prisma.organization.findUnique({ where: { slug } })
    let counter = 1

    while (slugExists) {
      slug = `${slugify(firmName)}-${counter}`
      slugExists = await prisma.organization.findUnique({ where: { slug } })
      counter++
    }

    // Create organization and update user
    const organization = await prisma.organization.create({
      data: {
        name: firmName.trim(),
        slug,
      },
    })

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        organizationId: organization.id,
        role: Role.ADMIN,
        name: userName || session.user.name,
      },
    })

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    })
  } catch (error: any) {
    console.error('Organization creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
