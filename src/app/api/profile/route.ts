import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized,isResponse,failure } from '@/lib/api';
import { query } from '@/lib/db';
import { validTimezone } from '@/lib/gamification';
const schema=z.object({display_name:z.string().trim().max(80),daily_review_goal:z.number().int().min(1).max(100),language_preference:z.enum(['en','ru','kk']),research_enabled:z.boolean(),participant_code:z.string().trim().max(32).nullable(),timezone:z.string().refine(validTimezone,'Choose a valid timezone.').optional()});
export async function PATCH(request:Request) {
  const user=await authorized(); if(isResponse(user)) return user;
  try { const v=schema.parse(await request.json()); await query('update users set display_name=$1,daily_review_goal=$2,language_preference=$3,research_enabled=$4,participant_code=$5,timezone=$6 where id=$7',[v.display_name,v.daily_review_goal,v.language_preference,v.research_enabled,v.participant_code||null,v.timezone??user.timezone,user.id]); return NextResponse.json({ok:true}); } catch(error) { return failure(error); }
}
