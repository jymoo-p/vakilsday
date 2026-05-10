import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  authPrisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Create PostgreSQL connection pool (shared)
if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })
}

const pool = globalForPrisma.pool

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool)

// Initialize Prisma Client with adapter for general app use (required for Prisma 7)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

// Create a separate Prisma client for NextAuth without custom adapter
// This avoids adapter chain issues with @auth/prisma-adapter
export const authPrisma = globalForPrisma.authPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.authPrisma = authPrisma
}
