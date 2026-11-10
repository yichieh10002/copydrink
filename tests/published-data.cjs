const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({console,AbortController,setTimeout,clearTimeout,fetch:()=>{}});
for(const file of ['data.js','real-data.js','menu-model.js','option-rules.js','published-data.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),ctx);
ctx.rows=[{store_key:'menu-dezheng',published_at:'2026-10-30T00:00:00Z',document:{
 schemaVersion:2,scope:'menu-cms',brand:{name:'得正',menus:['原茶'],tags:['北中南皆有','溫熱加價'],categoryTags:{'原茶':['人氣','可做熱飲']},sugars:['無糖'],ices:['少冰'],toppings:[],sizes:{}},
 regions:[{id:'north',name:'北部',enabled:true},{id:'south',name:'南部',enabled:true},{id:'hidden',name:'停用',enabled:false}],activities:[{id:'feb',name:'二月限定',active:false}],items:[
  {id:'live',name:'測試茶',menuCategory:'原茶',active:true,recommended:true,tags:['推薦','可做熱飲'],activity:'',note:'介紹',reminder:'請洽門市',cups:[{size:'中杯',cal:100,prices:{north:{price:0,available:true},south:{price:null,available:true},hidden:{price:50,available:true}}}]},
  {id:'inactive',name:'下架茶',menuCategory:'原茶',active:false,recommended:false,activity:'',cups:[{size:'中杯',cal:null,prices:{north:{price:1,available:true},south:{price:1,available:true},hidden:{price:1,available:true}}}]},
  {id:'limited',name:'活動茶',menuCategory:'原茶',active:true,recommended:false,activity:'feb',cups:[{size:'中杯',cal:null,prices:{north:{price:1,available:true},south:{price:1,available:true},hidden:{price:1,available:true}}}]}
 ]}},
 {store_key:'site-warm-drink-notices',published_at:'2026-11-10T01:00:00Z',document:{scope:'site-settings',schemaVersion:1,kind:'warm-drink-notices',brand:{name:'溫熱飲提醒'},items:[],notices:[
  {id:'a',brand:'得正',note:'溫熱加價 5 元',enabled:true,order:2},
  {id:'b',brand:'約翰紅茶',note:'熱飲僅中杯',enabled:true,order:1},
  {id:'c',brand:'隱藏店家',note:'不顯示',enabled:false,order:3}
 ]}}];
vm.runInContext('TeaPublished.applyPublishedMenus(rows)',ctx);
const result=vm.runInContext(`({brand:brands.find(x=>x.name==='得正'),live:drinks.find(x=>x.id==='live'),inactive:drinks.some(x=>x.id==='inactive'),limited:drinks.some(x=>x.id==='limited'),north:query({...defaults(),brand:'得正',regions:['north']}).yes[0],south:query({...defaults(),brand:'得正',regions:['south']}).yes[0]})`,ctx);
assert.deepEqual(Array.from(result.brand.regions,x=>x.name),['北部','南部']);assert.deepEqual(Array.from(result.brand.tags),['北中南皆有','溫熱加價']);assert.deepEqual(Array.from(result.brand.categoryTags['原茶']),['人氣','可做熱飲']);assert.deepEqual(Array.from(result.live.tags),['推薦','可做熱飲']);assert.equal(result.live.variants.length,2);assert.equal(result.inactive,false);assert.equal(result.limited,false);assert(result.north.variants.every(x=>x.regionId==='north'&&x.price===0));assert(result.south.variants.every(x=>x.regionId==='south'&&x.price===null));
const warm=vm.runInContext('TEA_WARM_DRINK_SETTINGS',ctx);assert.deepEqual(Array.from(warm.items,x=>x.brand),['約翰紅茶','得正']);assert.equal(warm.updatedAt,'2026-11-10T01:00:00Z');
console.log('PASS: published CMS replaces one store, respects activities/regions, preserves zero and null prices');

// A category rename keeps metadata aligned and does not replace another store.
const wuBefore=vm.runInContext("JSON.stringify(drinks.filter(item=>item.brand==='WUWIN'))",ctx);
vm.runInContext("rows[0].document=TeaMenu.normalizeCategories(rows[0].document);rows[0].document=TeaMenu.updateCategories(rows[0].document,rows[0].document.brand.categories.map(category=>({...category,name:'Original TEA'})));TeaPublished.applyPublishedMenus(rows)",ctx);
const renamed=vm.runInContext("({brand:brands.find(item=>item.name==='得正'),item:drinks.find(item=>item.id==='live'),wu:JSON.stringify(drinks.filter(item=>item.brand==='WUWIN'))})",ctx);
assert.equal(renamed.item.menuCategory,'Original TEA');assert(renamed.item.categoryId);
assert.deepEqual(Array.from(renamed.brand.categoryTags['Original TEA']),['人氣','可做熱飲']);
assert.equal(renamed.wu,wuBefore);
console.log('PASS: publication adapter keeps stable category names/tags together and preserves other stores');
