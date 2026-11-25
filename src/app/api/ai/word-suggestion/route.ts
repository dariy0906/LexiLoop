import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorized,isResponse,tooMany } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { englishTermSchema } from '@/lib/parsers';

const requestSchema=z.object({word:englishTermSchema});
const suggestionSchema=z.object({
  phonetic:z.string().trim().max(120).nullable(),
  definition_en:z.string().trim().max(1000),
  translation_ru:z.string().trim().max(300),
  translation_kk:z.string().trim().max(300),
  example_sentence:z.string().trim().max(1000),
});

type ChatCompletion={choices?:Array<{message?:{content?:string|null}}>};

export async function POST(request:Request) {
  const user=await authorized(); if(isResponse(user))return user;
  const limit=rateLimit(`ai:${user.id}`,20,60*60*1000); if(!limit.allowed)return tooMany(limit.retryAfter);
  const key=process.env.DEEPSEEK_API_KEY;
  if(!key)return NextResponse.json({error:'AI suggestions are not configured. Add DEEPSEEK_API_KEY to .env.local and restart the server.'},{status:503});

  try {
    const {word}=requestSchema.parse(await request.json());
    const response=await fetch('https://api.deepseek.com/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
      body:JSON.stringify({
        model:process.env.DEEPSEEK_MODEL||'deepseek-chat',
        temperature:0.2,
        max_tokens:350,
        response_format:{type:'json_object'},
        messages:[
          {role:'system',content:'Return valid JSON only. You create concise vocabulary cards for English learners. Use natural Russian and Kazakh translations, IPA where known, and one simple English example sentence that includes the exact input word. JSON shape: {"phonetic":string|null,"definition_en":string,"translation_ru":string,"translation_kk":string,"example_sentence":string}.'},
          {role:'user',content:`Create a vocabulary card for the English word or phrase: ${word}`},
        ],
      }),
      signal:AbortSignal.timeout(15_000),
    });
    const data=await response.json().catch(()=>null) as ChatCompletion|null;
    if(!response.ok)throw new Error('DeepSeek could not create a suggestion. Please try again.');
    const content=data?.choices?.[0]?.message?.content;
    if(!content?.trim())throw new Error('DeepSeek returned an empty suggestion. Please try again.');
    return NextResponse.json(suggestionSchema.parse(JSON.parse(content)));
  } catch(error) {
    const message=error instanceof z.ZodError?'DeepSeek returned an invalid suggestion. Please try again.':error instanceof Error?error.message:'Could not create a suggestion.';
    console.error('Word suggestion failed',error);
    return NextResponse.json({error:message},{status:502});
  }
}
