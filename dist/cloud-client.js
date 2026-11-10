'use strict';
// Browser speaks to Supabase Auth and Data APIs. Access tokens stay in memory.
(function(root){
class CloudError extends Error{constructor(message,code){super(message);this.code=code;}}
function createClient(config,request=fetch){
 if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.url)||!config.publishableKey.startsWith('sb_publishable_'))throw Error('雲端設定不完整');
 let token=null,user=null;
 async function call(path,{method='GET',body,authenticated=true,prefer}={}){
  if(authenticated&&!token)throw new CloudError('請先登入管理者帳號。','LOGIN_REQUIRED');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const headers={apikey:config.publishableKey,'Content-Type':'application/json'};
   if(authenticated)headers.Authorization='Bearer '+token;
   if(prefer)headers.Prefer=prefer;
   const response=await request(config.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:controller.signal});
   if(response.status===204)return null;
   let data;try{data=await response.json();}catch{throw new CloudError('伺服器回應格式異常，請稍後重試。','RESPONSE');}
   if(!response.ok){
    if(authenticated&&response.status===401){token=null;user=null;throw new CloudError('登入已過期，請重新登入；尚未儲存的內容仍保留在畫面。','LOGIN_REQUIRED');}
    if(response.status===409||data?.code==='40001')throw new CloudError('草稿版本已變更，請先重新讀取再操作。','CONFLICT');
    if(response.status===403)throw new CloudError('此帳號沒有菜單管理權限。','FORBIDDEN');
    if(response.status===429)throw new CloudError('操作太頻繁，請稍候再試。','RATE_LIMIT');
    if(!authenticated)throw new CloudError('登入失敗，請確認信箱、密碼與帳號驗證狀態。','LOGIN_FAILED');
    throw new CloudError('雲端操作失敗，未確認儲存成功。請稍後重新讀取確認。','REQUEST');
   }
   return data;
  }catch(err){if(err instanceof CloudError)throw err;throw new CloudError('目前無法連線或請求逾時。儲存狀態未確認，請重新讀取確認。','NETWORK');}
  finally{clearTimeout(timeout);}
 }
 const fields='store_key,document,revision,updated_at';
 return {
  async login(email,password){
   token=null;user=null;
   const auth=await call('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},authenticated:false});
   if(!auth.access_token||!auth.user?.id)throw new CloudError('登入回應不完整。','LOGIN_FAILED');
   token=auth.access_token;
   try{const rows=await call('/rest/v1/menu_admins?select=user_id,active&user_id=eq.'+encodeURIComponent(auth.user.id));if(!rows.some(r=>r.active))throw new CloudError('帳號可以登入，但尚未取得管理權限。','FORBIDDEN');user={id:auth.user.id,email:auth.user.email};return {...user};}
   catch(err){try{await call('/auth/v1/logout?scope=local',{method:'POST'});}catch{}token=null;user=null;throw err;}
  },
  async logout(){try{if(token)await call('/auth/v1/logout?scope=local',{method:'POST'});}finally{token=null;user=null;}},
  getUser(){return user?{...user}:null;},
  async listMenus(){
   const result=[];let offset=0;
   while(true){const rows=await call('/rest/v1/menu_drafts?select=store_key,revision,updated_at,brand:document->brand&document->>scope=eq.menu-cms&order=store_key&limit=200&offset='+offset);result.push(...rows);if(rows.length<200)return result;offset+=200;}
  },
  async load(storeKey){const rows=await call('/rest/v1/menu_drafts?select='+fields+'&store_key=eq.'+encodeURIComponent(storeKey));return rows[0]||null;},
  async save(storeKey,document,expectedRevision){
   const base='/rest/v1/menu_drafts?select='+fields;
   const rows=expectedRevision===null
    ?await call(base,{method:'POST',body:{store_key:storeKey,document},prefer:'return=representation'})
    :await call(base+'&store_key=eq.'+encodeURIComponent(storeKey)+'&revision=eq.'+encodeURIComponent(expectedRevision),{method:'PATCH',body:{document},prefer:'return=representation'});
   if(!rows?.length)throw new CloudError('草稿版本已變更，或管理權限已移除。請保留目前文字，重新讀取後再確認。','CONFLICT');
   return rows[0];
  },
  async listPublications(storeKey){
   return call('/rest/v1/menu_publications?select=id,store_key,source_revision,published_at,is_current&store_key=eq.'+encodeURIComponent(storeKey)+'&order=published_at.desc');
  },
  async publish(storeKey,expectedRevision){
   const rows=await call('/rest/v1/rpc/publish_menu_draft',{method:'POST',body:{p_store_key:storeKey,p_expected_revision:expectedRevision}});
   if(!rows?.length)throw new CloudError('發布未完成，請重新讀取後確認。','REQUEST');
   return rows[0];
  },
  async restorePublication(publicationId,expectedRevision){
   const rows=await call('/rest/v1/rpc/restore_menu_publication',{method:'POST',body:{p_publication_id:publicationId,p_expected_revision:expectedRevision}});
   if(!rows?.length)throw new CloudError('還原未完成，請重新讀取後確認。','REQUEST');
   return rows[0];
  }
 };
}
root.TeaCloud={createClient,CloudError};
})(globalThis);
