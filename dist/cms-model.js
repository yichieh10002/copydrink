'use strict';
(function(root){
const clone=x=>JSON.parse(JSON.stringify(x));
const validId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(x)&&!['__proto__','prototype','constructor'].includes(x);
function fromLegacy(input){
 const d=clone(input);d.schemaVersion=2;d.scope='menu-cms';d.activities=d.activities||[];
 d.brand.tags=Array.isArray(d.brand.tags)?d.brand.tags:[];d.brand.categoryTags=d.brand.categoryTags||{};
 d.regions=[{id:'source',name:'提供圖片（地區未標示）',enabled:true}];
 for(const item of d.items){item.active=item.active!==false;item.recommended=!!item.recommended;item.tags=Array.isArray(item.tags)?item.tags:(item.recommended?['推薦']:[]);item.activity=item.activity||'';item.note=item.note||'';item.reminder=item.reminder||'';
  item.cups=item.cups.map(c=>{const cup={...c,capacity:c.capacity||'',cal:c.cal??null,prices:{source:{price:c.price??null,available:true}}};delete cup.price;return cup;});}
 return TeaOptions.normalizeDocument(d);
}

function cupTypesFor(d){
 if(Array.isArray(d.brand.cupTypes))return clone(d.brand.cupTypes);
 const types=new Map();
 for(const item of d.items||[])for(const cup of item.cups||[])if(!types.has(cup.size))types.set(cup.size,{id:'legacy-cup-'+types.size,size:cup.size,capacity:cup.capacity||d.brand.sizeLabels?.[cup.size]?.split(' · ').slice(1).join(' · ')||(d.brand.sizes?.[cup.size]?d.brand.sizes[cup.size]+' ml':'')});
 return [...types.values()];
}
function applyCupTypes(input,types){
 const d=clone(input),old=cupTypesFor(d);
 for(const item of d.items)for(const cup of item.cups){
  const previous=cup.cupTypeId?old.find(t=>t.id===cup.cupTypeId):old.find(t=>t.size===cup.size);
  const type=types.find(t=>t.id===previous?.id);
  if(!type)throw Error('「'+cup.size+'」仍有商品使用，請先到商品取消此杯型再移除。');
  Object.assign(cup,{cupTypeId:type.id,size:type.size,capacity:type.capacity});
 }
 d.brand.cupTypes=clone(types);validate(d);return d;
}
function addRegion(data,{id,name,copyFrom=''}){
 const d=clone(data);if(!validId(id))throw Error('地區識別碼格式不正確');
 if(d.regions.some(r=>r.id===id||r.name.trim()===name.trim()))throw Error('地區名稱不可重複');
 if(copyFrom&&!d.regions.some(r=>r.id===copyFrom))throw Error('找不到要複製的來源菜單');
 d.regions.push({id,name:name.trim(),enabled:true});
 for(const item of d.items)for(const cup of item.cups)cup.prices[id]=copyFrom?clone(cup.prices[copyFrom]):{price:null,available:true};
 validate(d);return d;
}
function visible(data,item){return TeaMenu.isActive(data,item);}
function regionsFor(data,ids=[]){return data.regions.filter(r=>r.enabled&&(!ids.length||ids.includes(r.id)));}
function priceLine(cup,regions){return cup.size+'　'+regions.map(r=>{const p=cup.prices[r.id];return (p?.available===false?'不供應':p?.price==null?'價格未提供':'$'+p.price)+'（'+r.name+'）';}).join('・');}
function validate(d){
 const str=(v,n,max=160)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error(n+'不可空白或超過 '+max+' 字');};
 const optional=(v,n,max=2000)=>{if(v!=null&&(typeof v!=='string'||v.length>max))throw Error(n+'格式或長度不正確');};
 const number=(v,n)=>{if(v!==null&&(!Number.isFinite(v)||v<0||v>1000000))throw Error(n+'必須是非負數或留空');};
 if(d.schemaVersion!==2||d.scope!=='menu-cms')throw Error('菜單版本格式不正確');str(d.brand?.name,'店名');
 if(!Array.isArray(d.brand.menus)||d.brand.menus.some(x=>typeof x!=='string'))throw Error('分類資料格式不正確');
 if(d.brand.categories!==undefined){TeaMenu.validateCategories(d.brand.categories);for(const item of d.items||[]){const category=d.brand.categories.find(category=>category.id===item.categoryId);if(!category||category.name!==item.menuCategory)throw Error('商品分類必須對應店家設定');}}
 const validateTags=(value,name)=>{if(value===undefined)return;if(!Array.isArray(value)||value.length>10)throw Error(name+'最多 10 個');const seen=new Set();for(const tag of value){str(tag,name,24);if(seen.has(tag.trim()))throw Error(name+'不可重複');seen.add(tag.trim());}};
 validateTags(d.brand.tags,'店家標籤');
 if(d.brand.introduction!==undefined){const intro=d.brand.introduction;if(!intro||typeof intro!=='object'||Array.isArray(intro)||typeof intro.expanded!=='boolean')throw Error('品牌介紹格式不正確');optional(intro.title,'品牌介紹標題',160);optional(intro.content,'品牌介紹內容',2000);}
 if(d.brand.topPicks!==undefined){const top=d.brand.topPicks;if(!top||typeof top!=='object'||Array.isArray(top)||typeof top.enabled!=='boolean'||!Array.isArray(top.itemIds)||top.itemIds.length>30)throw Error('必喝 TOP 設定格式不正確');str(top.title,'必喝 TOP 名稱',40);optional(top.description,'必喝 TOP 簡介',300);if(new Set(top.itemIds).size!==top.itemIds.length||top.itemIds.some(id=>typeof id!=='string'))throw Error('必喝 TOP 飲品不可重複');if(top.notes!==undefined){if(!top.notes||typeof top.notes!=='object'||Array.isArray(top.notes))throw Error('必喝 TOP 備註格式不正確');for(const [id,note] of Object.entries(top.notes)){if(!top.itemIds.includes(id))throw Error('必喝 TOP 備註找不到對應飲品');optional(note,'必喝 TOP 備註',160);}}}

 if(d.brand.cupTypes!==undefined){if(!Array.isArray(d.brand.cupTypes)||!d.brand.cupTypes.length||d.brand.cupTypes.length>10)throw Error('店家請設定 1–10 個杯型');const ids=new Set(),names=new Set();for(const type of d.brand.cupTypes){if(!validId(type.id)||ids.has(type.id))throw Error('店家杯型識別碼不可重複');str(type.size,'店家杯型',60);optional(type.capacity,'杯型容量',80);if(names.has(type.size.trim()))throw Error('店家杯型名稱不可重複');ids.add(type.id);names.add(type.size.trim());}}

 if(d.brand.categoryTags!==undefined){if(!d.brand.categoryTags||typeof d.brand.categoryTags!=='object'||Array.isArray(d.brand.categoryTags))throw Error('分類標籤格式不正確');for(const [category,tags] of Object.entries(d.brand.categoryTags)){str(category,'分類標籤名稱');validateTags(tags,'分類標籤');}}
 if(!Array.isArray(d.regions)||!d.regions.length||d.regions.length>20||!d.regions.some(r=>r.enabled===true))throw Error('請保留至少一份啟用的地區菜單（最多 20 份）');
 const ids=new Set(),names=new Set();for(const r of d.regions){if(!validId(r.id)||ids.has(r.id)||typeof r.enabled!=='boolean')throw Error('地區識別碼不可重複');str(r.name,'地區名稱',80);if(names.has(r.name.trim()))throw Error('地區名稱不可重複');ids.add(r.id);names.add(r.name.trim());}
 if(!Array.isArray(d.activities)||d.activities.length>200)throw Error('活動資料格式不正確');const activities=new Set();for(const a of d.activities){str(a.id,'活動識別碼',100);str(a.name,'活動名稱');if(activities.has(a.id)||typeof a.active!=='boolean')throw Error('活動資料不可重複');activities.add(a.id);}
 if(!Array.isArray(d.items)||d.items.length>1000)throw Error('每家店最多 1000 杯');const items=new Set();for(const item of d.items){str(item.id,'商品識別碼',100);if(items.has(item.id))throw Error('商品識別碼重複');items.add(item.id);str(item.name,'品名');str(item.menuCategory,'分類');if(typeof item.active!=='boolean'||typeof item.recommended!=='boolean')throw Error('商品狀態格式不正確');validateTags(item.tags,'飲料標籤');if(item.activity&&!activities.has(item.activity))throw Error('找不到所屬活動');optional(item.note,'介紹');optional(item.reminder,'點餐提醒');optional(item.calBasis,'熱量基準');optional(item.source,'資料來源');optional(item.internalNote,'內部備註');
 if(!Array.isArray(item.cups)||!item.cups.length||item.cups.length>10)throw Error('請保留 1–10 個杯型');const sizes=new Set();for(const c of item.cups){str(c.size,'杯型',60);if(d.brand.cupTypes){const type=d.brand.cupTypes.find(t=>c.cupTypeId?t.id===c.cupTypeId:t.size===c.size);if(!type||type.size!==c.size||type.capacity!==(c.capacity||''))throw Error('商品杯型必須對應店家設定');}if(sizes.has(c.size.trim()))throw Error('杯型不可重複');sizes.add(c.size.trim());optional(c.capacity,'容量',80);if(!c.prices||typeof c.prices!=='object'||Array.isArray(c.prices)||Object.keys(c.prices).length!==ids.size)throw Error('每個杯型都需要各地區價格欄位');for(const id of ids){if(!Object.hasOwn(c.prices,id))throw Error('缺少地區價格');const p=c.prices[id];if(!p||typeof p.available!=='boolean')throw Error('請設定各地區供應狀態');number(p.price,'價格');if(p.price!==null&&!Number.isInteger(p.price))throw Error('價格請填整數，不接受小數');}}
 }
 if(d.brand.topPicks?.itemIds.some(id=>!items.has(id)))throw Error('必喝 TOP 包含已不存在的飲品，請重新選擇');
 TeaOptions.validate(d);if(new TextEncoder().encode(JSON.stringify(d)).length>900000)throw Error('這家店資料超過大小限制，請先匯出備份');return true;
}
root.TeaCMS={clone,cupTypesFor,applyCupTypes,fromLegacy,addRegion,visible,regionsFor,priceLine,validate,normalizeOptions:TeaOptions.normalizeDocument};
})(globalThis);
