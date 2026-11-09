import { prisma } from '@/lib/prisma'

export interface TaskRecord {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  completed: boolean
  priority: string
  category: string
  caseId: string | null
  caseNumber?: string | null
  assignedToId: string | null
  assignedToName?: string | null
  createdById: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

let tableEnsured = false

export async function ensureTasksTable() {
  if (tableEnsured) return
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "dueDate" TIMESTAMP(3),
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "priority" TEXT NOT NULL DEFAULT 'HIGH',
        "category" TEXT NOT NULL DEFAULT 'DEADLINE',
        "caseId" TEXT,
        "assignedToId" TEXT,
        "createdById" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tasks_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "tasks_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "tasks_organizationId_idx" ON "tasks"("organizationId");
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "tasks_dueDate_idx" ON "tasks"("dueDate");
    `)
    tableEnsured = true
  } catch (error) {
    // Table or constraints may already exist
    tableEnsured = true
    console.warn('ensureTasksTable warning:', error)
  }
}

export async function getOrganizationTasks(organizationId: string): Promise<TaskRecord[]> {
  await ensureTasksTable()
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT
      t."id",
      t."title",
      t."description",
      t."dueDate",
      t."completed",
      t."priority",
      t."category",
      t."caseId",
      c."caseNumber" AS "caseNumber",
      t."assignedToId",
      u."name" AS "assignedToName",
      t."createdById",
      t."organizationId",
      t."createdAt",
      t."updatedAt"
    FROM "tasks" t
    LEFT JOIN "cases" c ON t."caseId" = c."id"
    LEFT JOIN "users" u ON t."assignedToId" = u."id"
    WHERE t."organizationId" = $1
    ORDER BY
      t."completed" ASC,
      CASE WHEN t."dueDate" IS NULL THEN 1 ELSE 0 END ASC,
      t."dueDate" ASC,
      t."createdAt" DESC
    `,
    organizationId
  )

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    dueDate: r.dueDate ? new Date(r.dueDate).toISOString() : null,
    completed: Boolean(r.completed),
    priority: r.priority || 'HIGH',
    category: r.category || 'DEADLINE',
    caseId: r.caseId,
    caseNumber: r.caseNumber || null,
    assignedToId: r.assignedToId,
    assignedToName: r.assignedToName || null,
    createdById: r.createdById,
    organizationId: r.organizationId,
    createdAt: new Date(r.createdAt).toISOString(),
    updatedAt: new Date(r.updatedAt).toISOString(),
  }))
}
