import { prisma } from '@/lib/prisma'

let extraCaseColumnsEnsured = false

export interface CaseExtraFields {
  cnrNumber: string | null
  opposingCounselStrategy: string | null
  cruxOfDispute: string | null
  prayerRelief: string | null
  keyIssues: string | null
  interimOrders: string | null
  interimOrderValidUntil: string | null
}

export async function ensureCaseExtraColumns() {
  if (extraCaseColumnsEnsured) return
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "cnrNumber" TEXT;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "opposingCounselStrategy" TEXT;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "cruxOfDispute" TEXT;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "prayerRelief" TEXT;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "keyIssues" TEXT;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "interimOrders" TEXT;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "interimOrderValidUntil" TEXT;
    `)
    extraCaseColumnsEnsured = true
  } catch (error) {
    extraCaseColumnsEnsured = true
    console.warn('ensureCaseExtraColumns warning:', error)
  }
}

export async function ensureCaseCnrColumn() {
  return ensureCaseExtraColumns()
}

export async function getCnrNumbersForCases(caseIds: string[]): Promise<Record<string, string | null>> {
  if (caseIds.length === 0) return {}
  await ensureCaseExtraColumns()
  try {
    const placeholders = caseIds.map((_, i) => `$${i + 1}`).join(', ')
    const rows = await prisma.$queryRawUnsafe<{ id: string; cnrNumber: string | null }[]>(
      `SELECT "id", "cnrNumber" FROM "cases" WHERE "id" IN (${placeholders})`,
      ...caseIds
    )
    const map: Record<string, string | null> = {}
    for (const r of rows) {
      map[r.id] = r.cnrNumber ?? null
    }
    return map
  } catch (error) {
    console.error('Error fetching cnrNumber for cases:', error)
    return {}
  }
}

export async function getExtraFieldsForCase(caseId: string): Promise<CaseExtraFields> {
  await ensureCaseExtraColumns()
  try {
    const rows = await prisma.$queryRawUnsafe<
      ({ id: string } & CaseExtraFields)[]
    >(
      `SELECT "id", "cnrNumber", "opposingCounselStrategy", "cruxOfDispute", "prayerRelief", "keyIssues", "interimOrders", "interimOrderValidUntil" FROM "cases" WHERE "id" = $1`,
      caseId
    )
    const row = rows[0]
    return {
      cnrNumber: row?.cnrNumber ?? null,
      opposingCounselStrategy: row?.opposingCounselStrategy ?? null,
      cruxOfDispute: row?.cruxOfDispute ?? null,
      prayerRelief: row?.prayerRelief ?? null,
      keyIssues: row?.keyIssues ?? null,
      interimOrders: row?.interimOrders ?? null,
      interimOrderValidUntil: row?.interimOrderValidUntil ?? null,
    }
  } catch (error) {
    console.error('Error fetching extra fields for case:', error)
    return {
      cnrNumber: null,
      opposingCounselStrategy: null,
      cruxOfDispute: null,
      prayerRelief: null,
      keyIssues: null,
      interimOrders: null,
      interimOrderValidUntil: null,
    }
  }
}

export async function setCaseCnrNumber(caseId: string, cnrNumber: string | null | undefined) {
  if (cnrNumber === undefined) return
  await ensureCaseExtraColumns()
  try {
    const cleaned = cnrNumber && cnrNumber.trim() !== '' ? cnrNumber.trim() : null
    await prisma.$executeRawUnsafe(
      `UPDATE "cases" SET "cnrNumber" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
      cleaned,
      caseId
    )
  } catch (error) {
    console.error('Error setting cnrNumber for case:', error)
  }
}

export async function setCaseOpposingCounselStrategy(
  caseId: string,
  opposingCounselStrategy: string | null | undefined
) {
  if (opposingCounselStrategy === undefined) return
  await ensureCaseExtraColumns()
  try {
    const cleaned =
      opposingCounselStrategy && opposingCounselStrategy.trim() !== ''
        ? opposingCounselStrategy.trim()
        : null
    await prisma.$executeRawUnsafe(
      `UPDATE "cases" SET "opposingCounselStrategy" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
      cleaned,
      caseId
    )
  } catch (error) {
    console.error('Error setting opposingCounselStrategy for case:', error)
  }
}

export async function setCaseStructuredSynopsis(
  caseId: string,
  fields: {
    cruxOfDispute?: string | null
    prayerRelief?: string | null
    keyIssues?: string | null
    interimOrders?: string | null
    interimOrderValidUntil?: string | null
  }
) {
  await ensureCaseExtraColumns()
  const clean = (val: string | null | undefined) =>
    val && val.trim() !== '' ? val.trim() : null

  try {
    if (fields.cruxOfDispute !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE "cases" SET "cruxOfDispute" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
        clean(fields.cruxOfDispute),
        caseId
      )
    }
    if (fields.prayerRelief !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE "cases" SET "prayerRelief" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
        clean(fields.prayerRelief),
        caseId
      )
    }
    if (fields.keyIssues !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE "cases" SET "keyIssues" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
        clean(fields.keyIssues),
        caseId
      )
    }
    if (fields.interimOrders !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE "cases" SET "interimOrders" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
        clean(fields.interimOrders),
        caseId
      )
    }
    if (fields.interimOrderValidUntil !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE "cases" SET "interimOrderValidUntil" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
        clean(fields.interimOrderValidUntil),
        caseId
      )
    }
  } catch (error) {
    console.error('Error setting structured synopsis for case:', error)
  }
}
