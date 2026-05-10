import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Create PostgreSQL connection pool (shared, reused across requests)
if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })
}

const pool = globalForPrisma.pool
const adapter = new PrismaPg(pool)

// Initialize Prisma Client with adapter (required for Prisma 7)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// Use same client for NextAuth
export const authPrisma = prisma

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
