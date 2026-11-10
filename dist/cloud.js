'use strict';
(()=>{
 const $=id=>document.getElementById(id),client=TeaCloud.createClient(TEA_CLOUD_CONFIG),key='connection-test-dezheng';
 const initial={schemaVersion:1,scope:'connection-test',brand:{name:'得正'},items:[{id:'connection-test-drink',name:'春烏龍',menuCategory:'原茶',reminder:'',cups:[{size:'大杯',price:null}]}]};
 let row=null,documentData=null,busy=false,dirty=false,loaded=false;
 function say(text){$('cloud-status').textContent=text;}
 function lock(value){busy=value;document.querySelectorAll('form input,form textarea,form button,#cloud-reload,#cloud-logout').forEach(n=>{if(n.id||n.tagName==='BUTTON')n.disabled=value;});}
 function fill(record){
  row=record;documentData=JSON.parse(JSON.stringify(record?.document||initial));
  const d=documentData.items?.[0],c=d?.cups?.[0];
  if(!d||!c)throw Error('雲端草稿格式無法辨識，尚未覆寫任何內容。');
  $('cloud-name').value=d.name;$('cloud-size').value=c.size;$('cloud-price').value=c.price??'';$('cloud-reminder').value=d.reminder||'';
  $('cloud-revision').textContent=record?'雲端版本 '+record.revision+' · '+new Date(record.updated_at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'目前尚無雲端紀錄，填寫後按儲存才會建立。';
  $('cloud-response').textContent=JSON.stringify(record||{document:documentData,stored:false},null,2);dirty=false;loaded=true;
 }
 function onError(err){say(err.message);if(err.code==='LOGIN_REQUIRED'){$('login-section').hidden=false;$('draft-section').hidden=true;}}
 $('cloud-login').onsubmit=async e=>{
  e.preventDefault();if(busy)return;lock(true);say('後端正在確認登入與管理權限…');
  const password=$('cloud-password').value;$('cloud-password').value='';
  try{const user=await client.login($('cloud-email').value.trim(),password);$('cloud-account').textContent='已登入：'+user.email;$('draft-section').hidden=false;$('login-section').hidden=true;
   if(!dirty){loaded=false;fill(await client.load(key));say(row?'已從資料庫讀回雲端草稿。':'登入成功，尚未建立測試草稿。');}else say('已重新登入，先前未儲存的文字仍保留；可以儲存或重新讀取雲端。');
  }catch(err){onError(err);}finally{lock(false);$('cloud-save').disabled=!loaded;}
 };
 $('cloud-draft').oninput=()=>{dirty=true;};
 $('cloud-draft').onsubmit=async e=>{
  e.preventDefault();if(busy||!loaded||!$('cloud-draft').reportValidity())return;
  const name=$('cloud-name').value.trim(),size=$('cloud-size').value.trim(),price=$('cloud-price').value;
  if(!name||!size){say('品名與杯型不能只有空白。');return;}
  const next=JSON.parse(JSON.stringify(documentData));Object.assign(next.items[0],{name,reminder:$('cloud-reminder').value.trim()});Object.assign(next.items[0].cups[0],{size,price:price===''?null:Number(price)});
  lock(true);say('前端已送出，等待資料庫確認儲存…');
  try{fill(await client.save(key,next,row?.revision??null));say('✓ 雲端已儲存。按「重新讀取雲端」，或重新整理後登入確認。');}catch(err){onError(err);}finally{lock(false);}
 };
 $('cloud-reload').onclick=async()=>{
  if(busy||dirty&&!confirm('重新讀取會取代畫面上尚未儲存的內容，確定繼續？'))return;
  lock(true);say('正在從雲端重新取得資料…');
  try{fill(await client.load(key));say(row?'✓ 已從資料庫重新讀取，並非讀取瀏覽器本機草稿。':'目前尚無雲端紀錄。');}catch(err){onError(err);}finally{lock(false);$('cloud-save').disabled=!loaded;}
 };
 $('cloud-logout').onclick=async()=>{
  if(busy||dirty&&!confirm('尚有未儲存內容，確定登出？'))return;
  lock(true);let failed=false;try{await client.logout();}catch{failed=true;}finally{dirty=false;loaded=false;row=null;documentData=null;$('draft-section').hidden=true;$('login-section').hidden=false;$('cloud-draft').reset();$('cloud-response').textContent='';say(failed?'本頁已登出；伺服器登出未確認。':'已登出。雲端草稿仍然保留。');lock(false);}
 };
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
})();
