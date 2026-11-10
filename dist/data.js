'use strict';
const categories=['大項目1・鮮奶茶','大項目2・純茶','大項目3・其他'];
const v=(temp,size,price,cal,oat=false)=>({temp,size,price,cal,oat});
const drinks=[
{id:'a1',brand:'A店家',name:'項目一',category:categories[0],variants:[v('冷','大杯',60,320),v('溫','中杯',50,230),v('熱','中杯',50,230),v('冷','大杯',75,280,true),v('溫','中杯',65,210,true)]},
{id:'a2',brand:'A店家',name:'項目二',category:categories[0],variants:[v('冷','大杯',65,300),v('溫','大杯',65,300),v('熱','中杯',55,240),v('溫','大杯',80,null,true)]},
{id:'a3',brand:'A店家',name:'項目三',category:categories[1],variants:[v('冷','大杯',35,0),v('溫','大杯',35,0),v('熱','大杯',35,0)]},
{id:'a4',brand:'A店家',name:'項目四',category:categories[2],variants:[v('冷','大杯',70,400)]},
{id:'b1',brand:'B店家',name:'項目一',category:categories[0],variants:[v('冷','大杯',70,340),v('溫','大杯',70,340),v('溫','大杯',85,260,true),v('冷','大杯',85,260,true)]},
{id:'b2',brand:'B店家',name:'項目二',category:categories[0],variants:[v('冷','大杯',55,null),v('溫','中杯',45,null)]},
{id:'b3',brand:'B店家',name:'項目三',category:categories[1],variants:[v('冷','大杯',40,0),v('溫','大杯',40,0)]},
{id:'b4',brand:'B店家',name:'項目四',category:categories[2],variants:[v('冷','中杯',65,280),v('熱','中杯',65,280)]}
];
const types=[{id:'fresh_milk_tea',label:'鮮奶茶',aliases:['鮮奶','拿鐵','鮮乳茶']},{id:'milk_tea',label:'奶茶',aliases:['奶精奶茶']},{id:'tea',label:'純茶',aliases:['好茶']},{id:'fruit',label:'水果茶',aliases:['果茶','新鮮']}];
const brands=[{name:'A店家',menus:['季節限定','找好茶','找奶茶','找拿鐵','找新鮮']},{name:'B店家',menus:['季節限定','原葉茶','奶茶系列','鮮乳系列','水果系列']}];
for(const d of drinks){const n=Number(d.id[1]);d.type=n<3?'fresh_milk_tea':n===3?'tea':'fruit';d.milkTypes=n<3?['fresh_milk']:[];d.menuCategory=d.brand==='A店家'?(n<3?'找拿鐵':n===3?'找好茶':'找新鮮'):(n<3?'鮮乳系列':n===3?'原葉茶':'水果系列');d.seasonal=n===4;d.name+=n===1?'拿鐵':n===2?'鮮乳茶':n===3?'青茶':'果茶';}
drinks.push({id:'a5',brand:'A店家',name:'項目五奶茶',type:'milk_tea',milkTypes:['creamer'],menuCategory:'找奶茶',seasonal:false,variants:[v('冷','大杯',45,350),v('溫','中杯',40,280)]});
const defaults=()=>({brand:'',q:'',cats:[],regions:[],type:'',temp:'',size:'',largeWarm:false,oat:false,cal:'',price:'',unknown:false,sort:'default',remember:false});
const normalize=x=>String(x).normalize('NFKC').toLowerCase().trim();
function textMatches(d,q){const t=types.find(t=>t.id===d.type);return [d.name,d.brand,d.menuCategory,t.label,...t.aliases].some(x=>normalize(x).replace(/\u200b/g,'').includes(normalize(q).replace(/\u200b/g,'')));}
function matchVariant(x,s){if((s.temp&&x.temp!==s.temp)||(s.size&&x.size!==s.size)||x.oat!==s.oat)return 'no';if(s.regions?.length&&x.regionId&&!s.regions.includes(x.regionId))return 'no';if(s.largeWarm&&(x.temp!=='溫'||x.size!=='大杯'))return 'no';if(s.price!==''&&x.price===null)return 'no';if(s.price!==''&&x.price>Number(s.price))return 'no';if(s.cal!==''&&x.cal===null)return 'unknown';if(s.cal!==''&&x.cal>Number(s.cal))return 'no';return 'yes';}
function query(s){const yes=[],pending=[];for(const d of drinks){if((s.brand&&d.brand!==s.brand)||(s.type&&d.type!==s.type)||(s.q&&!textMatches(d,s.q))||(s.cats.length&&!s.cats.some(c=>c==='季節限定'?d.seasonal:d.menuCategory===c)))continue;const good=d.variants.filter(x=>matchVariant(x,s)==='yes'),maybe=d.variants.filter(x=>matchVariant(x,s)==='unknown');if(good.length)yes.push({...d,variants:good});else if(maybe.length)pending.push({...d,variants:maybe});}const value=d=>Math.min(...d.variants.map(x=>s.sort==='price'?(x.price??Infinity):(x.cal??Infinity)));if(s.sort!=='default')yes.sort((a,b)=>value(a)-value(b));return {yes,pending};}
function suggestions(q,brand=''){q=normalize(q);if(!q)return [];const rank=values=>Math.min(...values.map(x=>normalize(x)===q?0:normalize(x).startsWith(q)?1:normalize(x).includes(q)?2:99));const list=[];if(!brand)for(const b of brands)list.push({kind:'店家',label:b.name,brand:b.name,rank:rank([b.name,...(b.aliases||[])])});for(const t of types)if(drinks.some(d=>(!brand||d.brand===brand)&&d.type===t.id))list.push({kind:'飲料類型',label:t.label,type:t.id,rank:rank([t.label,...t.aliases])});for(const d of drinks)if(!brand||d.brand===brand)list.push({kind:'飲料',label:`${d.name} · ${d.brand}`,id:d.id,brand:d.brand,rank:rank([d.name])});return list.filter(x=>x.rank<99).sort((a,b)=>a.rank-b.rank).slice(0,6);}
if(typeof module!=='undefined')module.exports={query,defaults,drinks,suggestions};

// Prototype options are intentionally fictional, including volumes and restrictions.
for(const b of brands){b.sugars=['無糖','微糖','半糖','少糖','正常糖'];b.ices=['正常冰','少冰','微冰','去冰'];b.sizes={'中杯':500,'大杯':700};b.toppings=[{name:'珍珠',price:10},{name:'椰果',price:10},{name:'布丁',price:15}];}
for(const d of drinks){d.note=d.type==='fresh_milk_tea'?'茶香與鮮乳交織｜柔順奶香':d.type==='tea'?'清爽原葉茶香｜細細回甘':d.type==='fruit'?'清新果香｜酸甜爽口':'經典茶香｜滑順奶香';d.recommended=d.id==='a1'||d.id==='b3';d.fixedSugar=d.id==='a4'?'正常糖':null;d.fixedIce=d.id==='a4'?'正常冰':null;d.noToppings=d.id==='a4';}
brands.push({name:'NAP TEA 示範',menus:['棉被厚奶蓋'],sugars:['無糖','微糖','半糖','少糖','正常糖'],ices:['正常冰','少冰','微冰','去冰'],sizes:{},toppings:[]});
drinks.push({id:'nap1',brand:'NAP TEA 示範',name:'棉被四季金萱',note:'3cm綿密厚奶蓋｜花奶香淺焙四季金萱',type:'tea',milkTypes:['cream','fresh_milk'],menuCategory:'棉被厚奶蓋',seasonal:false,variants:[v('冷','大杯',75,null)],optionDemo:true});
function joinCopyParts(parts,separator='｜'){const sep=separator===' '?' ':separator==='•'?' • ':'｜';return parts.filter(Boolean).join(sep);}
function orderText(d,x,sugar,ice,toppings,quantity,note,extra={}){const sections={signature:[extra.signature?.trim()],brand:[extra.includeBrand===false?null:d.brand],drink:[d.name,x.size,x.oat?'燕麥奶':null,sugar,x.temp==='冷'?ice:x.temp+'飲',toppings.length?toppings.map(t=>'加'+t.name).join('、'):null,...(extra.selections||[]),quantity+' 杯',extra.price!==undefined&&extra.price!==''?'$'+extra.price:null,note.trim()?'備註：'+note.trim():null]},order=Array.isArray(extra.order)?extra.order:['signature','brand','drink'];return joinCopyParts(order.filter(key=>sections[key]).flatMap(key=>sections[key]),extra.separator);}
if(typeof module!=='undefined')Object.assign(module.exports,{brands,orderText,joinCopyParts});

function iceChoices(d,b,size,oat){const temps=new Set(d.variants.filter(v=>v.size===size&&v.oat===oat).map(v=>v.temp));return [...(temps.has('冷')?(d.fixedIce?[d.fixedIce]:b.ices.length?b.ices:['冰量待確認']):[]),...(temps.has('溫')?['溫飲']:[]),...(temps.has('熱')?['熱飲']:[])];}
if(typeof module!=='undefined')module.exports.iceChoices=iceChoices;

function getDrinkReminder(d){return d.reminder||[...new Set([d.fixedSugar?'甜度固定':null,d.fixedIce?'冰量固定為'+d.fixedIce:null,d.noToppings?'不提供加料':null,d.variants.every(v=>v.temp==='冷')?'僅供冰飲':null].filter(Boolean))].join('；')||'甜度與冰量請依門市供應確認';}
