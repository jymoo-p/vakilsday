// Quick .env checker
require('dotenv').config()

console.log('\n🔍 Checking your .env configuration...\n')

const checks = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
  'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
}

let hasErrors = false

Object.entries(checks).forEach(([key, value]) => {
  const isSet = value && value !== '' && !value.includes('your-')
  const status = isSet ? '✅' : '❌'

  if (!isSet) hasErrors = true

  if (key.includes('SECRET')) {
    console.log(`${status} ${key}: ${isSet ? '***hidden***' : 'NOT SET OR PLACEHOLDER'}`)
  } else {
    const display = value ? (value.length > 50 ? value.substring(0, 47) + '...' : value) : 'NOT SET'
    console.log(`${status} ${key}: ${display}`)
  }
})

console.log('\n📋 Validation Results:\n')

// Check specific values
if (checks.NEXTAUTH_URL !== 'http://localhost:3000') {
  console.log('⚠️  NEXTAUTH_URL should be: http://localhost:3000')
  hasErrors = true
}

if (!checks.GOOGLE_CLIENT_ID?.includes('googleusercontent.com')) {
  console.log('❌ GOOGLE_CLIENT_ID must end with .apps.googleusercontent.com')
  hasErrors = true
}

if (!checks.GOOGLE_CLIENT_SECRET?.startsWith('GOCSPX-')) {
  console.log('❌ GOOGLE_CLIENT_SECRET should start with GOCSPX-')
  hasErrors = true
}

if (checks.NEXTAUTH_SECRET?.includes('your-secret') || checks.NEXTAUTH_SECRET?.includes('generate')) {
  console.log('❌ NEXTAUTH_SECRET is still a placeholder!')
  console.log('   Run: openssl rand -base64 32')
  hasErrors = true
}

if (!hasErrors) {
  console.log('✅ All environment variables look good!')
  console.log('\n📝 Next steps:')
  console.log('   1. Restart dev server: pkill -f "next dev" && npm run dev')
  console.log('   2. Open incognito: http://localhost:3000')
  console.log('   3. Try signing in')
} else {
  console.log('❌ Please fix the issues above')
  console.log('\n📝 Quick fixes:')
  console.log('   1. Edit .env file')
  console.log('   2. Replace placeholder values with real credentials')
  console.log('   3. Save and run this check again: node check-env.js')
}

console.log('')
