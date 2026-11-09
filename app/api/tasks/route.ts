import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureTasksTable, getOrganizationTasks } from '@/lib/tasks-db'

function generateId() {
  return 'tsk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10)
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, organizationId: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User or organization not found' }, { status: 404 })
    }

    const tasks = await getOrganizationTasks(user.organizationId)
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userEmail,
      title,
      description,
      dueDate,
      priority = 'HIGH',
      category = 'LIMITATION',
      caseId,
      assignedToId,
    } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, organizationId: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User or organization not found' }, { status: 404 })
    }

    await ensureTasksTable()

    const id = generateId()
    const parsedDueDate = dueDate ? new Date(dueDate) : null
    const cleanCaseId = caseId && caseId !== 'none' ? caseId : null
    const cleanAssignedToId = assignedToId && assignedToId !== 'none' ? assignedToId : null

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "tasks" (
        "id", "title", "description", "dueDate", "completed",
        "priority", "category", "caseId", "assignedToId",
        "createdById", "organizationId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, false, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      id,
      title.trim(),
      description?.trim() || null,
      parsedDueDate,
      priority,
      category,
      cleanCaseId,
      cleanAssignedToId,
      user.id,
      user.organizationId
    )

    const tasks = await getOrganizationTasks(user.organizationId)
    const createdTask = tasks.find((t) => t.id === id)

    return NextResponse.json({ task: createdTask, tasks }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
