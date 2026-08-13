import { db } from "@/lib/db";
import { getAuthContext, assertSameOrigin } from "@/lib/access";
import { json } from "@/lib/auth";
import { scheduleCreateSchema } from "@/lib/validation";

export async function GET(){
  const ctx=await getAuthContext(); if(!ctx) return json({error:'Unauthorized'},401);
  const where= ctx.user.role==='student' ? {clubId:ctx.user.student?.clubId || '__none__'} : ctx.user.role==='instructor' ? {clubId:ctx.user.instructor?.clubId || '__none__'} : {};
  const schedules=await db.schedule.findMany({where,include:{club:{select:{name:true}},instructor:{include:{user:{select:{name:true}}}}},orderBy:[{day:'asc'},{time:'asc'}]});
  return json(schedules.map(s=>({id:s.id,day:s.day,time:s.time,program:s.program,club:s.club.name,clubId:s.clubId,instructor:s.instructor.user.name,instructorId:s.instructorId})));
}

export async function POST(request){
  if(!assertSameOrigin(request)) return json({error:'Invalid origin'},403);
  const ctx=await getAuthContext(); if(!ctx || ctx.user.role==='student') return json({error:'Forbidden'},403);
  const parsed=scheduleCreateSchema.safeParse(await request.json()); if(!parsed.success) return json({error:'Invalid schedule',details:parsed.error.flatten().fieldErrors},400);
  const d=parsed.data;
  if(ctx.user.role==='instructor' && d.clubId!==ctx.user.instructor?.clubId) return json({error:'Forbidden'},403);
  const instructor=await db.instructor.findUnique({where:{id:d.instructorId},select:{clubId:true}}); if(!instructor || instructor.clubId!==d.clubId) return json({error:'Instructor does not belong to this club'},400);
  const schedule=await db.schedule.create({data:d}); return json({id:schedule.id},201);
}
