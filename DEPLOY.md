# Production deployment guide

This project is production-only: there are no demo users, demo seed data, or public demo passwords.

## 1. Prerequisites

- Node.js 20 LTS
- A Neon PostgreSQL database
- A production hostname (Vercel is the recommended host for this codebase)

## 2. Local environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`: Neon pooled connection (`-pooler`)
- `DIRECT_URL`: Neon direct connection
- `JWT_SECRET`: at least 32 random characters
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

Never commit `.env`. The production ZIP intentionally excludes it.

## 3. Install

```bash
npm ci
npx prisma generate
```

## 4. Apply migrations

For an existing database with this repository's migration history:

```bash
npx prisma migrate deploy
```

For a new local database during development, use the same migration files; do not use `migrate reset` against production.

## 5. Create the first administrator

PowerShell:

```powershell
$env:ADMIN_EMAIL="admin@yourdomain.com"
$env:ADMIN_NAME="School Admin"
$env:ADMIN_PASSWORD="Use-A-Strong-Unique-Password-Here"
npm run db:bootstrap-admin
```

Command Prompt:

```bat
set ADMIN_EMAIL=admin@yourdomain.com
set ADMIN_NAME=School Admin
set ADMIN_PASSWORD=Use-A-Strong-Unique-Password-Here
npm run db:bootstrap-admin
```

The bootstrap command creates or resets only the specified administrator. It does not create demo users.

## 6. Start locally

```bash
npm run dev
```

Open `http://localhost:3000`.

Production simulation:

```bash
npm run build
npm start
```

## 7. Vercel (recommended)

1. Push the project to a private GitHub repository.
2. Import the repository into Vercel.
3. Set these Production environment variables in Vercel:
   - `DATABASE_URL` = Neon pooled URL
   - `DIRECT_URL` = Neon direct URL
   - `JWT_SECRET` = a new production secret
   - `NEXT_PUBLIC_APP_URL` = your final HTTPS URL
4. Build command: `npm run build`.
5. Install command: `npm ci`.
6. Deploy.
7. Run migrations as part of deployment/CI before serving traffic:

```bash
npx prisma migrate deploy
```

8. Create the first production admin from a secure machine using the bootstrap script, pointed at the production Neon database.

Use a separate Neon database/branch for development and preview environments. Never share a production database with development.

## 8. Cloudflare

The application can be adapted to Cloudflare Workers with the OpenNext adapter, but this repository's default database client is optimized for the Node.js/Vercel deployment path. For Cloudflare Workers, use the current OpenNext/Prisma Neon adapter integration rather than manually wiring `ws`. See `DEPLOY-CLOUDFLARE.md`.

## 9. Production checklist

- Rotate any credentials that were ever stored in an uploaded `.env` file.
- Use a unique production `JWT_SECRET`.
- Use HTTPS only.
- Keep Neon production separate from development.
- Apply migrations with `prisma migrate deploy`.
- Keep the first admin credentials out of source control.
- Set `NEXT_PUBLIC_APP_URL` to the real HTTPS origin.
- Test login, logout, attendance, payment receipt, admission, and role permissions after deployment.
