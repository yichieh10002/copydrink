'use strict';
const quickDraft={mode:'catalog',catalog:{quantity:'1'},free:{quantity:'1'}};
function makeToolDialog(title){const modal=el('dialog',undefined,'tool-dialog'),inner=el('div',undefined,'tool-dialog-inner'),head=el('div',undefined,'row');const heading=el('h2',title);heading.id='tool-dialog-title';modal.setAttribute('aria-labelledby',heading.id);const previous=document.activeElement;const close=()=>modal.close();const back=btn('關閉',close,'close-sheet');back.setAttribute('aria-label','關閉視窗');head.append(heading,back);inner.append(head);modal.append(inner);document.body.append(modal);modal.addEventListener('close',()=>{document.body.classList.remove('sheet-open');modal.remove();previous?.focus();});modal.addEventListener('cancel',e=>{e.preventDefault();close();});modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});return {modal,inner,back,head};}
function quickOrderText(x){return joinCopyParts([x.signature?.trim(),x.includeBrand&&x.brand?.trim()?x.brand.trim():null,x.drink.trim(),x.size?.trim(),x.sugar.trim(),x.ice.trim(),x.milk?.trim(),x.toppings?.trim()?'加料：'+x.toppings.trim():null,x.quantity+' 杯',x.price!==''&&x.price!==undefined?'$'+x.price:null,x.note?.trim()?'備註：'+x.note.trim():null],x.separator);}
function quickWarning(){return '';}
function openQuick(){
 const {modal,inner,back,head}=makeToolDialog('自填飲料小抄');
 const form=el('form');form.id='quick-order-form';inner.append(form);
 let mode=quickDraft.mode||'catalog',lastBrandKey=null,lastDrinkId=null;
 const modeBox=el('fieldset',undefined,'quick-mode-switch'),modeLegend=el('legend','填寫方式'),modeChoices=el('div',undefined,'quick-mode-choices'),modeHelp=el('p',undefined,'quick-mode-help');modeBox.append(modeLegend,modeChoices,modeHelp);form.append(modeBox);
 const modeInputs={};
 for(const [value,label] of [['catalog','使用 copydrink 飲料'],['free','一般填寫']]){const wrap=el('label',undefined,'quick-mode-choice'),input=el('input');input.type='radio';input.name='quick-mode';input.value=value;input.checked=mode===value;wrap.append(input,el('span',label));modeChoices.append(wrap);modeInputs[value]=input;}
 const inputs={},lists={},labels={},suggestions={};let fields;
 function field(key,label,{required=false,list=[],type='text',placeholder='',value='',search=false}={}){const wrap=el('label',undefined,'order-field quick-order-field'),labelText=el('span',label,'quick-field-label'),input=el(type==='textarea'?'textarea':'input');wrap.append(labelText);labels[key]=labelText;if(type!=='textarea')input.type=type;if(type==='number'){input.step='1';input.inputMode='numeric';}input.name=key;input.required=required;input.value=value;input.placeholder=placeholder;if(type==='textarea'){input.rows=2;input.maxLength=160;}else if(type==='text'){input.maxLength=80;}if(search){const shell=el('div',undefined,'quick-search-shell'),result=el('div',undefined,'quick-suggestions');result.hidden=true;result.setAttribute('role','listbox');input.setAttribute('autocomplete','off');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');shell.append(input,result);wrap.append(shell);suggestions[key]=result;}else{if(list.length||['size','sugar','ice','toppings'].includes(key)){const dl=el('datalist');lists[key]=dl;dl.id='quick-'+key+'-list';list.forEach(text=>{const op=el('option');op.value=text;dl.append(op);});input.setAttribute('list',dl.id);wrap.append(dl);}if(key==='price'){const row=el('div',undefined,'price-input');row.append(el('span','$'),input);wrap.append(row);input.min=0;input.step='1';}else wrap.append(input);}(fields||form).append(wrap);inputs[key]=input;return input;}
 field('brand','搜尋或輸入店家 *',{required:true,search:true,placeholder:'輸入店名、英文或注音'});
 const storeCard=el('div',undefined,'quick-store-card');storeCard.hidden=true;form.append(storeCard);
 fields=el('fieldset',undefined,'quick-dependent');form.append(fields);
 const checkLabel=el('label',undefined,'check'),brandCheck=el('input');brandCheck.type='checkbox';brandCheck.name='includeBrand';checkLabel.append(brandCheck,document.createTextNode('複製文字也顯示店名'));fields.append(checkLabel);
 field('drink','搜尋或輸入飲料 *',{required:true,search:true,placeholder:'搜尋店內飲料，或直接輸入品名'});
 field('size','杯型／容量（選填）',{list:['大杯','中杯','小杯','瓶裝'],placeholder:'選擇建議或自行輸入'});
 field('sugar','甜度 *',{required:true,list:['全糖','少糖','半糖','微糖','一分糖','無糖','甜度固定'],placeholder:'選擇建議或自行輸入'});
 field('ice','冰量／溫熱 *',{required:true,list:['正常冰','少冰','微冰','去冰','完全去冰','常溫','溫飲','熱飲','冰量固定'],placeholder:'選擇建議或自行輸入'});
 field('milk','換奶／配方（選填）',{placeholder:'例如：換燕麥奶'});
 field('toppings','配料（選填）',{placeholder:'例如：珍珠、椰果；也可自行輸入'});
 const qty=field('quantity','數量 *',{required:true,type:'number',value:'1'});qty.min=1;qty.max=99;qty.step=1;
 field('price','價格（選填）',{type:'number',placeholder:'有填才加入複製文字'});
 field('signature','署名（選填）',{placeholder:'例如：小潔'});
 field('note','備註（選填）',{type:'textarea',placeholder:'有填才加入複製文字'});
 const warning=el('p',undefined,'quick-warning');warning.setAttribute('role','status');warning.hidden=true;
 const previewLabel=el('label','複製後的文字','order-field'),preview=el('textarea');preview.readOnly=true;preview.rows=4;previewLabel.append(preview);
 const status=el('p',undefined,'copy-hint');status.setAttribute('role','status');const copy=el('button','複製跟團文字','primary copy-order');copy.type='submit';
 fields.append(warning,separatorControl(update));form.append(previewLabel,status,copy,el('small','本次填寫在關閉後仍會保留，重新整理頁面後清除。複製不代表送出訂單。'));
 const norm=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s\u200bˊˇˋ˙]+/g,'');
 const brandTerms=brand=>[brand.name,...(brand.aliases||[]),...(brand.searchAliases||[]),...(brand.zhuyinAliases||[])];
 const matches=(values,query)=>{const q=norm(query);if(!q)return true;return values.some(value=>norm(value).includes(q));};
 const exactBrand=()=>brands.find(brand=>norm(brand.name)===norm(inputs.brand.value));
 const brandDrinks=brand=>brand?drinks.filter(drink=>drink.brand===brand.name):[];
 const exactDrink=brand=>brandDrinks(brand).find(drink=>norm(drink.name)===norm(inputs.drink.value));
 function setList(key,values){const unique=[...new Set(values.filter(Boolean))];lists[key].replaceChildren(...unique.map(text=>{const option=el('option');option.value=text;return option;}));}
 function groupLabels(group){if(!group)return[];if(group.mode==='fixed'){const fixed=group.choices.find(choice=>choice.id===group.fixedChoiceId);return fixed?[fixed.label]:[];}return group.choices.map(choice=>choice.label);}
 function optionsFor(brand,drink){const base=copyOptionsForBrand(brand);if(!brand||!drink)return base;const rawSizes=[...new Set([...(drink.cups||[]).map(c=>c.size),...(drink.variants||[]).map(v=>v.size)].filter(Boolean))],sizes=rawSizes.length?rawSizes.map(size=>drinkSizeLabel(drink,brand,size)):base.sizes,selectedSize=inputs.size.value.split(' · ')[0],cup=(drink.cups||[]).find(c=>c.size===selectedSize)||(drink.cups||[])[0],groups=TeaOptions.effectiveGroups(brand,drink,cup),role=name=>groups.find(group=>group.role===name);return {sizes,sugars:groupLabels(role('sweetness')).length?groupLabels(role('sweetness')):base.sugars,ices:groupLabels(role('temperature')).length?groupLabels(role('temperature')):base.ices,toppings:role('topping')?.choices?.map(choice=>({name:choice.label,price:choice.price}))||base.toppings};}
 function applyLists(brand,drink){const options=optionsFor(brand,drink);setList('size',options.sizes);setList('sugar',options.sugars);setList('ice',options.ices);setList('toppings',options.toppings.map(t=>t.name));}
 function closeSuggestions(key){const box=suggestions[key];if(!box)return;box.hidden=true;inputs[key].setAttribute('aria-expanded','false');}
 function renderSuggestions(key){const box=suggestions[key];if(!box||mode!=='catalog'){closeSuggestions(key);return;}const query=inputs[key].value.trim();let items=[];
  if(key==='brand')items=brands.filter(brand=>matches(brandTerms(brand),query)).slice(0,8).map(brand=>({label:brand.name,meta:(brand.aliases||[])[0]||'',run:()=>selectBrand(brand)}));
  else{const brand=exactBrand();if(brand)items=brandDrinks(brand).filter(drink=>matches([drink.name,drink.menuCategory,drink.note],query)).slice(0,10).map(drink=>({label:drink.name,meta:drink.menuCategory||'',run:()=>selectDrink(drink)}));}
  box.replaceChildren(...items.map(item=>{const button=btn('',()=>{item.run();closeSuggestions(key);},'quick-suggestion');button.setAttribute('role','option');button.append(el('strong',item.label),el('small',item.meta));return button;}));
  if(query&&!items.some(item=>norm(item.label)===norm(query))){const custom=btn('',()=>{closeSuggestions(key);inputs[key==='brand'?'brand':'drink'].focus();},'quick-suggestion quick-suggestion-custom');custom.append(el('strong','＋ 使用「'+query+'」'),el('small',key==='brand'?'作為自訂店家':'作為自填品項'));box.append(custom);}
  box.hidden=!box.children.length;inputs[key].setAttribute('aria-expanded',String(!box.hidden));
 }
 function clearDerived(keepDrink=true){for(const key of ['size','sugar','ice','milk','toppings'])inputs[key].value='';if(!keepDrink)inputs.drink.value='';lastDrinkId=null;}
 function selectBrand(brand){inputs.brand.value=brand.name;clearDerived(false);lastBrandKey=brand.name;update();renderSuggestions('drink');inputs.drink.focus();}
 function selectDrink(drink){inputs.drink.value=drink.name;clearDerived(true);lastDrinkId=drink.id;update();}
 function values(){return {...Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,input.value.trim()])),includeBrand:brandCheck.checked,separator:copySeparator,mode};}
 function saveMode(){Object.assign(quickDraft[mode],values());}
 function hydrate(){const draft=quickDraft[mode]||{};for(const [key,input] of Object.entries(inputs))input.value=draft[key]??(key==='quantity'?'1':'');brandCheck.checked=draft.includeBrand??false;lastBrandKey=null;lastDrinkId=null;}
 function applyMode(){const catalog=mode==='catalog';form.classList.remove('quick-mode-catalog','quick-mode-free');form.classList.add(catalog?'quick-mode-catalog':'quick-mode-free');modeHelp.textContent=catalog?'搜尋現有店家與飲料，自動帶入客製選項；仍可自行輸入。':'不使用菜單資料，所有內容都可以自行填寫。';labels.brand.textContent=catalog?'搜尋或輸入店家 *':'店家名稱（選填）';labels.drink.textContent=catalog?'搜尋或輸入飲料 *':'飲料名稱 *';inputs.brand.required=catalog;inputs.brand.placeholder=catalog?'輸入店名、英文或注音':'可填店家名稱，也可以留白';inputs.drink.placeholder=catalog?'搜尋店內飲料，或直接輸入品名':'輸入飲料名稱';for(const box of Object.values(suggestions))box.hidden=true;hydrate();update();}
 function update(source){let x=values(),brand=mode==='catalog'?exactBrand():null,brandKey=brand?.name||'';if(mode==='catalog'&&lastBrandKey!==null&&brandKey!==lastBrandKey)clearDerived(true);const drink=mode==='catalog'?exactDrink(brand):null;if(mode==='catalog'&&lastDrinkId!==null&&(drink?.id||null)!==lastDrinkId)clearDerived(true);applyLists(brand,drink);lastBrandKey=brandKey;lastDrinkId=drink?.id||null;const ready=mode==='free'||!!x.brand.trim();fields.disabled=!ready;copy.disabled=!ready;storeCard.replaceChildren();storeCard.hidden=true;if(brand){const card=createStoreDataCard(brand.name,true);if(card.children.length>1){storeCard.append(card);storeCard.hidden=false;}}x=values();Object.assign(quickDraft[mode],x);quickDraft.mode=mode;preview.value=quickOrderText({...x,brand:x.brand||'',drink:x.drink||'【飲料】',sugar:x.sugar||'【甜度】',ice:x.ice||'【冰量／溫熱】'});const msg=quickWarning(x);warning.textContent=msg;warning.hidden=!msg;status.textContent='';if(source==='brand'||source==='drink')renderSuggestions(source);}
 for(const input of Object.values(modeInputs))input.addEventListener('change',()=>{if(!input.checked)return;saveMode();mode=input.value;quickDraft.mode=mode;applyMode();});
 for(const key of ['brand','drink']){inputs[key].addEventListener('focus',()=>renderSuggestions(key));inputs[key].addEventListener('blur',()=>setTimeout(()=>closeSuggestions(key),160));}
 form.addEventListener('input',event=>update(event?.target?.name));
 form.addEventListener('submit',async e=>{e.preventDefault();Object.values(inputs).forEach(input=>input.setCustomValidity(input.required&&!input.value.trim()?'請填寫這個欄位':input.type==='number'&&input.value!==''&&(!Number.isInteger(Number(input.value))||Number(input.value)<0)?'請輸入非負整數，不接受小數':''));if(!form.reportValidity())return;copy.disabled=true;const ok=await copyText(quickOrderText(values()));copy.disabled=false;if(!modal.open)return;status.textContent=ok?'✓ 已複製，可以貼到群組囉！':'無法自動複製，請長按下方文字手動複製。';if(!ok){preview.focus();preview.select();}else toast('已複製飲料小抄');});
 Object.values(inputs).forEach(input=>input.addEventListener('input',()=>input.setCustomValidity('')));
 installCopyLayout(modal,inner,head,null,form,previewLabel,status,copy);applyMode();modal.showModal();document.body.classList.add('sheet-open');back.focus();
}
const warmTips=[
{brand:'再睡五分鐘',note:'熱飲為中杯，約 480ml'},
{brand:'一沐日',note:'熱飲僅 600ml'},
{brand:'得正',note:'溫／熱飲加收 5 元'},
{brand:'茶湯會',note:'熱飲僅提供中杯 16oz'},
{brand:'有飲',note:'溫熱飲僅提供中杯 500ml'},
{brand:'約翰紅茶公司',note:'熱飲僅提供中杯，加 5 元'},
{brand:'大茗',note:'熱飲僅提供中杯 600ml'},
{brand:'茶太 Chatime',note:'溫熱飲僅提供中杯 16oz'},
{brand:'龜記',note:'溫熱飲僅提供中杯'}
];
function openWarm(){const {modal,inner,back}=makeToolDialog('溫熱飲店家注意');modal.classList.add('copy-dialog','warm-dialog');inner.append(el('p','暖暖喝之前，先看看杯型與詳細規定。','warm-intro'));const published=globalThis.TEA_WARM_DRINK_SETTINGS,tips=Array.isArray(published?.items)?published.items:warmTips,list=el('div',undefined,'warm-list');for(const tip of tips){const row=el('article',undefined,'warm-item');row.append(el('strong',tip.brand),el('p',tip.note));list.append(row);}if(!tips.length)list.append(el('p','目前沒有需要特別提醒的店家。','warm-empty'));const date=published?.updatedAt?new Date(published.updatedAt).toLocaleDateString('zh-TW',{timeZone:'Asia/Taipei'}):'2026/10/19';inner.append(list,el('p','整理日期：'+date,'warm-date'));modal.showModal();document.body.classList.add('sheet-open');back.focus();}
$('open-quick').onclick=openQuick;if($('footer-quick'))$('footer-quick').onclick=openQuick;$('open-warm').onclick=openWarm;
const scrollTopButton=$('scroll-top'),mobileQuery=matchMedia('(max-width:720px)');let scrollFrame=false;
function updateScrollTop(){scrollFrame=false;document.body.classList.toggle('header-scrolled',window.scrollY>24);const hero=document.querySelector('.home-hero'),footer=document.querySelector('.footer-base');document.body.classList.toggle('header-on-paper',!!hero&&hero.getBoundingClientRect().bottom<70&&(!footer||footer.getBoundingClientRect().top>70));const visible=mobileQuery.matches&&window.scrollY>280&&!document.querySelector('dialog[open]');scrollTopButton.hidden=!visible;}
window.addEventListener('scroll',()=>{if(!scrollFrame){scrollFrame=true;requestAnimationFrame(updateScrollTop);}},{passive:true});mobileQuery.addEventListener('change',updateScrollTop);new MutationObserver(updateScrollTop).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});scrollTopButton.onclick=()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});updateScrollTop();
