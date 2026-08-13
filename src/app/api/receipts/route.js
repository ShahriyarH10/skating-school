import { db } from "@/lib/db";
import { getAuthContext } from "@/lib/access";
import { json } from "@/lib/auth";

export async function GET(request) {
  const ctx=await getAuthContext(); if(!ctx) return json({error:'Unauthorized'},401);
  const id=new URL(request.url).searchParams.get('id'); if(!id) return json({error:'Missing id'},400);
  const payment=await db.payment.findUnique({where:{id},include:{student:{include:{user:{select:{name:true,phone:true}},club:{select:{id:true,name:true}}}}}});
  if(!payment) return json({error:'Not found'},404);
  if(ctx.user.role==='student' && payment.studentId!==ctx.user.student?.id) return json({error:'Forbidden'},403);
  if(ctx.user.role==='instructor' && payment.student.clubId!==ctx.user.instructor?.clubId) return json({error:'Forbidden'},403);
  return json({id:payment.id,receiptNo:payment.receiptNo,studentName:payment.student.user.name,studentPhone:payment.student.user.phone,guardian:payment.student.guardian,club:payment.student.club?.name||'',program:payment.student.program,amount:payment.amount,method:payment.method,type:payment.type,month:payment.month,date:payment.date.toISOString().slice(0,10)});
}
