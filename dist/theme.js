'use strict';
// Apply the saved appearance before the page paints. No account or API needed.
(function(){
 const key='copydrink-theme';
 const valid=value=>value==='light'||value==='dark';
 let current='light';
 try{const saved=localStorage.getItem(key);if(valid(saved))current=saved;}catch{}
 function apply(value){
  current=value;
  document.documentElement.setAttribute('data-theme',value);
  document.documentElement.style.colorScheme=value;
  for(const name of ['light','dark'])document.getElementById('theme-'+name)?.setAttribute('aria-pressed',String(name===value));
 }
 apply(current);
 document.addEventListener('DOMContentLoaded',()=>{
  apply(current);
  for(const name of ['light','dark'])document.getElementById('theme-'+name)?.addEventListener('click',()=>{apply(name);try{localStorage.setItem(key,name);}catch{}});
 });
 window.addEventListener('storage',event=>{if(event.key===key)apply(valid(event.newValue)?event.newValue:'light');});
})();
