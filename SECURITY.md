# Security notes

- Never commit `.env` or any production credentials.
- Rotate any secret that has ever appeared in a shared/uploaded `.env` file.
- `JWT_SECRET` must be at least 32 random characters.
- Passwords are hashed with bcrypt before storage.
- Authentication cookies are HTTP-only and same-site.
- API authorization is checked against the current database user, not only the session payload.
- Instructors are restricted to their assigned club by the API.
- Students are restricted to their own records.
- Financial/receipt endpoints re-check record ownership.
- State-changing requests enforce same-origin checks.
- Public admission is rate-limited and only creates student-role accounts.
- Production migrations use `prisma migrate deploy`.
