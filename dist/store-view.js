'use strict';
// Shared store overview; text and options come from the selected brand.
let topPicksReturnFocus=null;
let storeRuleReturnFocus=null;
function closeStoreRule(){const dialog=document.querySelector('.store-rule-dialog');if(dialog?.open)dialog.close();if(!document.querySelector('dialog[open]'))document.body.classList.remove('sheet-open');storeRuleReturnFocus?.focus();}
function openStoreRule(title,value,iconName){
  let dialog=document.querySelector('.store-rule-dialog');
  if(!dialog){
    dialog=el('dialog',undefined,'store-rule-dialog');
    dialog.addEventListener('cancel',event=>{event.preventDefault();closeStoreRule();});
    dialog.addEventListener('click',event=>{if(event.target===dialog)closeStoreRule();});
    document.body.append(dialog);
  }
  storeRuleReturnFocus=document.activeElement;
  const head=el('div',undefined,'store-rule-head'),titleWrap=el('div',undefined,'store-rule-title'),icon=el('span',undefined,'ui-icon icon-'+iconName),close=btn('關閉',closeStoreRule,'close-sheet');
  icon.setAttribute('aria-hidden','true');
  titleWrap.append(icon,el('h2',title));
  close.setAttribute('aria-label','關閉'+title+'說明');
  head.append(titleWrap,close);
  dialog.replaceChildren(head,el('p',value,'store-rule-value'));
  dialog.showModal();document.body.classList.add('sheet-open');close.focus();
}
function closeTopPicks(){const dialog=$('top-picks-dialog');if(dialog.open)dialog.close();if(!document.querySelector('dialog[open]'))document.body.classList.remove('sheet-open');topPicksReturnFocus?.focus();}
function openTopPicks(brand,items){const dialog=$('top-picks-dialog'),root=$('top-picks-content'),top=brand.topPicks||{},head=el('div',undefined,'top-picks-head'),copy=el('div'),close=btn('關閉',closeTopPicks,'close-sheet');topPicksReturnFocus=document.activeElement;root.replaceChildren();const title=el('h2',top.title||'必喝 TOP');title.id='top-picks-title';copy.append(el('span','EDITOR’S PICKS','top-picks-kicker'),title);if(top.description)copy.append(el('p',top.description,'top-picks-description'));close.setAttribute('aria-label','關閉必喝 TOP');head.append(copy,close);root.append(head);const list=el('div',undefined,'top-picks-list');items.forEach((drink,index)=>{const item=btn('',()=>{const returnTo=topPicksReturnFocus;dialog.close();document.body.classList.remove('sheet-open');requestAnimationFrame(()=>{returnTo?.focus();openOrder(drink.id);});},'top-picks-item'),number=el('span',String(index+1).padStart(2,'0'),'top-picks-rank'),text=el('span',undefined,'top-picks-item-copy'),line=el('span',undefined,'top-picks-item-line');line.append(el('strong',drink.name));const tags=drinkTags(drink).filter(tag=>tag!=='必喝 TOP');if(tags.length)line.append(tagGroup(tags.slice(0,3),'top-picks-tags'));text.append(line,el('small',drink.menuCategory||'飲料','top-picks-category'));const recommendation=top.notes?.[drink.id];if(recommendation)text.append(el('span','• '+recommendation,'top-picks-note'));item.append(number,text,el('span',quickMenuPrice(drink),'top-picks-price'),el('span','設定 →','top-picks-open'));list.append(item);});root.append(list);dialog.showModal();document.body.classList.add('sheet-open');close.focus();}
const topPicksDialog=$('top-picks-dialog');topPicksDialog.addEventListener('cancel',event=>{event.preventDefault();closeTopPicks();});topPicksDialog.addEventListener('click',event=>{if(event.target===topPicksDialog)closeTopPicks();});topPicksDialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('sheet-open');});
function renderStoreInfo(){
  const host=$('store-info');
  const menuHeading=[...host.children].find(node=>node.className==='menu-heading-slot');
  host.replaceChildren();
  host.hidden=!s.brand;
  if(!s.brand)return;
  if(menuHeading)host.append(menuHeading);

  const b=brands.find(b=>b.name===s.brand);
  const head=el('div',undefined,'store-heading');
  const title=el('div',undefined,'store-title'),availableRegions=(b.regions||[]).filter(region=>region.enabled!==false),summaryState={...completeMenuState(s),q:'',cats:[]},summaryItems=query(summaryState).yes.filter(d=>d.brand===b.name);
  title.append(el('h2',b.name),el('small',(availableRegions.length?availableRegions.length+' 個地區 · ':'')+summaryItems.length+' 款飲品','store-menu-count'));
  head.append(createBrandLogo(b),title);
  const headActions=el('div',undefined,'store-heading-actions'),topConfig=b.topPicks,topItems=topConfig?.enabled===true?(topConfig.itemIds||[]).map(id=>summaryItems.find(item=>item.id===id)).filter(Boolean):[];
  headActions.append(btn('複製店家連結',()=>shareBrand(b.name),'share-brand'));
  if(topItems.length)headActions.append(btn(`★ ${topConfig.title||'必喝 TOP'}・${topItems.length} 款`,()=>openTopPicks(b,topItems),'top-picks-trigger'));
  head.append(headActions);
  const shelf=el('div',undefined,'store-shelf');
  shelf.append(head);
  const panel=el('div',undefined,'store-information');
  panel.append(shelf);
  host.append(panel);

  const iceOptions=(b.ices||[]).join('・')||'冰量／溫熱選項尚未提供';
  const capacity=storeCapacityLabel(b);
  const cupCount=new Set(summaryItems.flatMap(item=>(item.variants||[]).map(variant=>variant.size)).filter(Boolean)).size;
  const essentials=[
    ['甜度',b.sugars?.length?b.sugars.join('・'):'級距待確認，固定甜度依品項標示','cube',b.sugars?.length||0],
    ['冰量／溫度',iceOptions,'snowflake',b.ices?.length||0],
    ['配料',b.toppings?.length?b.toppings.map(t=>t.name+' +$'+t.price).join('・'):'配料資料待確認','toppings',b.toppings?.length||0],
    ['杯型容量',capacity,'cup',cupCount]
  ];
  const essentialList=el('div',undefined,'store-essential-list');
  essentials.forEach(([title,value,iconName,count])=>{const row=el('div',undefined,'store-essential-row'),icon=el('span',undefined,'ui-icon icon-'+iconName),summary=btn(count?count+' 種':'查看',()=>openStoreRule(title,value,iconName),'store-essential-open');icon.setAttribute('aria-hidden','true');summary.setAttribute('aria-label','查看'+title+'完整內容');row.append(icon,el('strong',title),el('span',value,'store-essential-value'),summary);essentialList.append(row);});
  shelf.append(essentialList);

  const overview=el('section',undefined,'store-overview store-utility-section');
  const utility=createStoreDataCard(b.name,true);
  overview.append(utility);
  if(b.introduction?.content?.trim()){
    const introId='store-brand-introduction';
    const introPanel=el('div',undefined,'store-brand-panel');
    introPanel.id=introId;
    introPanel.hidden=true;
    introPanel.append(el('h3',b.introduction.title||'品牌介紹'),el('p',b.introduction.content,'brand-introduction-text'));
    const introButton=btn('＋ 品牌介紹',()=>{const opening=introPanel.hidden;introPanel.hidden=!opening;introButton.textContent=opening?'− 收起品牌介紹':'＋ 品牌介紹';introButton.setAttribute('aria-expanded',String(opening));},'store-intro-trigger');
    introButton.setAttribute('aria-expanded','false');
    introButton.setAttribute('aria-controls',introId);
    utility.append(introButton);
    overview.append(introPanel);
  }
  panel.append(overview);
}
