import crypto from "node:crypto";
import { db } from "@/lib/db";
import { getAuthContext, assertSameOrigin } from "@/lib/access";
import { json } from "@/lib/auth";
import { paymentCreateSchema } from "@/lib/validation";

async function scopeFor(ctx) {
  if (ctx.user.role === "student") return ctx.user.student ? { studentId: ctx.user.student.id } : { id: "__none__" };
  if (ctx.user.role === "instructor") return ctx.user.instructor?.clubId ? { student: { clubId: ctx.user.instructor.clubId } } : { id: "__none__" };
  return {};
}

export async function GET(request) {
  const ctx=await getAuthContext(); if(!ctx) return json({error:'Unauthorized'},401);
  const studentId=new URL(request.url).searchParams.get('studentId');
  const scope=await scopeFor(ctx); const where={...scope};
  if (ctx.user.role==='student' && studentId && studentId!==ctx.user.student?.id) return json({error:'Forbidden'},403);
  if (studentId && ctx.user.role!=='student') where.studentId=studentId;
  const payments=await db.payment.findMany({where,include:{student:{include:{user:{select:{name:true,phone:true}},club:{select:{name:true}}}}},orderBy:{date:'desc'},take:500});
  return json(payments.map(p=>({id:p.id,studentId:p.studentId,studentName:p.student.user.name,studentPhone:p.student.user.phone,club:p.student.club?.name||'',program:p.student.program,guardian:p.student.guardian,amount:p.amount,method:p.method,type:p.type,month:p.month,receiptNo:p.receiptNo,date:p.date.toISOString().slice(0,10)})));
}

export async function POST(request) {
  if(!assertSameOrigin(request)) return json({error:'Invalid origin'},403);
  const ctx=await getAuthContext(); if(!ctx || ctx.user.role==='student') return json({error:'Forbidden'},403);
  const parsed=paymentCreateSchema.safeParse(await request.json()); if(!parsed.success) return json({error:'Invalid payment data',details:parsed.error.flatten().fieldErrors},400);
  const d=parsed.data;
  const student=await db.student.findUnique({where:{id:d.studentId},include:{user:{select:{name:true}},club:true}});
  if(!student) return json({error:'Student not found'},404);
  if(ctx.user.role==='instructor' && student.clubId!==ctx.user.instructor?.clubId) return json({error:'Forbidden'},403);
  for(let attempt=0;attempt<3;attempt++){
    const receiptNo=`OSS-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    try {
      const p=await db.payment.create({data:{studentId:d.studentId,amount:d.amount,method:d.method,type:d.type,month:d.month,receiptNo}});
      return json({id:p.id,receiptNo},201);
    } catch(err){ if(err.code!=='P2002') {console.error(err);return json({error:'Failed to record payment'},500);} }
  }
  return json({error:'Could not generate a unique receipt number'},500);
}
