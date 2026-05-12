import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Optimized Prisma client with connection pooling
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pool settings for better performance
  // Note: Supabase Pooler already handles pooling, but these settings optimize client-side
})

// Use same client for NextAuth
export const authPrisma = prisma

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
