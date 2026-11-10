'use strict';
// DOM building blocks shared by store pages and copy dialogs.
function el(tag,txt,cls){const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n;}
function btn(txt,fn,cls){const b=el('button',txt,cls);b.type='button';b.onclick=fn;return b;}
function createBrandLogo(brand){const holder=el('span',brand.name[0],'logo');if(brand.logoUrl){const img=el('img');img.src=brand.logoUrl;img.alt=brand.name+' Logo';img.width=64;img.height=64;img.decoding='async';img.addEventListener('error',()=>{holder.replaceChildren(document.createTextNode(brand.name[0]));holder.classList.remove('logo-image');});holder.classList.add('logo-image');holder.replaceChildren(img);}return holder;}
