import { db } from "@/lib/db";
import { getAuthContext, assertSameOrigin } from "@/lib/access";
import { json } from "@/lib/auth";
import { attendanceCreateSchema } from "@/lib/validation";

function dayUtc(value){ const [y,m,d]=value.split('-').map(Number); return new Date(Date.UTC(y,m-1,d)); }

export async function GET(request){
  const ctx=await getAuthContext(); if(!ctx) return json({error:'Unauthorized'},401);
  const sp=new URL(request.url).searchParams; const studentId=sp.get('studentId'); const date=sp.get('date'); const month=sp.get('month');
  const where={};
  if(ctx.user.role==='student') where.studentId=ctx.user.student?.id || '__none__';
  else if(ctx.user.role==='instructor') {
    if(!ctx.user.instructor?.clubId) return json([]);
    where.student={clubId:ctx.user.instructor.clubId};
    if(studentId) where.studentId=studentId;
  } else if(studentId) where.studentId=studentId;
  if(date) where.date=dayUtc(date);
  else if(month && /^\d{4}-\d{2}$/.test(month)){ const [y,m]=month.split('-').map(Number); where.date={gte:new Date(Date.UTC(y,m-1,1)),lt:new Date(Date.UTC(y,m,1))}; }
  const records=await db.attendance.findMany({where,include:{student:{include:{user:{select:{name:true}}}}},orderBy:{date:'desc'},take:2000});
  return json(records.map(r=>({id:r.id,date:r.date.toISOString().slice(0,10),studentId:r.studentId,studentName:r.student.user.name,status:r.status})));
}

export async function POST(request){
  if(!assertSameOrigin(request)) return json({error:'Invalid origin'},403);
  const ctx=await getAuthContext(); if(!ctx || ctx.user.role==='student') return json({error:'Forbidden'},403);
  const parsed=attendanceCreateSchema.safeParse(await request.json()); if(!parsed.success) return json({error:'Invalid attendance data'},400);
  const d=parsed.data; const ids=[...new Set(d.records.map(r=>r.studentId))];
  const students=await db.student.findMany({where:{id:{in:ids}},select:{id:true,clubId:true}});
  if(students.length!==ids.length) return json({error:'One or more students were not found'},400);
  if(ctx.user.role==='instructor' && students.some(s=>s.clubId!==ctx.user.instructor?.clubId)) return json({error:'Forbidden'},403);
  const date=dayUtc(d.date);
  await db.$transaction(d.records.map(r=>db.attendance.upsert({where:{date_studentId:{date,studentId:r.studentId}},update:{status:r.status,markedById:ctx.user.id},create:{date,studentId:r.studentId,status:r.status,markedById:ctx.user.id}})));
  return json({success:true,count:d.records.length});
}
