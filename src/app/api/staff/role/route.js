import { db } from "@/lib/db";
import { getAuthContext, assertSameOrigin } from "@/lib/access";
import { json } from "@/lib/auth";
import { roleChangeSchema } from "@/lib/validation";

// PATCH { userId, role: "admin" | "instructor" }
// Transfers a staff member between the admin and instructor roles.
export async function PATCH(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "admin") return json({ error: "Forbidden" }, 403);

  const parsed = roleChangeSchema.safeParse(await request.json());
  if (!parsed.success) return json({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, 400);
  const { userId, role: nextRole } = parsed.data;

  if (userId === ctx.user.id) return json({ error: "You cannot change your own role" }, 400);

  try {
    const target = await db.user.findUnique({
      where: { id: userId },
      include: { instructor: { include: { _count: { select: { schedules: true } } } } },
    });
    if (!target || !["admin", "instructor"].includes(target.role)) return json({ error: "Staff member not found" }, 404);
    if (target.role === nextRole) return json({ error: `${target.name} is already ${nextRole === "admin" ? "an" : "a"} ${nextRole}` }, 400);

    if (nextRole === "instructor") {
      // Demote admin -> instructor
      const adminCount = await db.user.count({ where: { role: "admin", active: true } });
      if (adminCount <= 1) return json({ error: "Cannot demote the last remaining administrator" }, 400);

      await db.$transaction(async (tx) => {
        await tx.user.update({ where: { id: userId }, data: { role: "instructor" } });
        const existing = await tx.instructor.findUnique({ where: { userId } });
        if (!existing) {
          await tx.instructor.create({ data: { userId, clubId: null, specialization: null } });
        }
      });

      return json({ success: true, userId, role: "instructor" });
    }

    // Promote instructor -> admin
    if (target.instructor?._count?.schedules > 0) {
      return json({ error: `${target.name} has ${target.instructor._count.schedules} schedule slot(s) assigned. Reassign or remove them before promoting to admin.` }, 409);
    }

    await db.$transaction(async (tx) => {
      if (target.instructor) await tx.instructor.delete({ where: { userId } });
      await tx.user.update({ where: { id: userId }, data: { role: "admin" } });
    });

    return json({ success: true, userId, role: "admin" });
  } catch (err) {
    console.error("Role transfer failed", err);
    return json({ error: "Failed to change role" }, 500);
  }
}
