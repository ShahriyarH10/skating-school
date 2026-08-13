import { db } from "@/lib/db";
import { signToken, setAuthCookie, removeAuthCookie, json } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/access";
import { loginSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`login:${ip}`);
  if (!limit.ok) return json({ error: "Too many login attempts. Try again later." }, 429, { "Retry-After": String(limit.retryAfter) });

  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid email or password format" }, 400);
    const { email, password } = parsed.data;
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.active || !(await bcrypt.compare(password, user.password))) {
      return json({ error: "Invalid credentials" }, 401);
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    await setAuthCookie(token, request);
    await db.user.update({ where: { id: user.id }, data: { updatedAt: new Date() } });

    return json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, phone: user.phone } });
  } catch (err) {
    console.error("Login error", err);
    return json({ error: "Login failed" }, 500);
  }
}

export async function DELETE(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  await removeAuthCookie(request);
  return json({ success: true });
}
