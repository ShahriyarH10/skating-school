import { db } from "@/lib/db";
import { getAuthContext, assertSameOrigin } from "@/lib/access";
import { json } from "@/lib/auth";
import { clubCreateSchema, clubUpdateSchema, idSchema } from "@/lib/validation";

export async function GET(request) {
  const ctx = await getAuthContext();

  // Public, unauthenticated callers (e.g. the admission form) get a minimal,
  // active-branches-only list — no counts, no inactive branches, ever.
  if (!ctx) {
    const clubs = await db.club.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, location: true },
    });
    return json(clubs);
  }

  const showAll = new URL(request.url).searchParams.get("all") === "1";
  const includeInactive = showAll && ctx.user.role === "admin";

  const clubs = await db.club.findMany({
    where: includeInactive ? {} : { status: "active" },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, location: true, status: true,
      _count: { select: { students: true, instructors: true } },
    },
  });

  return json(
    clubs.map((c) => ({
      id: c.id, name: c.name, location: c.location, status: c.status,
      studentCount: c._count.students, instructorCount: c._count.instructors,
    }))
  );
}

export async function POST(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "admin") return json({ error: "Forbidden" }, 403);

  const parsed = clubCreateSchema.safeParse(await request.json());
  if (!parsed.success) return json({ error: "Invalid branch data", details: parsed.error.flatten().fieldErrors }, 400);

  try {
    const club = await db.club.create({ data: parsed.data });
    return json({ id: club.id }, 201);
  } catch (err) {
    if (err.code === "P2002") return json({ error: "A branch with this name already exists" }, 409);
    console.error("Create club", err);
    return json({ error: "Failed to create branch" }, 500);
  }
}

export async function PATCH(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "admin") return json({ error: "Forbidden" }, 403);

  const parsed = clubUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return json({ error: "Invalid branch data", details: parsed.error.flatten().fieldErrors }, 400);
  const { id, ...data } = parsed.data;
  if (Object.keys(data).length === 0) return json({ error: "Nothing to update" }, 400);

  const existing = await db.club.findUnique({ where: { id } });
  if (!existing) return json({ error: "Branch not found" }, 404);

  try {
    await db.club.update({ where: { id }, data });
    return json({ success: true });
  } catch (err) {
    if (err.code === "P2002") return json({ error: "A branch with this name already exists" }, 409);
    console.error("Update club", err);
    return json({ error: "Failed to update branch" }, 500);
  }
}

export async function DELETE(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "admin") return json({ error: "Forbidden" }, 403);

  const id = new URL(request.url).searchParams.get("id");
  if (!idSchema.safeParse(id).success) return json({ error: "Invalid id" }, 400);

  try {
    const club = await db.club.findUnique({
      where: { id },
      select: { id: true, _count: { select: { students: true, instructors: true, schedules: true } } },
    });
    if (!club) return json({ error: "Branch not found" }, 404);
    if (club._count.students > 0 || club._count.instructors > 0) {
      return json({ error: "Reassign students and instructors before deleting this branch" }, 409);
    }
    if (club._count.schedules > 0) {
      return json({ error: "This branch still has schedule slots. Remove them before deleting the branch." }, 409);
    }

    await db.club.delete({ where: { id } });
    return json({ success: true });
  } catch (err) {
    if (err.code === "P2003" || /foreign key|violates.*constraint/i.test(err?.message || "")) {
      return json({ error: "This branch still has related records elsewhere and can't be deleted." }, 409);
    }
    console.error("Delete club", err);
    return json({ error: "Failed to delete branch" }, 500);
  }
}
