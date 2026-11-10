const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.listeners={};this.dataset={};this.className='';this.textContent='';this._value=undefined;this.classList={add:(...xs)=>{this.className+=' '+xs.join(' ');},remove:()=>{},toggle:(name,on)=>{const has=this.className.split(/\s+/).includes(name);if(on&&!has)this.className+=' '+name;if(!on&&has)this.className=this.className.split(/\s+/).filter(x=>x&&x!==name).join(' ');}};}
 append(...nodes){for(const n of nodes){if(n.parentElement)n.parentElement.children=n.parentElement.children.filter(x=>x!==n);this.children.push(n);n.parentElement=this;}}
 prepend(...nodes){for(const n of [...nodes].reverse()){if(n.parentElement)n.parentElement.children=n.parentElement.children.filter(x=>x!==n);this.children.unshift(n);n.parentElement=this;}}
 replaceChildren(...nodes){this.children.forEach(n=>n.parentElement=null);this.children=[];this.append(...nodes);}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,fn){this.listeners[k]=fn;}
 get options(){return this.children.filter(x=>x.tagName==='option');}
 get value(){return this._value===undefined?(this.tagName==='select'?(this.options[0]?.value??''):''):String(this._value);}
 set value(v){this._value=String(v);}
 focus(){} showModal(){this.open=true;} close(){this.open=false;} setCustomValidity(){} reportValidity(){return true;}
}
const nodes={'store-info':new Element('section'),'order-dialog':new Element('dialog'),'order-content':new Element('div'),'top-picks-dialog':new Element('dialog'),'top-picks-content':new Element('div')};
const body=new Element('body');nodes['order-dialog'].append(nodes['order-content']);nodes['top-picks-dialog'].append(nodes['top-picks-content']);body.append(nodes['store-info'],nodes['order-dialog'],nodes['top-picks-dialog']);
const ctx=vm.createContext({console,setTimeout,clearTimeout,document:{body,activeElement:new Element('button'),getElementById:id=>nodes[id],createElement:tag=>new Element(tag),createTextNode:text=>Object.assign(new Element('#text'),{textContent:text})}});
const helpers=fs.readFileSync('dist/ui.js','utf8')+fs.readFileSync('dist/menu-model.js','utf8')+fs.readFileSync('dist/option-rules.js','utf8')+fs.readFileSync('dist/store-view.js','utf8');
vm.runInContext(fs.readFileSync('dist/data.js','utf8')+fs.readFileSync('dist/real-data.js','utf8')+'\nconst $=id=>document.getElementById(id);let s=defaults();function completeMenuState(state){return {...state,temp:\'\',size:\'\',cal:\'\',price:\'\',oat:false,largeWarm:false,unknown:false,sort:\'default\'};}\n'+helpers+fs.readFileSync('dist/order.js','utf8')+fs.readFileSync('dist/home-tools.js','utf8').split("$('open-quick').onclick")[0],ctx);
const all=root=>[root,...root.children.flatMap(all)];
vm.runInContext('openQuick()',ctx);
const quick=body.children.find(x=>x.className.includes('tool-dialog'));
const qnodes=all(quick),brand=qnodes.find(x=>x.name==='brand'),dep=qnodes.find(x=>x.className==='quick-dependent'),form=qnodes.find(x=>x.id==='quick-order-form');
assert.equal(dep.disabled,true);
vm.runInContext("brands[0].cupTypes=[{id:'m',size:'中杯',capacity:'16oz'},{id:'l',size:'大杯',capacity:'22oz'}];brands[0].sugars=['店家無糖','店家半糖'];brands[0].ices=['店家少冰','熱飲'];brands[0].toppings=[{name:'測試珍珠',price:10}]",ctx);
brand.value='得正';form.listeners.input();assert.equal(dep.disabled,false);
const quickList=key=>all(quick).find(x=>x.id==='quick-'+key+'-list').children.map(x=>x.value);
assert.deepEqual(quickList('size'),['中杯 · 16oz','大杯 · 22oz']);assert.deepEqual(quickList('sugar'),['店家無糖','店家半糖']);assert.deepEqual(quickList('ice'),['店家少冰','熱飲']);assert.deepEqual(quickList('toppings'),['測試珍珠']);
const sugarInput=qnodes.find(x=>x.name==='sugar'),drinkInput=qnodes.find(x=>x.name==='drink');sugarInput.value='店家半糖';drinkInput.value='冰沙';form.listeners.input();assert.equal(sugarInput.value,'店家半糖');
brand.value='未收錄店家';form.listeners.input();assert.equal(sugarInput.value,'');assert.equal(drinkInput.value,'冰沙');assert(quickList('sugar').includes('無糖'));
brand.value='';form.listeners.input();assert.equal(dep.disabled,true);
assert.equal(form.parentElement.className,'copy-scroll');
const signature=qnodes.find(x=>x.name==='signature'),note=qnodes.find(x=>x.name==='note');
assert.equal(dep.children.indexOf(signature.parentElement)+1,dep.children.indexOf(note.parentElement));
assert(qnodes.some(x=>x.type==='submit'&&x.attrs.form==='quick-order-form'&&x.parentElement.className==='copy-fixed'));
vm.runInContext("delete brands[0].cupTypes;drinks.find(d=>d.id==='de20').cups=[{size:'中杯',capacity:'14oz'},{size:'大杯',capacity:'20oz'}];openOrder('de20')",ctx);
const menu=all(nodes['order-content']),menuForm=menu.find(x=>x.id==='menu-order-form');
assert.equal(menuForm.parentElement.className,'copy-scroll');
const size=menu.find(x=>x.tagName==='select'&&x.options.some(o=>o.textContent==='中杯 · 14oz'));
assert(size);assert(size.options.some(o=>o.textContent==='大杯 · 20oz'));
assert(menu.some(x=>x.textContent==='店家無糖'));
assert(menu.filter(x=>x.tagName==='input'&&x.type==='radio').length>=4);
assert(menu.some(x=>x.id==='order-preview'&&x.parentElement.parentElement.className==='copy-fixed'));
console.log('PASS: store gating, item-specific cup capacity, fixed preview/form association, signature order and radio options');

vm.runInContext("brands[0].cupTypes=[{id:'l',size:'大杯',capacity:'22oz'}];drinks.find(d=>d.id==='de20').variants=drinks.find(d=>d.id==='de20').variants.filter(v=>v.size==='大杯');openOrder('de20')",ctx);
const onlyLarge=all(nodes['order-content']).find(x=>x.tagName==='select'&&x.options.some(o=>o.textContent==='大杯 · 22oz'));
assert(onlyLarge);assert.equal(onlyLarge.options.length,1);
console.log('PASS: home shared cup suggestions and product-only large size');

vm.runInContext("brands[0].cupTypes=[{id:'l',size:'大杯',capacity:'22oz'},{id:'m',size:'中杯',capacity:'16oz'}];brands[0].optionGroups=[{id:'temperature',name:'冰量／溫熱',kind:'single',role:'temperature',required:true,choices:[{id:'cold',label:'少冰',price:0,temperature:'cold'},{id:'hot',label:'熱飲',price:0,temperature:'hot'}]}];const target=drinks.find(d=>d.id==='de20');target.cups=[{cupTypeId:'l',size:'大杯',capacity:'22oz'},{cupTypeId:'m',size:'中杯',capacity:'16oz',optionChoiceIds:{temperature:['hot']},showWhenChoiceIds:['hot']}];target.optionGroups=[];target.optionOverrides={};target.fixedIce='';target.variants=[{size:'大杯',temp:'冷',price:45,oat:false},{size:'中杯',temp:'熱',price:45,oat:false}];openOrder('de20')",ctx);
let conditionalMenu=all(nodes['order-content']),largeRadio=conditionalMenu.find(x=>x.tagName==='input'&&x.type==='radio'&&x.value==='大杯'),mediumRadio=conditionalMenu.find(x=>x.tagName==='input'&&x.type==='radio'&&x.value==='中杯');
assert(largeRadio);assert(mediumRadio);assert.equal(largeRadio.parentElement.hidden,false);assert.equal(mediumRadio.parentElement.hidden,true);assert.equal(vm.runInContext("storeCapacityLabel(brands[0])",ctx),'大杯 22oz');
const hotRadio=conditionalMenu.find(x=>x.tagName==='input'&&x.type==='radio'&&x.value==='hot');assert(hotRadio);hotRadio.checked=true;hotRadio.onchange();conditionalMenu=all(nodes['order-content']);largeRadio=conditionalMenu.find(x=>x.tagName==='input'&&x.type==='radio'&&x.value==='大杯');mediumRadio=conditionalMenu.find(x=>x.tagName==='input'&&x.type==='radio'&&x.value==='中杯');
assert.equal(largeRadio.parentElement.hidden,true);assert.equal(mediumRadio.parentElement.hidden,false);assert.equal(mediumRadio.checked,true);assert(conditionalMenu.some(x=>x.textContent==='熱飲僅中杯'));
console.log('PASS: conditional cup stays hidden until its temperature is selected and store summary excludes it');

vm.runInContext("brands[0].ices=['正常冰','熱 +5元（55°C）','溫 +5元（65°C）'];s.brand='得正';renderStoreInfo()",ctx);
const info=all(nodes['store-info']);
const iceRow=info.find(x=>x.className==='store-essential-row'&&x.children.some(c=>c.textContent==='冰量／溫度'));
assert(iceRow);assert.equal(iceRow.children.find(x=>x.tagName==='span'&&!x.className.includes('ui-icon')).textContent,'正常冰・熱 +5元（55°C）・溫 +5元（65°C）');
console.log('PASS: store ice/temperature summary preserves backend labels and order without inferred options');

vm.runInContext("brands[0].introduction={title:'品牌介紹',content:'第一行'+String.fromCharCode(10)+'第二行',expanded:true};brands[0].regions=[{id:'all',name:'全台'}];brands[0].menuEdition='舊版文案';brands[0].sourceNote='舊來源文案';renderStoreInfo()",ctx);
let storeInfo=all(nodes['store-info']),intro=storeInfo.find(x=>x.className==='store-brand-panel');
assert(storeInfo.some(x=>x.className==='store-menu-count'&&x.textContent.startsWith('1 個地區 · ')&&x.textContent.endsWith(' 款飲品')));
assert(intro);assert.equal(intro.hidden,true);assert(intro.children.some(x=>x.textContent==='第一行\n第二行'));
assert.equal(intro.parentElement.className,'store-overview store-utility-section');
assert(!storeInfo.some(x=>['地區菜單','舊版文案','舊來源文案'].includes(x.textContent)));
assert(!storeInfo.some(x=>x.textContent.includes('依本次菜單的')));
vm.runInContext("brands[0].regions=[{id:'north',name:'北部'},{id:'south',name:'南部'}];renderStoreInfo()",ctx);
assert(!all(nodes['store-info']).some(x=>x.textContent.includes('依本次菜單的')));
assert(all(nodes['store-info']).some(x=>x.className==='store-menu-count'&&x.textContent.startsWith('2 個地區 · ')&&x.textContent.endsWith(' 款飲品')));
console.log('PASS: editable collapsed introduction and removed legacy copy');

vm.runInContext("brands[0].nutritionUrl='https://example.test/nutrition';renderStoreInfo()",ctx);
const nutritionLink=all(nodes['store-info']).find(x=>x.tagName==='a'&&x.href==='https://example.test/nutrition');
assert(nutritionLink);assert(nutritionLink.children.some(x=>x.textContent==='熱量資訊'));assert.equal(nutritionLink.target,'_blank');
console.log('PASS: nutrition link uses published brand URL and opens separately');
// Store details render again during initial script loading; retain the relocated title.
const relocatedHeading=new Element('div');relocatedHeading.className='menu-heading-slot';nodes['store-info'].append(relocatedHeading);
vm.runInContext('renderStoreInfo();renderStoreInfo()',ctx);
assert.equal(relocatedHeading.parentElement,nodes['store-info']);
assert.equal(nodes['store-info'].children[0],relocatedHeading);
console.log('PASS: initial store details refresh retains the relocated menu heading');
