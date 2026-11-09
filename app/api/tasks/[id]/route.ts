import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureTasksTable, getOrganizationTasks } from '@/lib/tasks-db'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const {
      userEmail,
      title,
      description,
      dueDate,
      completed,
      priority,
      category,
      caseId,
      assignedToId,
    } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, organizationId: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User or organization not found' }, { status: 404 })
    }

    await ensureTasksTable()

    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "tasks" WHERE "id" = $1 AND "organizationId" = $2`,
      id,
      user.organizationId
    )

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const current = existing[0]
    const nextTitle = title !== undefined ? title.trim() : current.title
    const nextDesc = description !== undefined ? (description ? description.trim() : null) : current.description
    const nextDue = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : current.dueDate
    const nextCompleted = completed !== undefined ? Boolean(completed) : Boolean(current.completed)
    const nextPriority = priority !== undefined ? priority : current.priority
    const nextCategory = category !== undefined ? category : current.category
    const nextCaseId = caseId !== undefined ? (caseId && caseId !== 'none' ? caseId : null) : current.caseId
    const nextAssignedToId =
      assignedToId !== undefined ? (assignedToId && assignedToId !== 'none' ? assignedToId : null) : current.assignedToId

    await prisma.$executeRawUnsafe(
      `
      UPDATE "tasks"
      SET
        "title" = $1,
        "description" = $2,
        "dueDate" = $3,
        "completed" = $4,
        "priority" = $5,
        "category" = $6,
        "caseId" = $7,
        "assignedToId" = $8,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $9 AND "organizationId" = $10
      `,
      nextTitle,
      nextDesc,
      nextDue,
      nextCompleted,
      nextPriority,
      nextCategory,
      nextCaseId,
      nextAssignedToId,
      id,
      user.organizationId
    )

    const tasks = await getOrganizationTasks(user.organizationId)
    const updatedTask = tasks.find((t) => t.id === id)

    return NextResponse.json({ task: updatedTask, tasks })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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

    await ensureTasksTable()

    await prisma.$executeRawUnsafe(
      `DELETE FROM "tasks" WHERE "id" = $1 AND "organizationId" = $2`,
      id,
      user.organizationId
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
