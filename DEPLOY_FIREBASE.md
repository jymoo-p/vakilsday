# Deploy Firebase Auth to Vercel

## Environment Variables to Add

Run these commands to add Firebase config to Vercel production:

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production --value "AIzaSyBvFO_f_iG-gGrxe9_EmSBX5cxBdmuIciQ" --yes

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production --value "vakilsday-648d1.firebaseapp.com" --yes

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production --value "vakilsday-648d1" --yes

vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production --value "vakilsday-648d1.firebasestorage.app" --yes

vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production --value "218036196937" --yes

vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production --value "1:218036196937:web:9eab88dcdc7f0a1ada1198" --yes
```

Then deploy:

```bash
vercel --prod --yes
```

## What Changed

✅ Replaced NextAuth with Firebase Authentication
✅ Client-side Google popup (no OAuth callback issues!)
✅ Save user to Prisma after Firebase auth
✅ Use useAuth hook for protected routes

## Next Steps

After deployment:
1. Test sign-in at https://vakilsday.vercel.app
2. Verify users are created in database
3. Remove old NextAuth code (API routes, models, etc.)
