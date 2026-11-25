export async function api<T>(path:string, method='GET', body?:unknown):Promise<T> {
  const response=await fetch(`/api${path}`,{method,headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
  const data=await response.json().catch(()=>({error:'Request failed.'}));
  if(!response.ok) throw new Error(data.error ?? 'Request failed.');
  return data as T;
}
