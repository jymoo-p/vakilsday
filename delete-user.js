const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const connectionString = "postgresql://neondb_owner:npg_mguPdWOTHo92@ep-wild-leaf-aomz29uv.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function deleteUser() {
  try {
    console.log('Deleting user jymoo.p@gmail.com...')
    const deleted = await prisma.user.delete({
      where: { email: 'jymoo.p@gmail.com' }
    })
    console.log('Deleted:', deleted)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

deleteUser()
