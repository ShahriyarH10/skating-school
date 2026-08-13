# Online Skating School

Production-ready Next.js application for managing students, instructors, branches, attendance, fees, receipts, schedules, notices, and admissions.

## Stack

- Next.js 15
- React 19
- Prisma 6
- Neon PostgreSQL
- JWT HTTP-only session cookie
- bcrypt password hashing
- Zod input validation
- PWA assets

## No demo data

This repository intentionally contains no demo users, demo passwords, or demo seed command. Create the first administrator with:

```bash
npm run db:bootstrap-admin
```

## Local

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run dev
```

See `DEPLOY.md` for complete local and Vercel deployment steps.
