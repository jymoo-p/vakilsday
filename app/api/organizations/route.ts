import { NextRequest, NextResponse } from 'next/server'
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
    const body = await request.json()
    const { firmName, userName, userEmail } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    if (!firmName || firmName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Firm name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Check if user exists, if not create them
    let existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!existingUser) {
      // Create user if they don't exist (Firebase user that wasn't synced)
      existingUser = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName || userEmail,
          role: Role.ADMIN,
          emailVerified: new Date(),
        },
      })
    }

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
      where: { email: userEmail },
      data: {
        organizationId: organization.id,
        role: Role.ADMIN,
        name: userName || existingUser?.name,
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
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to create organization' },
      { status: 500 }
    )
  }
}
