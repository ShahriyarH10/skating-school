import { db } from "@/lib/db";
import { getAuthContext, assertSameOrigin } from "@/lib/access";
import { json } from "@/lib/auth";
import { instructorCreateSchema, instructorUpdateSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return json({ error: "Unauthorized" }, 401);
  if (ctx.user.role !== "admin") return json({ error: "Forbidden" }, 403);
  const instructors = await db.instructor.findMany({ include: { user:{select:{id:true,name:true,email:true,phone:true,active:true}}, club:{select:{id:true,name:true}} }, orderBy:{user:{name:"asc"}} });
  return json(instructors.map(i=>({id:i.id,userId:i.userId,name:i.user.name,email:i.user.email,phone:i.user.phone,specialization:i.specialization,club:i.club?.name||"",clubId:i.clubId,status:i.user.active?"active":"inactive"})));
}

export async function POST(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ctx = await getAuthContext(); if (!ctx || ctx.user.role !== "admin") return json({ error:"Forbidden" },403);
  const parsed = instructorCreateSchema.safeParse(await request.json()); if (!parsed.success) return json({error:"Invalid instructor data",details:parsed.error.flatten().fieldErrors},400);
  const d=parsed.data;
  if (d.clubId && !(await db.club.findUnique({where:{id:d.clubId}}))) return json({error:"Club not found"},400);
  try {
    const hash=await bcrypt.hash(d.password,12);
    const user=await db.user.create({data:{email:d.email,password:hash,name:d.name,phone:d.phone||null,role:"instructor",avatar:d.name.split(/\s+/).map(n=>n[0]).join("").toUpperCase()}});
    const instructor=await db.instructor.create({data:{userId:user.id,specialization:d.specialization||null,clubId:d.clubId||null}});
    return json({id:instructor.id,userId:user.id},201);
  } catch(err){ if(err.code==='P2002') return json({error:'Email already exists'},409); console.error(err); return json({error:'Failed to create instructor'},500); }
}

export async function PATCH(request) {
  if (!assertSameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  const ctx = await getAuthContext(); if (!ctx || ctx.user.role !== "admin") return json({ error: "Forbidden" }, 403);
  const parsed = instructorUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return json({ error: "Invalid instructor data", details: parsed.error.flatten().fieldErrors }, 400);
  const { id, name, phone, specialization, clubId } = parsed.data;

  const inst = await db.instructor.findUnique({ where: { id } });
  if (!inst) return json({ error: "Not found" }, 404);
  if (clubId && !(await db.club.findUnique({ where: { id: clubId } }))) return json({ error: "Club not found" }, 400);

  try {
    await db.$transaction(async (tx) => {
      if (name !== undefined || phone !== undefined) {
        await tx.user.update({
          where: { id: inst.userId },
          data: {
            ...(name !== undefined ? { name, avatar: name.split(/\s+/).map((n) => n[0]).join("").toUpperCase() } : {}),
            ...(phone !== undefined ? { phone: phone || null } : {}),
          },
        });
      }
      await tx.instructor.update({
        where: { id },
        data: {
          ...(specialization !== undefined ? { specialization: specialization || null } : {}),
          ...(clubId !== undefined ? { clubId: clubId || null } : {}),
        },
      });
    });
    return json({ success: true });
  } catch (err) {
    console.error("Update instructor", err);
    return json({ error: "Failed to update instructor" }, 500);
  }
}

export async function DELETE(request) {
  if (!assertSameOrigin(request)) return json({error:'Invalid origin'},403);
  const ctx=await getAuthContext(); if(!ctx || ctx.user.role!=='admin') return json({error:'Forbidden'},403);
  const id=new URL(request.url).searchParams.get('id');
  try {
    const inst = await db.instructor.findUnique({
      where: { id },
      include: { _count: { select: { schedules: true } }, user: { select: { id: true, name: true, _count: { select: { notices: true, attendanceMarked: true } } } } },
    });
    if(!inst) return json({error:'Not found'},404);
    if(inst.userId===ctx.user.id) return json({error:'You cannot delete your own account'},400);
    if (inst._count.schedules > 0) {
      return json({ error: `This instructor has ${inst._count.schedules} schedule slot(s) assigned. Reassign or remove them first.` }, 409);
    }
    if (inst.user._count.notices > 0) {
      return json({ error: `${inst.user.name} has posted ${inst.user._count.notices} notice(s), which keeps a record of who posted them. Delete those notices first if you need to remove this account.` }, 409);
    }
    if (inst.user._count.attendanceMarked > 0) {
      return json({ error: `${inst.user.name} has marked attendance ${inst.user._count.attendanceMarked} time(s), which can't be reassigned. This account can't be deleted.` }, 409);
    }
    await db.user.delete({where:{id:inst.userId}});
    return json({success:true});
  } catch (e) {
    if (e?.code === "P2003" || /foreign key|violates.*constraint/i.test(e?.message || "")) {
      return json({ error: "This instructor still has related records elsewhere in the system and can't be deleted." }, 409);
    }
    console.error("Instructor delete failed", e);
    return json({ error: "Failed to delete instructor" }, 500);
  }
}
