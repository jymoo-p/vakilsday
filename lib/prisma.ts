import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Allow self-signed certificates for Supabase connection
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use DIRECT_URL for better connection stability
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

const pool = new Pool({
  connectionString,
})

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// Use same client for NextAuth
export const authPrisma = prisma

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
