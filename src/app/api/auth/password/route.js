import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { json, setAuthCookie, signToken } from "@/lib/auth";
import { getAuthContext, assertSameOrigin } from "@/lib/access";
import { passwordChangeSchema } from "@/lib/validation";

export async function POST(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ctx = await getAuthContext();
  if (!ctx) return json({ error: "Unauthorized" }, 401);
  const parsed = passwordChangeSchema.safeParse(await request.json());
  if (!parsed.success) return json({ error: "Password must be at least 8 characters with upper, lower and number" }, 400);
  const user = await db.user.findUnique({ where: { id: ctx.user.id } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.password))) return json({ error: "Current password is incorrect" }, 400);
  const password = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.user.update({ where: { id: user.id }, data: { password } });
  const token = await signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  await setAuthCookie(token, request);
  return json({ success: true });
}
