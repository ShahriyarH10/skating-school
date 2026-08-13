import { db } from "@/lib/db";
import { getAuthContext, assertSameOrigin } from "@/lib/access";
import { json } from "@/lib/auth";
import { z } from "zod";
const updateSchema=z.object({key:z.string().trim().min(1).max(100),value:z.string().max(1000)});
export async function GET(){ const ctx=await getAuthContext(); if(!ctx) return json({error:'Unauthorized'},401); const items=await db.setting.findMany({orderBy:{key:'asc'}}); return json(Object.fromEntries(items.map(x=>[x.key,x.value]))); }
export async function PUT(request){ if(!assertSameOrigin(request)) return json({error:'Invalid origin'},403); const ctx=await getAuthContext(); if(!ctx||ctx.user.role!=='admin') return json({error:'Forbidden'},403); const p=updateSchema.safeParse(await request.json()); if(!p.success) return json({error:'Invalid setting'},400); await db.setting.upsert({where:{key:p.data.key},update:{value:p.data.value},create:p.data}); return json({success:true}); }
