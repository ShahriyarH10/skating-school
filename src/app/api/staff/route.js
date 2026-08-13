import { db } from "@/lib/db";
import { getAuthContext, assertSameOrigin } from "@/lib/access";
import { json } from "@/lib/auth";
import { idSchema } from "@/lib/validation";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "admin") return json({ error: "Forbidden" }, 403);

  const users = await db.user.findMany({
    where: { role: { in: ["admin", "instructor"] } },
    select: {
      id: true, name: true, email: true, phone: true, avatar: true, role: true, active: true, createdAt: true,
      instructor: { select: { id: true, clubId: true, specialization: true, club: { select: { id: true, name: true } } } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const admins = users.filter((u) => u.role === "admin").map((u) => ({
    userId: u.id, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar,
    role: "admin", status: u.active ? "active" : "inactive",
  }));

  const instructors = users.filter((u) => u.role === "instructor").map((u) => ({
    userId: u.id, instructorId: u.instructor?.id, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar,
    role: "instructor", specialization: u.instructor?.specialization || "", club: u.instructor?.club?.name || "",
    clubId: u.instructor?.clubId || null, status: u.active ? "active" : "inactive",
  }));

  return json({ admins, instructors, adminCount: admins.length });
}

export async function DELETE(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "admin") return json({ error: "Forbidden" }, 403);

  const userId = new URL(request.url).searchParams.get("userId");
  if (!idSchema.safeParse(userId).success) return json({ error: "Invalid id" }, 400);

  if (userId === ctx.user.id) return json({ error: "You cannot remove your own account" }, 400);

  const target = await db.user.findUnique({
    where: { id: userId },
    include: {
      instructor: { include: { _count: { select: { schedules: true } } } },
      _count: { select: { notices: true, attendanceMarked: true } },
    },
  });
  if (!target || !["admin", "instructor"].includes(target.role)) return json({ error: "Not found" }, 404);

  if (target.role === "admin") {
    const adminCount = await db.user.count({ where: { role: "admin", active: true } });
    if (adminCount <= 1) return json({ error: "Cannot remove the last remaining administrator" }, 400);
  }

  if (target.role === "instructor" && target.instructor?._count?.schedules > 0) {
    return json({ error: `This instructor has ${target.instructor._count.schedules} schedule slot(s) assigned. Reassign or remove them first.` }, 409);
  }

  // Notices and attendance are historical records tied to whoever created them,
  // and the database intentionally refuses to delete a user those records still
  // point to (so attendance/notice history can't silently lose its author).
  // Surface that as a clear message instead of letting the raw FK-constraint
  // error crash the request.
  if (target._count.notices > 0) {
    return json({ error: `${target.name} has posted ${target._count.notices} notice(s), which keeps a record of who posted them. Delete those notices first if you need to remove this account.` }, 409);
  }
  if (target._count.attendanceMarked > 0) {
    return json({ error: `${target.name} has marked attendance ${target._count.attendanceMarked} time(s), which can't be reassigned. This account can't be deleted — consider deactivating it instead once that's supported.` }, 409);
  }

  try {
    await db.user.delete({ where: { id: userId } });
  } catch (e) {
    // Safety net for any relation on User not explicitly checked above.
    if (e?.code === "P2003" || e?.meta?.field_name || /foreign key|violates.*constraint/i.test(e?.message || "")) {
      return json({ error: `${target.name} still has related records elsewhere in the system and can't be deleted.` }, 409);
    }
    throw e;
  }
  return json({ success: true });
}
