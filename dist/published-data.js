'use strict';
(function(root){
function inferType(item){
 const text=(item.name+' '+item.menuCategory).toLowerCase();
 if(item.type)return item.type;
 if(/鮮奶|拿鐵|鮮乳/.test(text))return 'fresh_milk_tea';
 if(/奶茶|奶蓋|厚奶/.test(text))return 'milk_tea';
 if(/果|檸檬|梅|柚|橙|蔗/.test(text))return 'fruit';
 return 'tea';
}
function applyPublishedMenus(rows){
 for(const row of rows||[]){
  let d=row?.document;
  if(d?.scope==='site-settings'&&d?.kind==='warm-drink-notices'&&Array.isArray(d.notices)){
   root.TEA_WARM_DRINK_SETTINGS={items:d.notices.filter(item=>item&&item.enabled!==false&&String(item.brand||'').trim()&&String(item.note||'').trim()).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)).map(item=>({brand:String(item.brand).trim(),note:String(item.note).trim()})),updatedAt:row.published_at||''};
   continue;
  }
  const rawBrand=d?.brand;
  if(d?.scope!=='menu-cms'||d?.schemaVersion!==2||!rawBrand?.name||!Array.isArray(d.items)||!Array.isArray(d.regions))continue;d=TeaOptions.normalizeDocument(d);
  if(Array.isArray(rawBrand.categories))d=TeaMenu.normalizeCategories(d);
  const brand=d.brand;
  const old=brands.find(x=>x.name===brand.name)||{},enabled=d.regions.filter(x=>x.enabled),capacities=new Map();
  for(const item of d.items)for(const cup of item.cups||[])if(!capacities.has(cup.size))capacities.set(cup.size,cup.capacity||'');
  const cupTypes=Array.isArray(brand.cupTypes)?brand.cupTypes:[...capacities].map(([size,capacity],i)=>({id:'legacy-cup-'+i,size,capacity}));
  const sizeLabels=cupTypes.length?Object.fromEntries(cupTypes.map(t=>[t.size,t.size+(t.capacity?' · '+t.capacity:'')])):capacities.size?Object.fromEntries([...capacities].map(([size,capacity])=>[size,size+' · '+capacity])):(brand.sizeLabels||{});
  const nextBrand={...old,...brand,cupTypes,sizeLabels,menus:[...(brand.menus||[]),...new Set(d.items.map(x=>x.menuCategory))].filter((name,index,all)=>all.indexOf(name)===index&&d.items.some(x=>x.menuCategory===name&&TeaMenu.isActive(d,x))),regions:enabled.map(x=>({id:x.id,name:x.name})),publishedAt:row.published_at};
  const bi=brands.findIndex(x=>x.name===brand.name);if(bi<0)brands.push(nextBrand);else brands[bi]=nextBrand;
  for(let i=drinks.length-1;i>=0;i--)if(drinks[i].brand===brand.name)drinks.splice(i,1);
  for(const item of d.items){
   if(!TeaMenu.isActive(d,item))continue;
   const variants=[];
   for(const cup of item.cups||[])for(const region of enabled){
    const price=cup.prices?.[region.id];
    if(!price||price.available===false)continue;
    const tg=TeaOptions.effectiveGroups(brand,item,cup).find(g=>g.role==='temperature'),temps=tg?[...new Set(tg.choices.map(TeaOptions.variantTemperature))]:['冷'];for(const temp of temps){const override=item.optionOverrides?.temperature||{},groupOverride=(item.optionGroups||[]).find(g=>g.role==='temperature')||{};const hotSizes=groupOverride.hotCupSizes||override.hotCupSizes;const surcharge=temp==='熱'&&Array.isArray(hotSizes)&&hotSizes.includes(cup.size)?Number(groupOverride.hotSurcharge??override.hotSurcharge??0):0;variants.push({temp,size:cup.size,price:price.price==null?null:Number(price.price)+surcharge,cal:cup.cal??null,oat:false,regionId:region.id,regionName:region.name});}
   }
   if(!variants.length)continue;
   drinks.push({...item,recommended:TeaMenu.isRecommended(item),brand:brand.name,type:inferType(item),milkTypes:item.milkTypes||[],seasonal:!!item.activity,variants,published:true});
  }
  nextBrand.menus=nextBrand.menus.filter(name=>drinks.some(item=>item.brand===brand.name&&item.menuCategory===name));
 }
 return rows?.length||0;
}
async function load(config,request=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await request(config.url+'/rest/v1/menu_publications?select=store_key,document,published_at&is_current=eq.true&order=store_key',{headers:{apikey:config.publishableKey},cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('Published menu request failed');
  const rows=await response.json();applyPublishedMenus(rows);return {ok:true,count:rows.length};
 }catch{return {ok:false,count:0};}
 finally{clearTimeout(timer);}
}
root.TeaPublished={applyPublishedMenus,load};
if(typeof module!=='undefined')module.exports={applyPublishedMenus,load};
})(globalThis);
