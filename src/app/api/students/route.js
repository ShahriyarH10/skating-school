import { db } from "@/lib/db";
import { getAuthContext, assertSameOrigin } from "@/lib/access";
import { json } from "@/lib/auth";
import { studentCreateSchema, idSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

export async function GET(request) {
  const ctx = await getAuthContext();
  if (!ctx) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Single-student full detail (includes photo, addresses, guardian NID,
  // etc.) — permission-checked per record, not exposed in the bulk list.
  if (id) {
    const s = await db.student.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true, phone: true, avatar: true, active: true } }, club: { select: { id: true, name: true } } },
    });
    if (!s) return json({ error: "Not found" }, 404);
    if (ctx.user.role === "student" && s.userId !== ctx.user.id) return json({ error: "Forbidden" }, 403);
    if (ctx.user.role === "instructor" && s.clubId !== ctx.user.instructor?.clubId) return json({ error: "Forbidden" }, 403);
    const sensitive = ctx.user.role === "admin" || s.userId === ctx.user.id;
    return json({
      id: s.id, userId: s.userId, name: s.user.name, email: s.user.email, phone: s.user.phone, avatar: s.user.avatar,
      age: s.age, guardian: s.guardian, program: s.program, club: s.club?.name || "", clubId: s.clubId,
      enrollDate: s.enrollDate, status: s.user.active ? "active" : "inactive",
      presentAddress: s.presentAddress, permanentAddress: s.permanentAddress,
      fatherName: s.fatherName, fatherOccupation: s.fatherOccupation, fatherOccupationType: s.fatherOccupationType, fatherMobile: s.fatherMobile,
      motherName: s.motherName, motherOccupation: s.motherOccupation, motherOccupationType: s.motherOccupationType, motherMobile: s.motherMobile,
      dob: s.dob, bloodGroup: s.bloodGroup, presentSchool: s.presentSchool, religion: s.religion, gender: s.gender,
      session: s.session, shift: s.shift, photo: s.photo,
      ...(sensitive ? { fatherNid: s.fatherNid, motherNid: s.motherNid, birthReg: s.birthReg } : {}),
    });
  }

  const requestedClub = searchParams.get("club");
  const search = searchParams.get("search")?.trim().toLowerCase();
  let where = {};
  if (ctx.user.role === "instructor") {
    if (!ctx.user.instructor?.clubId) return json([]);
    where.clubId = ctx.user.instructor.clubId;
  }
  if (ctx.user.role === "student") where.userId = ctx.user.id;
  if (requestedClub && ctx.user.role === "admin") where.clubId = requestedClub;
  const students = await db.student.findMany({
    where, include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true, active: true } }, club: { select: { id: true, name: true } } },
    orderBy: { enrollDate: "desc" },
  });
  const result = students.map((s) => ({ id:s.id,userId:s.userId,name:s.user.name,email:s.user.email,phone:s.user.phone,avatar:s.user.avatar,age:s.age,guardian:s.guardian,program:s.program,club:s.club?.name||"",clubId:s.clubId,enrollDate:s.enrollDate,status:s.user.active?"active":"inactive" }));
  return json(search ? result.filter(s => s.name.toLowerCase().includes(search) || (s.guardian||"").toLowerCase().includes(search)) : result);
}

export async function POST(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role === "student") return json({ error: "Forbidden" }, 403);
  const parsed = studentCreateSchema.safeParse(await request.json());
  if (!parsed.success) return json({ error: "Invalid student data", details: parsed.error.flatten().fieldErrors }, 400);
  const data = parsed.data;
  let clubId = data.clubId || null;
  if (ctx.user.role === "instructor") {
    clubId = ctx.user.instructor?.clubId || null;
    if (!clubId) return json({ error: "Instructor is not assigned to a club" }, 400);
  }
  if (clubId && !(await db.club.findUnique({ where: { id: clubId } }))) return json({ error: "Club not found" }, 400);
  try {
    const hash = await bcrypt.hash(data.password, 12);
    const user = await db.user.create({ data: { email:data.email,password:hash,name:data.name,phone:data.phone||null,role:"student",avatar:data.name.split(/\s+/).map(n=>n[0]).join("").toUpperCase() } });
    const student = await db.student.create({ data: { userId:user.id, age:data.age ?? null, guardian:data.guardian, program:data.program || "Beginner", clubId } });
    return json({ id: student.id, userId: user.id }, 201);
  } catch (err) {
    if (err.code === "P2002") return json({ error: "Email already exists" }, 409);
    console.error("Create student", err); return json({ error: "Failed to create student" }, 500);
  }
}

export async function DELETE(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "admin") return json({ error: "Forbidden" }, 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!idSchema.safeParse(id).success) return json({ error: "Invalid id" }, 400);
  const student = await db.student.findUnique({ where: { id } });
  if (!student) return json({ error: "Not found" }, 404);
  await db.user.delete({ where: { id: student.userId } });
  return json({ success: true });
}
