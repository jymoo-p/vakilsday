const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const connectionString = "postgresql://neondb_owner:npg_mguPdWOTHo92@ep-wild-leaf-aomz29uv.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function checkDatabase() {
  try {
    console.log('Checking users...')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true
      }
    })
    console.log('Users:', JSON.stringify(users, null, 2))
    
    console.log('\nChecking accounts...')
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        userId: true,
        type: true,
        provider: true,
        providerAccountId: true
      }
    })
    console.log('Accounts:', JSON.stringify(accounts, null, 2))
    
    console.log('\nChecking sessions...')
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        userId: true,
        expires: true,
        sessionToken: true
      }
    })
    console.log('Sessions:', JSON.stringify(sessions, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

checkDatabase()
