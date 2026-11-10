const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');const c=vm.createContext({TextEncoder});for(const p of ['data.js','real-data.js','admin-model.js','menu-model.js','option-rules.js','cms-model.js'])vm.runInContext(fs.readFileSync('dist/'+p,'utf8'),c);const {brands,drinks,A,M}=vm.runInContext('({brands,drinks,A:TeaAdmin,M:TeaCMS})',c);let de=M.fromLegacy(A.seed(brands[0],drinks.filter(d=>d.brand==='得正')));M.validate(de);assert.equal(de.items.length,24);assert.equal(de.items[0].cups[0].prices.source.price,25);assert(!Object.hasOwn(de.items[0].cups[0],'price'));
assert.deepEqual(Array.from(de.brand.tags),[]);de.brand.tags=['北中南皆有','溫熱加價'];M.validate(de);const original=JSON.stringify(de);de=M.addRegion(de,{id:'north',name:'北部',copyFrom:'source'});assert.equal(de.items[0].cups[0].prices.north.price,25);de.items[0].cups[0].prices.north.price=35;assert.equal(de.items[0].cups[0].prices.source.price,25);assert(!original.includes('north'));
de=M.addRegion(de,{id:'south',name:'南部'});assert.equal(de.items[0].cups[0].prices.south.price,null);de.items[0].cups[0].prices.south.price=0;assert(M.priceLine(de.items[0].cups[0],M.regionsFor(de)).includes('$0（南部）'));de.items[0].cups[0].prices.south.available=false;assert(M.priceLine(de.items[0].cups[0],M.regionsFor(de)).includes('不供應（南部）'));M.validate(de);
assert.equal(M.regionsFor(de,['north']).length,1);de.regions[0].enabled=false;assert.equal(M.regionsFor(de).length,2);M.validate(de);assert.throws(()=>M.addRegion(de,{id:'other',name:'北部'}));assert.throws(()=>M.addRegion(de,{id:'__proto__',name:'壞資料'}));
const bad=M.clone(de);bad.items[0].cups[0].prices.north.price=-1;assert.throws(()=>M.validate(bad));bad.items[0].cups[0].prices.north.price=NaN;assert.throws(()=>M.validate(bad));delete bad.items[0].cups[0].prices.north;assert.throws(()=>M.validate(bad));const disabled=M.clone(de);disabled.regions.forEach(x=>x.enabled=false);assert.throws(()=>M.validate(disabled));
const activities=M.clone(de);activities.activities=[{id:'feb',name:'二月限定',active:false}];activities.items[0].activity='feb';assert.equal(M.visible(activities,activities.items[0]),false);activities.activities[0].active=true;assert.equal(M.visible(activities,activities.items[0]),true);
console.log('PASS: regional seed migration, copy independence, empty/zero/availability, multi-select, validation, activities');

const types=M.cupTypesFor(de),central=M.applyCupTypes(de,types),medium=types.find(t=>t.size==='中杯');
const renamed=types.map(t=>t.id===medium.id?{...t,size:'標準杯',capacity:'500ml'}:t),changed=M.applyCupTypes(central,renamed);
assert.equal(changed.items[0].cups[0].size,'標準杯');assert.equal(changed.items[0].cups[0].capacity,'500ml');assert.equal(changed.items[0].cups[0].prices.north.price,35);
assert.throws(()=>M.applyCupTypes(central,types.filter(t=>t.id!==medium.id)),/仍有商品使用/);
assert.throws(()=>M.applyCupTypes(central,types.map(t=>({...t,size:'重複杯型'}))),/不可重複/);
console.log('PASS: shared cup rename/capacity updates preserve regional prices and prevent removing referenced cups');

const fractional=M.clone(de);fractional.items[0].cups[0].prices.source.price=30.5;assert.throws(()=>M.validate(fractional),/整數/);
