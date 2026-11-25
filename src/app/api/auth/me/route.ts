import { NextResponse, connection } from 'next/server';
import { getUser } from '@/lib/session';
export async function GET() { await connection(); const user=await getUser(); return user ? NextResponse.json({user}) : NextResponse.json({user:null},{status:401}); }
