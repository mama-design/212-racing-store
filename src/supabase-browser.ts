import {createClient} from '@supabase/supabase-js';
const url='https://hvggibfptrjbgczzkthq.supabase.co';
// Publishable client key: authorization and data access are enforced by racing-api.
const key='sb_publishable_KcfJFEB_r29O5Tu5OfspdA_rGcoDcJH';
const client=createClient(url,key,{auth:{storageKey:'212-auth-session',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export async function getAuthClient(){return client}
export async function apiFetch(body?:unknown){const {data:{session}}=await client.auth.getSession();return fetch(url+'/functions/v1/racing-api',{method:body?'POST':'GET',headers:{apikey:key,...(session?{Authorization:'Bearer '+session.access_token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})}
