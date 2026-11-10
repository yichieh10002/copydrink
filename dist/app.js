'use strict';
const $=id=>document.getElementById(id),RECENT='tea-recent-v2';
let s=defaults(),recents=[],teaDepth=history.state?.teaDepth||0;
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
const savedRecents=read(RECENT);
if(Array.isArray(savedRecents))recents=[...new Set(savedRecents.filter(name=>brands.some(b=>b.name===name)))].slice(0,4);

// This one input stays attached while a store's menu is filtered, preserving IME/focus.
function placeMenuSearch(target){const panel=$('search-panel'),destination=target||$('search-home');panel.hidden=!s.brand;if(panel.parentElement!==destination)destination.append(panel);}
function sync(){const input=$('search');input.value=s.q;input.placeholder=s.brand?`搜尋 ${s.brand} 的飲料`:'搜尋飲料';input.setAttribute('aria-label',s.brand?`搜尋${s.brand}的飲料`:'搜尋飲料');}
function render(){
 history.replaceState({teaState:{brand:s.brand,q:s.q,cats:[...s.cats],regions:[...s.regions]},teaDepth},'',location.href);
 $('back').hidden=!s.brand;document.body.classList.toggle('store-menu-page',!!s.brand);$('landing').hidden=!!s.brand;
 renderLanding();if(typeof renderStoreInfo==='function')renderStoreInfo();renderQuickMenu();
 if(s.brand){const heading=$('quick-menu').menuParts?.heading;if(heading)$('store-info').prepend(heading);}
}
function renderStoreSearch(){renderQuickMenu();history.replaceState({teaState:{brand:s.brand,q:s.q,cats:[...s.cats],regions:[...s.regions]},teaDepth},'',location.href);}
function setBrandUrl(brand){const url=new URL(location.href);if(brand)url.searchParams.set('brand',brand);else url.searchParams.delete('brand');if(url.href!==location.href){teaDepth++;history.pushState({teaDepth},'',url);}}
function enterBrand(brand){
 if(!brands.some(b=>b.name===brand))return;
 setBrandUrl(brand);s={...defaults(),brand};recents=[brand,...recents.filter(x=>x!==brand)].slice(0,4);store(RECENT,recents);sync();render();
 window.scrollTo({top:0,behavior:'instant'});
}
function home(){setBrandUrl('');s=defaults();sync();render();window.scrollTo({top:0,behavior:'instant'});}
$('go-home').onclick=home;$('back').onclick=()=>{if(teaDepth>0)history.back();else home();};
$('clear-recent').onclick=()=>{recents=[];store(RECENT,recents);renderLanding();};
function renderLanding(){
 $('recommended').replaceChildren();
 for(const b of brands){const button=btn('',()=>enterBrand(b.name),'store-button'),copy=el('span',undefined,'store-button-copy'),regions=Array.isArray(b.regions)?b.regions.filter(r=>r.enabled!==false):[],count=drinks.filter(d=>d.brand===b.name).length;copy.append(el('strong',b.name),el('small','查看菜單 →'),el('small',(regions.length?regions.length+' 個地區 · ':'')+count+' 款飲品','store-meta'));button.append(createBrandLogo(b),copy);$('recommended').append(button);}
 $('recent').replaceChildren(...recents.map(name=>{const chip=el('span',undefined,'recent-chip'),remove=btn('×',()=>{recents=recents.filter(x=>x!==name);store(RECENT,recents);renderLanding();},'remove-recent');remove.setAttribute('aria-label',`刪除 ${name} 的查詢紀錄`);chip.append(btn(name,()=>enterBrand(name)),remove);return chip;}));
 $('recent-section').hidden=!recents.length;
}
let storeComposing=false;
$('search').addEventListener('compositionstart',()=>{storeComposing=true;});
$('search').addEventListener('compositionend',()=>{storeComposing=false;s.q=$('search').value;renderStoreSearch();});
$('search').addEventListener('input',()=>{if(storeComposing)return;s.q=$('search').value;renderStoreSearch();});
$('search').addEventListener('keydown',event=>{if(event.isComposing||storeComposing)return;if(event.key==='Enter')event.preventDefault();});

const searchDialog=$('search-dialog'),globalInput=$('global-search'),globalResults=$('global-search-results');
let globalComposing=false,highlightTimer;
function openGlobalSearch(){if(searchDialog.open)return;renderGlobalResults();searchDialog.showModal();document.body.classList.add('sheet-open');globalInput.focus();}
function closeGlobalSearch(){searchDialog.close();}
$('open-search').onclick=openGlobalSearch;$('close-search').onclick=closeGlobalSearch;
searchDialog.addEventListener('close',()=>{globalComposing=false;if(!document.querySelector('dialog[open]'))document.body.classList.remove('sheet-open');});
searchDialog.addEventListener('click',event=>{if(event.target!==searchDialog)return;const r=searchDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeGlobalSearch();});
function selectGlobalResult(result){
 closeGlobalSearch();enterBrand(result.brand);
 requestAnimationFrame(()=>{
  const target=result.kind==='drink'?$('menu-item-'+result.id):$('quick-menu-title');if(!target)return;
  target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
  if(result.kind==='drink'){
   document.querySelectorAll('.search-highlight').forEach(node=>node.classList.remove('search-highlight'));
   target.classList.add('search-highlight');clearTimeout(highlightTimer);highlightTimer=setTimeout(()=>target.classList.remove('search-highlight'),2200);
   target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
 });
}
function renderGlobalResults(){
 const result=TeaSearch.findMatches({brands,drinks,types,q:globalInput.value});globalResults.replaceChildren();
 const hasQuery=!!normalize(globalInput.value);$('global-search-status').textContent=hasQuery?(result.total?`${result.total} 筆結果${result.total>result.items.length?`，先顯示 ${result.items.length} 筆，請增加關鍵字縮小範圍`:''}`:'找不到符合的店家或飲料，試試其他關鍵字。'):'選擇店家，或輸入想喝的飲料';
 if(!result.items.length){globalResults.append(el('p','換個品名、店名，或試試「鮮奶」「拿鐵」。','search-empty'));return;}
 let previousGroup='';
 for(const item of [...result.items.filter(x=>x.kind==='brand'),...result.items.filter(x=>x.kind==='drink')]){
  const group=item.kind==='brand'?(hasQuery?'店家':'探索店家'):'飲料';if(group!==previousGroup){globalResults.append(el('h3',group,'global-search-group'));previousGroup=group;}
  const brand=brands.find(b=>b.name===item.brand),row=btn('',()=>selectGlobalResult(item),'global-search-result'),text=el('span',undefined,'global-result-text');
  text.append(el('strong',item.kind==='brand'?item.brand:item.name),el('small',item.kind==='brand'?'查看店家菜單':`${item.brand} · ${item.category||''}`));
  const logo=createBrandLogo(brand);logo.setAttribute('aria-hidden','true');row.append(logo,text,el('span','↗','global-result-arrow'));globalResults.append(row);
 }
}
globalInput.addEventListener('compositionstart',()=>{globalComposing=true;});
globalInput.addEventListener('compositionend',()=>{globalComposing=false;renderGlobalResults();});
globalInput.addEventListener('input',()=>{if(!globalComposing)renderGlobalResults();});
globalInput.addEventListener('keydown',event=>{
 if(globalComposing||event.isComposing||event.keyCode===229)return;
 if(event.key==='Escape'){event.preventDefault();closeGlobalSearch();return;}
 if(event.key==='ArrowDown'){event.preventDefault();globalResults.querySelector('button')?.focus();}
 if(event.key==='Enter'){event.preventDefault();globalResults.querySelector('button')?.click();}
});
globalResults.addEventListener('keydown',event=>{
 if(!['ArrowDown','ArrowUp'].includes(event.key))return;const rows=[...globalResults.querySelectorAll('button')],index=rows.indexOf(document.activeElement);if(index<0)return;
 event.preventDefault();const next=index+(event.key==='ArrowDown'?1:-1);if(next<0)globalInput.focus();else rows[Math.min(next,rows.length-1)]?.focus();
});
function readBrandUrl(event){
 teaDepth=history.state?.teaDepth||0;const name=new URL(location.href).searchParams.get('brand'),old=event?history.state?.teaState:null;
 s={...defaults()};if(old&&brands.some(b=>b.name===old.brand)){s.brand=old.brand;s.q=typeof old.q==='string'?old.q:'';s.cats=Array.isArray(old.cats)?old.cats:[];s.regions=Array.isArray(old.regions)?old.regions:[];}else if(brands.some(b=>b.name===name))s.brand=name;
 if(s.brand){recents=[s.brand,...recents.filter(x=>x!==s.brand)].slice(0,4);store(RECENT,recents);}sync();render();
}
window.addEventListener('popstate',readBrandUrl);readBrandUrl();

// Reveal the closing statement when it enters the viewport. Decorative motion
// is skipped when the visitor asks the operating system to reduce motion.
const footerStatement=document.querySelector('.footer-statement');
if(footerStatement){
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reducedMotion||!('IntersectionObserver' in window))footerStatement.classList.add('is-visible');
 else{
  const footerObserver=new IntersectionObserver(entries=>{
   if(!entries.some(entry=>entry.isIntersecting))return;
   footerStatement.classList.add('is-visible');footerObserver.disconnect();
  },{threshold:.25});
  footerObserver.observe(footerStatement);
 }
}
