import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
const origins=new Set(['https://mama-design.github.io','https://gestao.212racingstore.com.br','https://racing-212-eventos.mamadesign.chatgpt.site']);
const friendly=(err:any)=>err?.message||'Não foi possível concluir a operação';
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};if(origin&&origins.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='authorization,apikey,content-type,x-client-info';headers['Access-Control-Allow-Methods']='GET,POST,OPTIONS';}
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.has(origin))return reply({error:'Origem não autorizada'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(!['GET','POST'].includes(req.method))return reply({error:'Método inválido'},405);
 try{
 const authorization=req.headers.get('authorization');if(!authorization?.startsWith('Bearer '))return reply({error:'Entre com sua conta para continuar.'},401);
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!;
 const authClient=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:identity,error:identityError}=await authClient.auth.getUser(authorization.slice(7));
 const user=identity.user;if(identityError||!user?.email||!user.email_confirmed_at||user.is_anonymous)return reply({error:'Sessão inválida. Entre novamente.'},401);
 const db=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const email=user.email.toLowerCase();
 const {data:me,error:memberError}=await db.from('racing_members').select('*').eq('email',email).maybeSingle();
 if(memberError)throw memberError;
 if(!me||!me.active)return reply({error:'Seu acesso ainda não foi liberado. Peça ao administrador.'},403);
 const admin=me.role==='admin';
 if(req.method==='GET'){
 const [er,sr,mr]=await Promise.all([db.from('racing_events').select('*').eq('deleted',false),admin?db.from('racing_sales').select('*'):db.from('racing_sales').select('*').eq('seller',email),admin?db.from('racing_members').select('*'):Promise.resolve({data:[],error:null})]);
 for(const r of [er,sr,mr])if(r.error)throw r.error;
 return reply({me,events:er.data,sales:sr.data?.map(s=>({...s,eventId:s.event_id})),members:mr.data});
 }
 const body=await req.json();
 if(body.action==='sale'){
 const s=body.sale;if(!s||typeof s.id!=='string'||!/^[-\w]{10,80}$/.test(s.id))return reply({error:'Venda inválida'},400);
 const {data:previous,error:prevError}=await db.from('racing_sales').select('seller').eq('id',s.id).maybeSingle();if(prevError)throw prevError;
 if(previous)return previous.seller===email?reply({ok:true}):reply({error:'Código de venda já utilizado'},409);
 const {data:event,error:evError}=await db.from('racing_events').select('status').eq('id',s.eventId).eq('deleted',false).maybeSingle();if(evError)throw evError;
 if(!event||event.status!=='open')return reply({error:'Evento encerrado ou indisponível. A venda continua salva neste celular.'},400);
 if(!Array.isArray(s.items)||s.items.length<1||s.items.length>100)return reply({error:'Adicione produtos'},400);
 const items=s.items.map((i:any)=>{const price=i.price==null||i.price===''?null:i.price;if((i.barcode!=null&&typeof i.barcode!=='string')||(i.description!=null&&typeof i.description!=='string')||!Number.isSafeInteger(i.qty)||i.qty<1||i.qty>10000||(price!==null&&(!Number.isSafeInteger(price)||price<0||price>100000000)))throw Error('Confira a quantidade e, se informado, o preço');return {barcode:(i.barcode??'').trim().slice(0,100),description:(i.description??'').trim().slice(0,200),qty:i.qty,price};});
 s.discount=s.discount??0;s.payment=s.payment||'Outro';
 const gross=items.reduce((n:number,i:any)=>n+i.qty*i.price,0);
 if(!Number.isSafeInteger(s.discount)||s.discount<0||s.discount>gross)return reply({error:'Desconto inválido'},400);
 if(!['Pix','Dinheiro','Crédito','Débito','Outro'].includes(s.payment))return reply({error:'Pagamento inválido'},400);
 const created=new Date(s.created);if(isNaN(created.getTime()))return reply({error:'Data inválida'},400);
 const {error}=await db.from('racing_sales').insert({id:s.id,event_id:s.eventId,seller:email,created:created.toISOString(),payment:s.payment,items,discount:s.discount,total:gross-s.discount,notes:String(s.notes||'').slice(0,1000)});
 if(error){if(error.code==='23505'){const {data:existing}=await db.from('racing_sales').select('seller').eq('id',s.id).maybeSingle();if(existing?.seller===email)return reply({ok:true});}throw error;}
 return reply({ok:true});
 }
 if(!admin)return reply({error:'Somente administradores'},403);
 if(body.action==='event'){
 if(typeof body.name!=='string'||!body.name.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(body.date))return reply({error:'Informe nome e data'},400);
 const {error}=await db.from('racing_events').insert({id:crypto.randomUUID(),name:body.name.trim().slice(0,120),date:body.date});if(error)throw error;
 }else if(body.action==='eventUpdate'||body.action==='eventDelete'){
 const {data:existing,error:lookupError}=await db.from('racing_events').select('*').eq('id',body.id).eq('deleted',false).maybeSingle();if(lookupError)throw lookupError;if(!existing)return reply({error:'Evento não encontrado'},404);
 if(body.action==='eventUpdate'&&(typeof body.name!=='string'||!body.name.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(body.date)||isNaN(new Date(body.date+'T12:00:00').getTime())))return reply({error:'Informe nome e data válidos'},400);
 const changes=body.action==='eventDelete'?{deleted:true,status:'closed'}:{name:body.name.trim().slice(0,120),date:body.date};
 const {error}=await db.from('racing_events').update(changes).eq('id',body.id).eq('deleted',false);if(error)throw error;
 }else if(body.action==='eventStatus'){
 if(!['open','closed'].includes(body.status))return reply({error:'Status inválido'},400);
 const {error}=await db.from('racing_events').update({status:body.status}).eq('id',body.id);if(error)throw error;
 }else if(body.action==='posted'){
 const {error}=await db.from('racing_events').update({posted:body.posted?1:0}).eq('id',body.id);if(error)throw error;
 }else if(body.action==='cancel'){
 const {error}=await db.from('racing_sales').update({cancelled:1}).eq('id',body.id);if(error)throw error;
 }else if(body.action==='member'){
 const targetEmail=String(body.email||'').trim().toLowerCase();
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(targetEmail)||typeof body.name!=='string'||!body.name.trim()||!['admin','seller'].includes(body.role))return reply({error:'Confira nome, e-mail e perfil'},400);
 if(targetEmail===email)return reply({error:'Seu próprio acesso não pode ser alterado aqui'},400);
 if(body.password){if(typeof body.password!=='string'||body.password.length<8||body.password.length>128)return reply({error:'Use uma senha entre 8 e 128 caracteres'},400);
 const {error}=await db.auth.admin.createUser({email:targetEmail,password:body.password,email_confirm:true});
 if(error)return reply({error:error.message.includes('already')?'Esse e-mail já tem conta. Salve o acesso sem informar senha.':'Não foi possível criar a conta. Confira e-mail e senha.'},400);
 }
 const {error}=await db.from('racing_members').upsert({email:targetEmail,name:body.name.trim().slice(0,100),role:body.role,active:body.active===false?0:1},{onConflict:'email'});if(error)throw error;
 }else return reply({error:'Ação desconhecida'},400);
 return reply({ok:true});
 }catch(error){return reply({error:friendly(error)},400);}
});
